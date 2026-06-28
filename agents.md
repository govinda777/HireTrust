# HireTrust - Agent Development Guide

Welcome, Agent. This guide provides the semantic and technical context needed to work effectively in the HireTrust repository.

## 🏗️ Architecture Overview

HireTrust is a trustless SaaS gateway with a hybrid architecture:

- **Web2 Layer (Next.js):** Frontend and Command API (Write Model) using App Router. Handles user interactions and initial transaction logging.
- **Web3 Layer (Hardhat/Solidity):** Smart Contracts on Base (Sepolia for sandbox). Manages Escrow, Agreement Registry, and SLA proofs.
- **Event Sourcing & CQRS:**
  - **Write Model:** Postgres (Neon) serves as the Event Store.
  - **Messaging:** RabbitMQ handles event distribution.
  - **Worker:** Off-chain processor that consumes events, updates the Read Model, and interacts with the Blockchain.
  - **Read Model:** Optimized Postgres tables for fast UI queries.

## 🛠️ Monorepo Commands (pnpm)

All commands should be run from the root unless specified:

- **Install Dependencies:** `pnpm install --frozen-lockfile`
- **Compile Contracts:** `pnpm run compile -w packages/blockchain` (or `pnpm --filter @hiretrust/blockchain compile`)
- **Run Tests:** `pnpm test`
- **Database Migrations:** `pnpm --filter @hiretrust/database prisma:migrate`
- **Generate Prisma Client:** `pnpm --filter @hiretrust/database prisma:generate`
- **Start Services:** `pnpm dev` (Turbo-managed parallel start)

## 📜 Development Guidelines

1. **Smart Contracts First:** Always recompiles contracts (`pnpm --filter @hiretrust/blockchain compile`) after any change in `.sol` files to ensure Typechain types are up to date.
2. **Injected Providers for Testing:** Use injected providers (Hardhat Ethers) for integration tests to bypass Privy's visual login and ensure deterministic results.
3. **Sandbox Strictness:** Ensure all external API calls (Stark Bank, Oracles, RPCs) point strictly to sandbox/testnet endpoints. Never use production keys.
4. **No Internal Mocks:** Favor integration tests with local Docker services (Postgres, RabbitMQ, Hardhat Node) over internal mocks for core business logic.
5. **Idempotency:** When implementing Web2 -> Web3 flows, always use a `CorrelationID` to ensure transactions are not duplicated.

## 🔑 Environment Variables

The environment depends on:
- `DATABASE_URL`: Neon/Postgres connection string.
- `RABBITMQ_URL`: Connection for the event bus.
- `HARDHAT_RPC_URL`: URL for the Hardhat node (usually http://localhost:8545).
- `PRIVATE_KEY`: For the worker/deployer wallet.
- `NEXT_PUBLIC_PRIVY_APP_ID`: For authentication.
