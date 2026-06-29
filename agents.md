# HireTrust AI Agent Guide

Este arquivo contém as diretrizes técnicas e arquiteturais fundamentais para agentes que operam no repositório **HireTrust**.

## 🏗️ Arquitetura do Monorepo
- **Gerenciamento de Pacotes:** Utilizamos `pnpm workspaces`.
- **Pipeline de Build:** Orquestrado pelo `Turborepo`.
- **Data Layer:** Prisma ORM (`packages/database`). Os tipos são gerados via `prisma generate`.
- **Blockchain Layer:** Hardhat (`packages/blockchain`). Utilizamos `Typechain` para tipagem estrita de contratos.
- **Frontend:** Next.js (App Router) em `apps/web`.

## 📜 Regras de Compilação e Qualidade
1. **Tipagem Estrita:** A flag `ignoreBuildErrors` no `next.config.js` DEVE ser mantida como `false`. O build deve falhar obrigatoriamente em caso de erros de tipo.
2. **Dependências Imutáveis:** Sempre utilize `pnpm install --frozen-lockfile`. O `pnpm-lock.yaml` é a única fonte de verdade.
3. **Resolução de Tipos Inter-workspaces:** Inconsistências de tipo entre pacotes locais e a aplicação devem ser resolvidas na raiz (ajustando exportações/tipos), nunca ignoradas.

## 🎨 Estilização (Tailwind v4)
- Utilizamos o novo motor do **Tailwind CSS v4** via `@tailwindcss/postcss`.
- **Proibido:** Uso de arquivos de configuração legados da v3 (`tailwind.config.js`).
- **Configuração:** O PostCSS deve utilizar apenas o plugin `@tailwindcss/postcss`. O arquivo CSS principal (`globals.css`) utiliza o import nativo: `@import "tailwindcss";`.

## 🧪 Testes e Verificação
- **Unitários:** `pnpm test:unit`
- **Blockchain:** `pnpm test:blockchain`
- **Pipeline Completo:** O comando `pnpm build` na raiz deve passar de ponta a ponta sem erros.

## 🚀 Setup Inicial
O repositório inclui um script oficial de inicialização: `.jules/setup.sh`. Sempre execute este script ao configurar o ambiente do zero.
