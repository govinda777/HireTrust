# Architecture

Esta arquitetura expandida utiliza os princípios de **Clean Architecture**, **Event Sourcing** e **CQRS** para transformar o HireTrust em um sistema de "Evidência como Produto".

A estrutura abaixo separa estritamente a **Lógica de Negócio (Domínio)**, a **Orquestração (Aplicação)** e os **Detalhes Técnicos (Infraestrutura)**.

### Estrutura de Pastas Expandida

```text
/src
├── core/                       # Kernel Compartilhado (DDD Building Blocks)
│   ├── domain/                 # BaseAggregate, BaseEvent, BaseValueObject, UniqueEntityID
│   └── shared-bus/             # EventBus (NATS/Redis), MessageDispatcher
├── modules/
│   ├── agreement/              # Contexto de Acordos (O "SLA")
│   │   ├── domain/             # Agregado: Agreement, Entidades: Offer, Terms
│   │   ├── application/        # Commands: ProposeAgreement, SignAgreement, AmendTerms
│   │   └── infrastructure/     # BlockchainAdapters (Registry, EventIndexer), PrismaSchema
│   ├── execution/              # Contexto de Prova de Serviço (O "Proof")
│   │   ├── domain/             # Agregado: ServiceProof (MerkleTree, HashChain)
│   │   ├── application/        # Handlers: CollectMetric, VerifyEvidence, TriggerBreach
│   │   └── infrastructure/     # Adapters: ChainlinkFunctions, PythNetwork, LogchainAdapter
│   └── settlement/             # Contexto Financeiro (O "Trust")
│       ├── domain/             # Agregado: EscrowAccount, Entidades: CashbackRules
│       ├── application/        # Handlers: FundEscrow, ReleasePayment, ExecuteRefund
│       └── infrastructure/     # Adapters: BankMockAPI (PIX), TokenBridge, PaymentGateway
├── read-side/                  # O Lado de Consulta (CQRS - Projeções otimizadas)
│   ├── dashboard/              # ViewModels: UptimeHistory, BillingReport
│   └── transparency/           # Validators: AuditTrailGenerator, BlockchainVerifier
└── tests/
    ├── bdd/                    # Especificações Gherkin (.feature)
    └── unit/                   # Testes de unidade dos Agregados (Puros)

```

---

### Detalhes Estratégicos da Arquitetura

#### 1. A Camada de Domínio (`domain/`)

Aqui não há frameworks. Se você decidir trocar o `Next.js` por `NestJS` ou o banco de dados, o seu código de negócio (regras de multa, cálculos de uptime) permanece intacto.

* **Aggregates:** Garantem a consistência. O `Agreement` não pode ser assinado se o status for `Terminated`.
* **Value Objects:** Protegem os dados. O `UptimePercentage` não é um `number` comum, é um VO que valida se está entre 0 e 100.

#### 2. A Camada de Infraestrutura (`infrastructure/`)

Aqui isolamos os "External Agents":

* **Blockchain Adapters:** Encapsulam a complexidade do `ethers.js` ou `viem`. O restante do sistema não sabe como o contrato on-chain funciona, apenas chama métodos como `registerEvidence()`.
* **Oráculos:** O módulo `execution` trata o `ChainlinkOracle` como uma interface. Se amanhã você trocar o oráculo, só precisa implementar o novo adaptador que segue a interface esperada.

#### 3. A Camada de Leitura (`read-side/`)

Esta é a chave para a performance do dashboard.

* Em um sistema **Event Sourcing**, você nunca faz `SELECT SUM(valor) FROM escrows`.
* Em vez disso, o `SettlementModule` publica um evento `PaymentReleased`. O projetor na pasta `read-side/` ouve esse evento e incrementa o saldo da carteira do prestador em uma tabela de leitura pronta para o front-end. **Isso elimina queries complexas e garante velocidade.**

#### 4. O Sistema de Auditoria (Transparência)

A pasta `read-side/transparency` é o que gera a **"Nota Fiscal Blockchain"** (UC-16). Ela lê o `EventStore` de todos os módulos e gera uma prova de integridade (Hash final) que o assinante usa para verificar se o sistema não alterou os dados retroativamente.

### Como esta estrutura escala?

* **Adição de Módulos:** Se o HireTrust precisar de um módulo de `Compliance/KYC` amanhã, você apenas cria `modules/compliance/` e segue o mesmo padrão.
* **BDD First:** Antes de escrever o código de `application/`, você escreve o `.feature` em `tests/bdd/`. Isso força você a pensar no comportamento do usuário (o Assinante) antes da complexidade técnica.

**Você sente que esta arquitetura cobre todas as necessidades de "Trustless" que você levantou nos documentos, ou há algum processo de orquestração (como o fatiamento de recursos do estudo do GERCOM) que precisa de um módulo específico?**
