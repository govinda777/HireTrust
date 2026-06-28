# 🏛️ Guia de Arquitetura e Padronização - HireTrust

Este documento define os padrões rigorosos de **DDD (Domain-Driven Design)**, **CQRS** e **Event Sourcing** para o monorepo HireTrust.

---

## 1. O Fluxo de Dados (CQRS & Event Sourcing)

O sistema opera com uma separação estrita entre a escrita (Commands) e a leitura (Queries).

### 🖋️ Command Side (Write Model)
1. **Command**: Objeto de transferência de dados que representa uma intenção do usuário (ex: `SubmitServiceProofCommand`).
2. **Command Handler**: Orquestrador que:
   - Recupera o **Aggregate Root** do **Event Store**.
   - Invoca a lógica de negócio no Agregado.
   - Persiste os novos **Domain Events** gerados de volta no Event Store.
3. **Aggregate Root**: Entidade que encapsula estado e garante a consistência das regras de negócio.
4. **Event Store**: Banco de dados de eventos (Tabela `Event`), única fonte da verdade.

### 📖 Query Side (Read Model)
1. **Event Bus**: Publica eventos de forma assíncrona.
2. **Projection Worker**: Consome eventos e popula o **Read Model** (tabelas otimizadas como `Agreement`).
3. **Query**: Objeto que define os filtros de busca.
4. **Query Handler**: Lê diretamente do Read Model e retorna DTOs para a UI.

---

## 2. Mapa da Estrutura de Pastas

```text
hiretrust-monorepo/
├── apps/
│   ├── web/ (Write & UI)
│   │   ├── src/application/commands/     # Intenções de escrita
│   │   ├── src/application/queries/      # Intenções de leitura
│   │   ├── src/application/handlers/     # Handlers de Commands e Queries
│   │   └── src/app/                      # Camada de Apresentação (Next.js)
│   └── worker/ (Read & Side Effects)
│       ├── src/projections/              # Projetores para o Read Model
│       └── src/orchestrators/            # Efeitos colaterais on-chain
├── packages/
│   ├── shared/ (Domain Core)
│   │   └── src/modules/
│   │       └── [modulo]/
│   │           ├── domain/
│   │           │   ├── model/            # Agregados (Pure Domain)
│   │           │   ├── events/           # Domain Events
│   │           │   └── value-objects/    # Objetos de Valor
│   │           └── dtos/                 # DTOs de Saída do Read Model
│   ├── database/ (Infraestrutura)
│   │   ├── prisma/schema.prisma          # EventStore + ReadModel schemas
│   │   └── src/repositories/             # Implementações concretas
│   └── blockchain/ (Web3 Layer)
└── docs/
```

---

## 3. Exemplo de Implementação CQRS Completa

### A. Escrita (Command Handler)
```typescript
// apps/web/src/application/handlers/submit-service-proof.handler.ts
export class SubmitServiceProofHandler {
  async handle(command: SubmitServiceProofCommand) {
    const agreement = await this.eventStore.load(Agreement, command.agreementId);
    agreement.submitProof(command.proofHash);
    await this.eventStore.save(agreement);
  }
}
```

### B. Leitura (Query Handler)
```typescript
// apps/web/src/application/handlers/get-provider-agreements.handler.ts
export class GetProviderAgreementsHandler {
  async handle(query: GetProviderAgreementsQuery): Promise<AgreementDTO[]> {
    return this.prisma.agreement.findMany({
      where: { providerId: query.providerId }
    });
  }
}
```

---

## 4. Estratégia de Testes

- **Unitários (Unit)**: Testam o Agregado em isolamento.
- **Integração (Integration)**: Testam Command Handlers + Event Store.
- **E2E**: Testam o fluxo completo Command -> Worker -> Query.

---

## 5. Regras de Ouro
1. **NUNCA** faça joins entre tabelas de domínio e tabelas de projeção.
2. **NUNCA** atualize o Read Model diretamente do Write Model.
3. O Agregado deve ser reconstruído a partir dos eventos (re-hydration).
