# Arquitetura Profunda - HireTrust

Esta documentação detalha a anatomia técnica do HireTrust, estruturada sob os pilares de **Clean Architecture**, **Event Sourcing** e **CQRS**. O sistema é desenhado para ser "Evidência como Produto", garantindo que a lógica de negócio seja independente de protocolos de blockchain ou provedores de infraestrutura.


## 0. Estrutura de Pastas (Anatomia Real)

```text
src/
├── core/                       # Shared Kernel
│   ├── domain/                 # BaseAggregate, BaseEvent
│   └── shared-bus/             # EventBus (NATS/Redis)
└── modules/
    └── [module]/               # Ex: agreement, execution, settlement
        ├── domain/
        │   ├── model/          # Aggregate Roots, Entities, VOs (Sem frameworks)
        │   ├── events/         # Domain Events (Sourcing)
        │   └── repositories/   # Interfaces (Contratos de persistência/BC)
        ├── application/
        │   ├── use-cases/      # Command Handlers (Orquestração pura)
        │   └── services/       # Domain Services (Lógica multi-agregado)
        ├── infrastructure/
        │   ├── persistence/    # Repositories SQL (Prisma)
        │   ├── blockchain/     # Smart Contract Repositories (Viem/Ethers)
        │   └── adapters/       # Oráculos, Gateways, APIs
        └── read-side/
            ├── projections/    # Transforma Eventos -> Read Models (SQL/Redis)
            └── dtos/           # Modelos otimizados para consulta (DPO)
```

---

## 1. Módulo: Agreement (Contexto de Acordos/SLA)
Define as regras contratuais, parâmetros de SLA e as consequências financeiras (cashback/multas).

### 1.1 domain/model/
*   **Aggregate Root:** `Agreement`
    *   **Propriedades:** `AgreementID`, `ProviderID`, `SubscriberID`, `Status` (Draft, Active, Suspended, Terminated), `CycleConfig`, `TermsHash`.
    *   **Invariantes:**
        *   Um acordo só transita para `Active` se o `TermsHash` estiver ancorado on-chain e houver confirmação de assinatura de ambas as partes.
        *   O `Status` não pode ser alterado para `Active` se o `EscrowAccount` (Settlement) não estiver inicializado.
*   **Entities:** `Terms` (Definição técnica: periodicidade, métricas-alvo), `Offer` (O template original do prestador).
*   **Value Objects:**
    *   `SLAThreshold`: Valida percentuais (ex: 99.9%).
    *   `CompensationRule`: Estrutura composta (Métrica, Operador, Valor, Penalidade).
    *   `CurrencyAmount`: Objeto para valores monetários com precisão fixa.

### 1.2 application/use-cases/
*   **Command Handlers:**
    *   `ProposeAgreementHandler`: Orquestra a criação do rascunho e persiste no repositório local.
    *   `SignAgreementHandler`: Coleta assinaturas digitais, invoca o `IAgreementBlockchainRepository` para ancoragem e publica `AgreementSignedEvent`.
*   **Domain Services:**
    *   `SLAValidatorService`: Garante que as métricas definidas no contrato são compatíveis com os Oráculos disponíveis no sistema.

### 1.3 infrastructure/
*   **Interfaces (Contratos):**
    *   `IAgreementRepository`: Persistência de estado (ex: `PrismaAgreementRepository`).
    *   `ISmartContractAgreementRepository`: Interface que define métodos como `anchorTerms(termsHash)` e `getOnChainStatus(agreementId)`.
*   **Adaptadores:** `PrismaAgreementAdapter`, `ViemAgreementAdapter`.

### 1.4 read-side/projections/
*   **Projection:** `AgreementDashboardProjector`
*   **Estratégia:** Ouve `AgreementSigned` e cria uma linha na tabela `ActiveAgreements` otimizada para buscas por `SubscriberID`.

---

## 2. Módulo: Execution (Contexto de Prova de Serviço)
O coração técnico. Transforma dados brutos de monitoramento em provas criptográficas inquestionáveis.

### 2.1 domain/model/
*   **Aggregate Root:** `ServiceProof`
    *   **Propriedades:** `AgreementID`, `Interval`, `MerkleRoot`, `Proofs` (Lista de evidências), `ZKProofData`.
    *   **Invariantes:**
        *   O `MerkleRoot` é uma função pura dos hashes de todas as evidências coletadas no intervalo.
        *   Uma evidência só é aceita se vier de um `OracleID` autorizado no `Agreement`.
*   **Entities:** `Evidence` (Timestamp, Value, RawPayloadHash).
*   **Value Objects:**
    *   `MerkleTree`: Lógica de construção da árvore e geração de caminhos (proofs).
    *   `MetricValue`: Valor normalizado da métrica (Uptime: 1, Downtime: 0).

