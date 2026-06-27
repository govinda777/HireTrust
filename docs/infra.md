# Infra

Para uma arquitetura **CQRS + Event Sourcing** estritamente para a realidade da sua infraestrutura e das limitações/características do ecossistema **Vercel** + **Ambiente Local (Docker)**.

A Vercel opera em um modelo *Serverless/Edge*, o que significa que o backend não pode manter conexões persistentes de longa duração (como WebSockets escutando o Hardhat) ou rodar daemons/workers contínuos diretamente nela. Portanto, precisamos de componentes gerenciados para o Event Bus e Projeções, mas que sejam fáceis de replicar localmente em um único `docker-compose`.

Aqui está o mapeamento exato da infraestrutura compliance para atender aos requisitos, funcionando de forma idêntica tanto na Vercel quanto no ambiente local.

---

## 🏗️ Mapeamento de Infraestrutura (Vercel vs. Local Dev)

Para garantir que o ambiente local seja idêntico ao de produção e fácil de destruir/subir (`docker compose down -v`), substituiremos serviços gerenciados de nuvem por imagens Docker equivalentes e leves:

| Elemento Arquitetural | Em Produção (Vercel / Nuvem) | No Ambiente Local (`docker-compose`) |
| --- | --- | --- |
| **Write Model (Event Store)** | **PostgreSQL** (ex: Neon / Supabase) | **Postgres (Docker Image)** |
| **Event Bus (Mensageria)** | **Upstash Kafka** ou **AWS SQS** (via HTTP) | **Apache Kafka** ou **RabbitMQ** (Docker) |
| **Read Model (Leitura)** | **Redis** (ex: Upstash) ou tabelas lidas no **Postgres** | **Redis** ou Segunda Instância/Tabela no **Postgres** |
| **Event Processor (Worker)** | **Vercel Cron / Background Jobs** (ex: Inngest) | **Worker Node.js (Docker)** rodando continuamente |

---

## 🔄 Fluxo de Dados Concreto com a Infraestrutura

Para que o CQRS + Event Sourcing funcione de forma desacoplada obedecendo às restrições da Vercel, o fluxo de infraestrutura segue o diagrama abaixo:

### 1. Camada de Escrita (Write Node - Vercel Serverless Function)

* O cliente inicia uma ação (ex: `AssinarContrato`).
* A Serverless Function do Next.js valida o comando e grava o evento bruto na tabela `event_store` do Postgres local.
* **Gatilho do Event Bus:** Logo após salvar no banco, a função publica o ID do evento no **Event Bus (Kafka/RabbitMQ)** via uma chamada HTTP ou conexão rápida. A Vercel responde imediatamente o frontend com status `202 Accepted` (Assíncrono).

### 2. O Event Bus & Worker Local (O Motor do Event Sourcing)

* No ambiente local, o **Event Bus** recebe a mensagem.
* O **Worker Container** (que localmente roda em background, e em produção seria disparado por um sistema de filas Serverless como Inngest ou QStash) captura o evento e faz duas coisas:
1. **Atualiza o Read Model:** Consolida o estado na tabela de leitura otimizada (Postgres/Redis).
2. **Dispara o Smart Contract:** Envia a transação correspondente para o nó local do **Hardhat**.



### 3. Camada de Leitura (Read Node - Vercel / Next.js)

* Quando o painel do Assinante (Dashboard de Disponibilidade - UC-12) pede o status do SLA, a rota do Next.js bate **diretamente no Read Model**. Não há processamento de regras de negócio ou varredura de histórico nesta etapa: a leitura é limpa, barata e ultra veloz.

---

## 🐳 O arquivo `docker-compose.yml` de Compliance Local

Para que qualquer desenvolvedor suba e destrua essa infraestrutura completa com `docker compose up --build` e `docker compose down -v`, a estrutura de serviços locais fica assim:

```yaml
version: '3.8'

services:
  # 1. Banco de Dados Unificado (Separado logicamente em Schemas/Tabelas de Leitura e Escrita)
  postgres-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: hiretrust
      POSTGRES_USER: local_user
      POSTGRES_PASSWORD: local_password
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  # 2. Event Bus Local (RabbitMQ ou Kafka - usando RabbitMQ por ser mais leve para Dev Local)
  event-bus:
    image: rabbitmq:3-management-alpine
    ports:
      - "5672:5672"   # AMQP Protocol
      - "15672:15672" # Painel de Controle UI (http://localhost:15672)

  # 3. Blockchain Local (Cartório Digital)
  hardhat-node:
    build: ./packages/blockchain
    ports:
      - "8545:8545"

  # 4. Worker Off-Chain (Consumidor do Event Bus e Atualizador de Projeções)
  # Este cara resolve a limitação da Vercel no ambiente de desenvolvimento local
  projection-worker:
    build: ./apps/worker
    environment:
      DATABASE_URL: postgres://local_user:local_password@postgres-db:5432/hiretrust
      RABBITMQ_URL: amqp://local_user:local_password@event-bus:5672
      HARDHAT_RPC_URL: http://hardhat-node:8545
    depends_on:
      - postgres-db
      - event-bus
      - hardhat-node

  # 5. Aplicação Next.js (Idêntica à Vercel)
  hiretrust-app:
    build: ./apps/web
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://local_user:local_password@postgres-db:5432/hiretrust
      RABBITMQ_URL: amqp://local_user:local_password@event-bus:5672
    depends_on:
      - postgres-db
      - event-bus

volumes:
  pgdata:

```

---

## 🛠️ Estrutura de Diretórios Proposta para o Repositório

Organizando o monorepo (`pnpm`) para refletir essa separação estrita de responsabilidades:

```text
hiretrust/
├── apps/
│   ├── web/               # Next.js (Frontend + Serverless Functions de Command e Query)
│   └── worker/            # Processador de eventos (Lê Event Bus, escreve Projeções e chama Hardhat)
├── packages/
│   ├── blockchain/        # Contratos Inteligentes, scripts do Hardhat e deploys locais
│   └── database/          # Schemas do Prisma/Drizzle (Tabela EventStore e tabelas ReadModel)
├── docker-compose.yml     # Infraestrutura local completa (Postgres, RabbitMQ, Hardhat, Worker)
└── pnpm-workspace.yaml

```

## 🎯 Por que isso resolve o seu problema?

1. **Compatível com a Vercel:** O código em `apps/web` só faz operações atômicas (escreve no banco e joga no Event Bus). Ele não sabe que existe um worker rodando infinitamente em background, o que preserva o comportamento Serverless exigido em produção.
2. **Fácil de Destruir/Criar:** Um comando `docker compose down -v` limpa os eventos do Postgres, remove as filas do RabbitMQ e reseta o estado do Hardhat. Ao subir de novo, o ambiente está 100% virgem para novos testes.
3. **Rigidez de Compliance:** Você tem o banco de escrita isolado guardando os eventos cronológicos, o Event Bus garantindo a entrega e o banco de leitura servindo o cliente de forma performática.
