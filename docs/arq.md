# Especificação Técnica de Arquitetura - HireTrust (Monorepo)

Esta documentação detalha a anatomia técnica do HireTrust, estruturada sob os pilares de **Clean Architecture**, **Event Sourcing** e **CQRS**.

---

## 1. Estrutura do Monorepo e DDD

O projeto utiliza **pnpm workspaces** para isolar as responsabilidades:

### 📦 packages/shared
Onde reside o núcleo do domínio (**Domain Core**) compartilhado entre o Web e o Worker.
*   `src/core/domain/`: Classes base como `Entity` e `BaseEvent`.
*   `src/modules/[modulo]/domain/model/`: *Aggregate Roots* (ex: `Agreement`) e entidades.
*   `src/modules/[modulo]/domain/events/`: Eventos de domínio (ex: `AgreementCreatedEvent`).
*   `src/modules/[modulo]/domain/repositories/`: Interfaces dos repositórios.

### 📦 packages/database
Gestão de persistência e repositórios concretos de infraestrutura.
*   `prisma/schema.prisma`: Modelos para **Event Store** e **Read Model** (Projections).
*   `src/repositories/`: Implementação do `PrismaEventStore`.

### 📦 packages/blockchain
Contratos inteligentes e adaptadores.
*   `contracts/`: Smart Contracts em Solidity (ex: `AgreementRegistry.sol`).
*   `scripts/`: Scripts de deploy e manutenção.

### 🚀 apps/web (Write Model)
Lado de comando (**Command Side**) da arquitetura CQRS.
*   `src/application/use-cases/`: Handlers que processam comandos, geram eventos e publicam no Event Bus.
*   `src/infrastructure/messaging/`: Adaptador para o RabbitMQ.

### ⚙️ apps/worker (Read Model / Projections)
Lado de consulta (**Query Side**) e integração assíncrona.
*   `src/projections/`: Transforma eventos em modelos de leitura no Postgres.
*   `src/infrastructure/blockchain/`: Aciona transações no Hardhat baseadas em eventos de domínio.

---

## 2. Fluxos Críticos

### UC-05 & UC-06: Fluxo Financeiro (v0.2 Preview)
O sistema integra o **Stark Bank SDK (Sandbox)** para faturamento via PIX. A confirmação do pagamento é o gatilho para a ativação do contrato no Cartório Digital.

### UC-08 a UC-11: Cartório Digital (v0.1)
O registro imutável do acordo ocorre on-chain através do `HardhatAdapter` no Worker, garantindo que cada assinatura de contrato seja ancorada na rede Base (testnet/local).
