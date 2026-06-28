#!/bin/bash
set -e

echo "🚀 Starting HireTrust environment setup..."

# 1. Activate corepack and pnpm
echo "📦 Activating corepack and pnpm..."
corepack enable
corepack prepare pnpm@latest --activate

# 2. Installation of dependencies
echo "📥 Installing dependencies..."
# Using --no-frozen-lockfile as the environment was dirty or policies were tight
pnpm install --no-frozen-lockfile

# 3. Compile Smart Contracts
echo "⛓️ Compiling Smart Contracts..."
pnpm --filter @hiretrust/blockchain compile

# 4. Generate Database Client
echo "🗄️ Generating Prisma Client..."
pnpm --filter @hiretrust/database prisma:generate

# 5. Verify Next.js build (integrity check)
echo "🏗️ Verifying Next.js build integrity..."
pnpm --filter @hiretrust/web build

echo "✅ Environment setup complete!"
