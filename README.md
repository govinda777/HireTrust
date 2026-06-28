# HireTrust Monorepo

**HireTrust** is a trustless service gateway and **Subscription Manager** with automatic SLA management via Blockchain. We use Smart SLAs, escrow, and recurring billing to ensure total transparency and security for all parties through Proof-of-Service.

## 🚀 Overview

This repository implements the HireTrust platform using a **Layered Onion Architecture**, **DDD**, **Event Sourcing**, and **CQRS**. It integrates SaaS agility (Next.js/Postgres) with Blockchain immutability (Hardhat/Base).

### Current Implementation Status (v0.1 & v0.2 Preview)
- **Camada 0 (Core):** Digital Notary (Cartório Digital) on-chain registration.
- **Camada 1 (Financial):** "Realistic" PIX integration via Stark Bank Sandbox.
- **Infrastructure:** Event Sourcing with Postgres Event Store and RabbitMQ Event Bus.

## 📂 Project Structure

- `apps/web`: Next.js frontend and command-side API (Write Model).
- `apps/worker`: Event processor and projection-side (Read Model + Blockchain Adapter).
- `packages/shared`: Domain Core (DDD), Entities, Events, and Interfaces.
- `packages/database`: Prisma schemas and Event Store implementation.
- `packages/blockchain`: Hardhat setup, Smart Contracts (Solidity), and deployment scripts.

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- pnpm
- Docker & Docker Compose

### 1. Setup Infrastructure
Start the local database, message broker, and blockchain node:
```bash
docker compose up -d
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Initialize Database
```bash
cd packages/database
pnpm prisma migrate dev
pnpm prisma generate
cd ../..
```

### 4. Deploy Smart Contracts
```bash
cd packages/blockchain
npx hardhat run scripts/deploy.ts --network localhost
cd ../..
```

### 5. Start the Services
In separate terminals:
```bash
# Start Web App
pnpm --filter @hiretrust/web dev

# Start Worker
pnpm --filter @hiretrust/worker dev
```

## 📚 Documentation

*   [**Detailed Architecture**](docs/arq.md): Domain structure, DDD, and pattern implementation.
*   [**Infrastructure**](docs/infra.md): Mappings between Local and Production (Vercel) environments.
*   [**Roadmap**](docs/roadmap.md): The "Onion Layer" development plan.

## 👥 Roles
1. **Provider:** Registers offers and performs services.
2. **Subscriber:** Signs agreements and pays via PIX.
3. **Oracles:** Monitors SLA and triggers automatic cashbacks.