### 2.2 application/use-cases/
*   **Command Handlers:**
    *   `RegisterMetricHandler`: Recebe o payload do Oráculo. Se o evento for crítico (ex: queda detectada), gera imediatamente uma `MerkleProof` individual e publica `MetricRecordedEvent`.
    *   `ConsolidateIntervalHandler`: Fecha o ciclo, gera o `ZKProof` (atestando que o Uptime Médio > X% sem expor logs individuais) e publica `ServiceCycleClosedEvent`.
*   **Domain Services:**
    *   `ProofOrchestrator`: Abstrai a complexidade de geração de Merkle Trees e integração com circuitos ZK (ex: Circom/SnarkJS).

### 2.3 infrastructure/
*   **Interfaces (Contratos):**
    *   `IOracleProvider`: Contrato para adaptadores de métricas (Chainlink, Prometheus).
    *   `IZKProofGenerator`: Contrato para motores de prova (Gnark/Noir).
    *   `IServiceProofRepository`: Interface de persistência para as árvores de prova completas (off-chain).
*   **Adaptadores:** `ChainlinkFunctionsAdapter`, `K8sMetricsAdapter`.

### 2.4 read-side/projections/
*   **Projection:** `UptimeTimelineProjector`
*   **Estratégia:** Transforma os eventos de métrica em uma estrutura de Redis (Time Series) para renderização instantânea do gráfico de pulso no dashboard.

---

## 3. Módulo: Settlement (Contexto Financeiro/Trust)
Garante que o dinheiro flua apenas quando a prova de serviço é validada.

### 3.1 domain/model/
*   **Aggregate Root:** `EscrowAccount`
    *   **Propriedades:** `AgreementID`, `Balance`, `Allocation` (Split de taxas), `State` (Locked, Releasing, Completed).
    *   **Invariantes:**
        *   A liberação (`Release`) exige o `ServiceCycleClosedEvent` com o `MerkleRoot` validado.
        *   O saldo nunca pode ser negativo.
*   **Entities:** `Transaction` (Registro financeiro individual).
*   **Value Objects:**
    *   `PayoutSplit`: Define a divisão entre Prestador (ex: 95%) e Taxa de Plataforma (ex: 5%).
    *   `CashbackAmount`: Valor calculado com base na falha de SLA reportada.

### 3.2 application/use-cases/
*   **Command Handlers:**
    *   `ProcessSettlementHandler`: Ouve `ServiceCycleClosedEvent`. Consulta o estado do SLA no `ExecutionReadModel` e calcula o Payout final.
    *   `ExecutePayoutHandler`: Chama o `IEscrowBlockchainRepository` para disparar a transação on-chain e publica `PayoutExecutedEvent`.
*   **Domain Services:**
    *   `FinancialAuditor`: Verifica a integridade do saldo antes de qualquer liberação.

### 3.3 infrastructure/
*   **Interfaces (Contratos):**
    *   `IEscrowBlockchainRepository`: Interface para o Smart Contract de Tesouraria. Métodos: `lockFunds()`, `release(amount, proof)`.
    *   `IPaymentGateway`: Interface para rampa de saída (PIX).
*   **Adaptadores:** `ViemEscrowAdapter`, `StripeAdapter`.

### 3.4 read-side/projections/
*   **Projection:** `TransactionHistoryProjector`
*   **Estratégia:** Consolida transações off-chain e hashes on-chain em um modelo de extrato unificado.

---

## 4. Integração e Consistência (Mecânica Profunda)

### 4.1 Off-chain vs On-chain (Anchoring)
O HireTrust não tenta colocar tudo na blockchain. Ele usa o **Event Store** off-chain como fonte de verdade para a lógica e a **Blockchain** como um cartório de provas imutáveis.
1.  O `ExecutionModule` coleta 10.000 métricas (Event Store).
2.  Gera uma **Merkle Tree** dessas métricas.
3.  Apenas o **Merkle Root** é enviado para o Smart Contract (via `IServiceProofRepository`).
4.  No momento do pagamento, o `SettlementModule` envia o valor + o `MerkleRoot` para o contrato de Escrow.

### 4.2 Abstração de Chamadas Web3
Os *Domain Services* nunca veem um `provider.getSigner()` ou `contract.connect()`.
*   O `ExecutePayoutHandler` chama `IEscrowRepository.release(amount, proof)`.
*   A implementação `ViemEscrowAdapter` (na Infrastructure) traduz isso para uma chamada de função `releaseFunds` no Solidity, lidando com GAS, Nonces e Reverts.

---
