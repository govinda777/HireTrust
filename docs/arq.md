# 🏛️ Guia de Arquitetura e Padronização - HireTrust

Este documento define os padrões rigorosos de **DDD (Domain-Driven Design)**, **CQRS** e **Event Sourcing** para o monorepo HireTrust. Todos os desenvolvedores devem seguir estas diretrizes para garantir a consistência e escalabilidade do sistema.

---

## 1. O Fluxo de Dados (CQRS & Event Sourcing)

O sistema é dividido em dois modelos independentes que se comunicam via eventos:

### 🖋️ Write Model (Lado de Comando)
1. **Comando**: Uma intenção do usuário (ex: `SubmitServiceProofCommand`).
2. **Caso de Uso (Handler)**: Orquestra a execução. Recupera o Agregado, executa o método de domínio e salva no Event Store.
3. **Agregado (Aggregate Root)**: Valida as regras de negócio e gera **Eventos de Domínio**.
4. **Event Store**: Única fonte da verdade. Persiste o evento na tabela `Event`.

### 📖 Read Model (Lado de Consulta)
1. **Event Bus (RabbitMQ)**: Os eventos salvos no Event Store são publicados assincronamente.
2. **Worker (Projections)**: Escuta os eventos e atualiza tabelas otimizadas para leitura (ex: tabela `Agreement`).
3. **API (Query)**: Consulta diretamente o Read Model (Postgres) para exibir dados na UI.

---

## 2. Mapa da Estrutura de Pastas

```text
hiretrust-monorepo/
├── apps/
│   ├── web/ (Next.js - Write Model & UI)
│   │   ├── src/application/use-cases/    # Handlers de comandos
│   │   ├── src/infrastructure/messaging/ # Publicador RabbitMQ
│   │   └── src/app/                      # Roteamento Next.js (Server Actions/API)
│   └── worker/ (Node.js - Read Model & Effects)
│       ├── src/projections/              # Atualiza o Read Model (Postgres)
│       ├── src/orchestrators/            # Efeitos colaterais (ex: Chamar Blockchain)
│       └── src/infrastructure/messaging/ # Consumidor RabbitMQ
├── packages/
│   ├── shared/ (Núcleo do Domínio)
│   │   └── src/modules/
│   │       └── [modulo]/                 # Ex: agreement, escrow
│   │           ├── domain/
│   │           │   ├── model/            # Agregados e Entidades
│   │           │   ├── events/           # Classes de Eventos de Domínio
│   │           │   └── repositories/     # Interfaces de repositório
│   ├── database/ (Persistência)
│   │   ├── prisma/schema.prisma          # Modelos (EventStore + ReadModel)
│   │   └── src/repositories/             # Implementações concretas (Prisma)
│   └── blockchain/ (Contratos e Web3)
│       ├── contracts/                    # Solidity (AgreementRegistry, EscrowEngine)
│       └── typechain-types/              # Tipos gerados para o TS
└── docs/                                 # Documentação técnica
```

---

## 3. Templates de Implementação (Exemplo: SubmitServiceProof)

### A. Comando (apps/web)
```typescript
export class SubmitServiceProofCommand {
  constructor(
    public readonly agreementId: string,
    public readonly providerAddress: string,
    public readonly proofHash: string
  ) {}
}
```

### B. Agregado (packages/shared)
```typescript
export class Agreement extends AggregateRoot {
  public submitProof(proofHash: string): void {
    if (this.status !== 'ACTIVE') throw new Error("Agreement not active");

    this.apply(new ServiceProofSubmittedEvent(this.id, proofHash));
  }
}
```

### C. Evento de Domínio (packages/shared)
```typescript
export class ServiceProofSubmittedEvent extends DomainEvent {
  static readonly type = 'SERVICE_PROOF_SUBMITTED';
  constructor(
    public readonly aggregateId: string,
    public readonly proofHash: string
  ) {
    super(ServiceProofSubmittedEvent.type, aggregateId);
  }
}
```

---

## 4. Estratégia de Testes Inteligentes

O projeto utiliza **Turborepo** e **Vitest** para garantir que apenas o código alterado seja testado.

### 🧪 Testes de Unidade (Pre-commit)
*   **Foco**: Agregados, Regras de Negócio e Helpers.
*   **Local**: Arquivos `*.spec.ts` junto ao código.
*   **Execução**: Gatilho via Husky no `git commit`. Deve ser rápido e sem dependências externas.

### 🔌 Testes de Integração & E2E (Pre-push)
*   **Foco**: Fluxos completos (Comando -> Evento -> Projeção), Contratos Inteligentes e APIs.
*   **Local**: Arquivos `*.test.ts` ou pasta `tests/`.
*   **Execução**: Gatilho via Husky no `git push`. Valida a integração com Postgres, RabbitMQ e Hardhat.

---

## 5. Critérios de Conformidade (Checklist)
- [ ] O **Write Model** não faz `SELECT` em tabelas de projeção.
- [ ] O **Read Model** é atualizado exclusivamente por eventos.
- [ ] Entidades de domínio não possuem dependências de infraestrutura (Prisma/Web3).
- [ ] Todo evento possui `aggregate_type` e `aggregate_id`.
