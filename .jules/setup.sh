#!/bin/bash
set -e

echo "🚀 Iniciando setup estrito do HireTrust..."

# 1. Instalação Clean (pnpm)
echo "📦 Instalando dependências com pnpm --frozen-lockfile..."
pnpm install --frozen-lockfile

# 2. Camada de Dados (Prisma)
echo "📂 Gerando Prisma Client..."
cd packages/database
pnpm prisma:generate
cd ../..

# 3. Camada de Smart Contracts (Hardhat + Typechain)
echo "⛓️ Compilando Smart Contracts e gerando Typechain..."
cd packages/blockchain
pnpm compile
cd ../..

# 4. Validação e Build Final (Turborepo)
echo "🏗️ Executando build completo do monorepo..."
pnpm build

echo "✅ Setup concluído com sucesso!"
