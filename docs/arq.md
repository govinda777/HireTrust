# Anatomia Profunda da Arquitetura - HireTrust

Esta documentação detalha a implementação real da arquitetura do HireTrust, estruturada em sub-níveis técnicos dentro da estrutura de pastas `/src`.

---

## 1. Módulo: Agreement (Marketplace, Fases e Termos)
Responsável por orquestrar a intenção de negócio e o workflow de aprovação.

### 1.1 domain/model/
*   **Aggregate Root:** `ServiceOffer`
    *   **Invariantes:**
        *   Toda oferta deve definir pelo menos uma `ServicePhase`.
        *   A comissão da plataforma (`CommissionRate`) deve estar entre 0% e 100%.
    *   **Value Objects:** `PhaseDefinition`, `Price`, `TermsContent`.
*   **Aggregate Root:** `Agreement`
    *   **Propriedades:** `AgreementID`, `SubscriberID`, `ProviderID`, `CurrentPhase`, `Status`.
    *   **Invariantes:**
        *   Um acordo só transita para `ACTIVE` se houver assinatura digital (Privy) e financiamento do Escrow.
        *   A Fase 2 só pode ser iniciada após o evento `PhaseApproved` da Fase 1.
*   **Aggregate Root:** `SecretVault`
    *   **Entities:** `VaultSecret` (ID, EncryptedData, SharedWith[]).
    *   **Invariantes:** Acesso exclusivo aos proprietários do `AgreementID` associado.

### 1.2 application/use-cases/ (Command Handlers)
*   **`ProposeAgreementHandler`**: Orquestra a criação do rascunho. Não acessa o banco diretamente, usa o `IAgreementRepository`.
*   **`ApprovePhaseHandler`**:
    1. Valida se a fase atual está marcada como entregue.
    2. Invoca o `ISettlementService` para liberar fundos.
    3. Atualiza o estado do `Agreement` para a próxima fase.
    4. Dispara `AgreementPhaseTransitionedEvent`.

### 1.3 infrastructure/ (Adaptadores e Contratos)
*   **`IAgreementRepository`**: Persistência em PostgreSQL via Prisma.
*   **`ISmartContractAgreementRepository`**: Interface para ancoragem on-chain.
    *   *Contrato:* `anchorTerms(hash: string): Promise<TxHash>`.
*   **`IVaultProvider`**: Interface para o cofre criptográfico (ex: Vault do Hashicorp ou solução baseada em AWS KMS).

### 1.4 read-side/projections/
*   **`AgreementDashboardProjector`**: Ouve `AgreementCreated`, `PhaseApproved` e `AgreementSuspended`.
*   **Estratégia:** Transforma o log de eventos em uma tabela `active_agreements_view` para o dashboard do assinante.

---

## 2. Módulo: Execution (Gatekeeper e Proof-of-Service)
Foco na integração de provas criptográficas e controle de acesso.

### 2.1 domain/model/
*   **Aggregate Root:** `ServiceProof`
    *   **Invariantes:**
        *   O `MerkleRoot` é recalculado atomaticamente a cada `EvidenceAdded`.
        *   A prova de ZK (`ZKProof`) deve ser validada contra os parâmetros do SLA do `Agreement`.
    *   **Value Objects:** `MerkleTree`, `ZKProofData`, `SLAThresholds`.
*   **Entities:** `Evidence` (Data, Source, Hash).

### 2.2 application/use-cases/
*   **`RegisterMetricHandler`**: Recebe dados brutos dos Oráculos. Abstrai a lógica de infraestrutura delegando a criação da evidência para o Agregado.
*   **`ProvisionAccessHandler`**: Domain Service que decide, baseado no status do `Agreement`, se deve ativar ou revogar chaves de acesso.

### 2.3 infrastructure/
*   **`IResourceGatekeeper`**: Interface para controle de acesso.
    *   *Implementação:* `HeliconeAdapter` (Gera Scoped Keys com budget cap).
*   **`IZKProofGenerator`**: Interface para motores de prova (Gnark/Noir).
*   **`IOracleProvider`**: Adaptadores para Chainlink ou Watchdogs customizados.

---

## 3. Módulo: Settlement (Escrow e Finanças)
Gerencia a liquidez e as regras de comissão.

### 3.1 domain/model/
*   **Aggregate Root:** `EscrowAccount`
    *   **Regras Intrínsecas:**
        *   Retenção de comissão no `Deposit`.
        *   Liberação bloqueada sem `EvidenceVerified`.
    *   **Value Objects:** `PayoutSplit`, `Currency`.

### 3.2 application/use-cases/
*   **`ExecutePayoutHandler`**: Abstrai a chamada blockchain.
    1. O Domain Service `PayoutOrchestrator` verifica as condições.
    2. Chama `IEscrowBlockchainRepository.releaseFunds()`.

---

## 4. Integração Smart Contract (Abstração)

Para evitar o acoplamento com `ethers.js` ou `viem` na camada de aplicação:

1.  **Interface no Domain/Repositories:** `ISmartContractRepository`.
2.  **Uso no Application:** `await this.scRepository.register(data)`.
3.  **Implementação na Infrastructure:** `ViemAdapter` que lida com ABIs, RPCs e GAS.

Isso permite que o HireTrust troque de blockchain (L1 -> L2) apenas alterando o adaptador na camada de infraestrutura.

---

## 5. Fluxo Event Sourcing e CQRS

1.  **Ação:** Usuário aprova fase.
2.  **Comando:** `ApprovePhaseCommand`.
3.  **Estado:** `Agreement` publica `PhaseApprovedEvent`.
4.  **Projeção:** `SettlementProjector` ouve e move o saldo da "Conta de Garantia" para "Disponível para Repasse" no banco de leitura.
5.  **Consistência:** O estado On-chain é atualizado de forma assíncrona pelo `SettlementBlockchainAdapter` ouvindo o mesmo evento.
