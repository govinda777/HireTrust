# Arquitetura Profunda e Referência - HireTrust (SaaS Trustless)

Esta arquitetura utiliza os princípios de **Clean Architecture**, **Event Sourcing** e **CQRS** para transformar o HireTrust em um sistema de "Evidência como Produto".

A estrutura abaixo separa estritamente a **Lógica de Negócio (Domínio)**, a **Orquestração (Aplicação)** e os **Detalhes Técnicos (Infraestrutura)**.

### Estrutura de Pastas Expandida

```text
/src
├── core/                       # Kernel Compartilhado (DDD Building Blocks)
│   ├── domain/                 # BaseAggregate, BaseEvent, BaseValueObject, UniqueEntityID
│   └── shared-bus/             # EventBus (NATS/Redis), MessageDispatcher
├── modules/
│   ├── identity/               # Contexto de Identidade (Privy/Web3 Auth)
│   │   ├── domain/             # Agregado: ActorIdentity
│   │   ├── application/        # Handlers: LinkWallet, Authenticate
│   │   └── infrastructure/     # Adapters: PrivyAdapter
│   ├── agreement/              # Contexto de Acordos (Marketplace, Fases e Termos)
│   │   ├── domain/             # Agregados: ServiceOffer, Agreement, SecretVault, Review
│   │   ├── application/        # Commands: ProposeAgreement, SignAgreement, ApprovePhase, SubmitReview
│   │   └── infrastructure/     # Adapters: Prisma, VaultProvider
│   ├── execution/              # Contexto de Prova de Serviço (O "Proof" & Gatekeeper)
│   │   ├── domain/             # Agregado: ServiceProof (MerkleTree, HashChain)
│   │   ├── application/        # Handlers: RegisterMetric, ProvisionAccess
│   │   └── infrastructure/     # Adapters: Helicone, Chainlink, OracleProvider
│   └── settlement/             # Contexto Financeiro (O "Trust" & Escrow)
│       ├── domain/             # Agregado: EscrowAccount, Entidades: Transaction
│       ├── application/        # Handlers: FundEscrow, ReleasePayment, ExecuteRefund
│       └── infrastructure/     # Adapters: Viem, Stripe, PaymentGateway
├── read-side/                  # O Lado de Consulta (CQRS - Projeções otimizadas)
│   ├── dashboard/              # ViewModels: ActiveAgreements, UptimeTimeline
│   └── transparency/           # Validators: AuditTrailGenerator, BlockchainVerifier
└── tests/
    ├── bdd/                    # Especificações Gherkin (.feature)
    └── unit/                   # Testes de unidade dos Agregados (Puros)
```

---

### Detalhes Estratégicos da Arquitetura

#### 1. A Camada de Domínio (`domain/`)
Aqui não há frameworks. Se você decidir trocar o Next.js por NestJS ou o banco de dados, o seu código de negócio (regras de multa, cálculos de uptime) permanece intacto.
*   **Aggregates:** Garantem a consistência. O `Agreement` não pode ser assinado se o status for `Terminated`.
*   **Value Objects:** Protegem os dados. O `UptimePercentage` não é um `number` comum, é um VO que valida se está entre 0 e 100.

#### 2. A Camada de Infraestrutura (`infrastructure/`)
Aqui isolamos os "External Agents":
*   **Blockchain Adapters:** Encapsulam a complexidade do `ethers.js` ou `viem`. O restante do sistema não sabe como o contrato on-chain funciona, apenas chama métodos como `anchorTerms()`.
*   **Oráculos:** O módulo `execution` trata o `Chainlink` e o `Helicone` como interfaces. Se amanhã você trocar o provedor, só precisa implementar o novo adaptador que segue a interface esperada.

#### 3. A Camada de Leitura (`read-side/`)
Esta é a chave para a performance do marketplace e dashboards.
*   Em um sistema **Event Sourcing**, você nunca faz `SELECT SUM(valor) FROM escrows`.
*   Em vez disso, o `SettlementModule` publica um evento `PaymentReleased`. O projetor ouve esse evento e incrementa o saldo em uma tabela de leitura pronta para o front-end. **Isso elimina queries complexas e garante velocidade.**

#### 4. O Sistema de Auditoria (Transparência)
A pasta `read-side/transparency` é o que gera a **"Nota Fiscal Blockchain"** (UC-16). Ela lê o `EventStore` de todos os módulos e gera uma prova de integridade (Hash final) que o assinante usa para verificar se o sistema não alterou os dados retroativamente.

---

## Detalhamento Técnico Profundo dos Módulos

### 1. Módulo: Agreement (Marketplace e Workflow)
Responsável por orquestrar a intenção de negócio e o workflow de aprovação entre fases.
*   **Agregados:**
    *   `ServiceOffer`: Gerencia a vitrine de serviços e as definições genéricas de fases.
    *   `Agreement`: Gerencia o workflow dinâmico de fases. Possui uma coleção de `ServicePhase` e um `currentPhaseIndex`.
    *   `SecretVault`: Ambiente criptografado compartilhado.
*   **Invariantes:** Uma fase só é ativada se a fase imediatamente anterior no índice estiver com status `COMPLETED`.
*   **Workflow Dinâmico:** Suporta N fases (Milestones, Recorrências, Setup). Cada fase define seu preço e tipo (Fixo ou Recorrente).

### 2. Módulo: Execution (Gatekeeper e Provas)
O coração técnico que garante que o serviço contratado foi efetivamente entregue.
*   **Gatekeeper (Helicone):** Provisiona chaves de API com `budget_cap`. Ativado automaticamente para fases do tipo `RECURRING` assim que estas entram em vigor.
*   **Prova de Serviço:** Utiliza **Merkle Trees** e **ZK-Proofs** para atestar o cumprimento do SLA.

### 3. Módulo: Settlement (Escrow e Comissões)
Gerencia a liquidez e garante que o repasse só ocorra quando a regra de negócio for respeitada.
*   **Regra de Comissão:** Retida atomaticamente no momento do financiamento inicial do Escrow Pool.
*   **Liquidação:** O `Release` ocorre proporcionalmente ao preço da fase aprovada.

### 4. Módulo: Identity (Privy & Embedded Wallets)
Responsável pela ponte entre a identidade social e a carteira digital.
*   **Privy:** Gera automaticamente uma *Embedded Wallet* no login, servindo como o ID único do usuário na Web3.

---

### Como esta estrutura escala?
*   **Flexibilidade de Fases:** O sistema não está preso a "Setup" e "Manutenção". Ele pode suportar "Setup", "Sprint 1", "Sprint 2", "QA", "Go-live" e "Suporte Mensal".
*   **BDD First:** O comportamento do usuário (assinante e prestador) guia a implementação das máquinas de estado das fases.
