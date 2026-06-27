# HireTrust

**Hire-smart:** Gateway SaaS de serviços trustless e **Gerenciador de Assinaturas** com gestão automática de SLA via Blockchain. Utilizamos Smart SLAs, escrow e faturamento recorrente para garantir transparência total e segurança para as partes através de Proof-of-Service.

## 🚀 Visão Geral

O HireTrust é uma plataforma que automatiza a confiança e a gestão financeira entre contratantes e prestadores de serviços. Atuamos como um orquestrador que monitora o cumprimento de SLAs em tempo real, gerencia ciclos de assinatura (pagamentos recorrentes) e executa compensações automáticas (cashback) baseadas em evidências imutáveis.

## 📚 Documentação

Explore os detalhes do sistema:

*   [**Casos de Uso**](docs/use-case.md): Detalhamento dos atores e deep-dive técnico nos fluxos financeiros e SLA.
*   [**Arquitetura Técnica**](docs/arq.md): Anatomia profunda do sistema, DDD, Event Sourcing e integração Hardhat.
*   [**Visão Global e Fluxos**](docs/global-architecture.md): Diagramas de sequência detalhados dos processos críticos.
*   [**Roadmap Técnico**](docs/roadmap.md): Planejamento das fases de desenvolvimento, incluindo o motor de faturamento e governança.

## 🛠️ Tecnologias Chave

*   **Smart SLAs & Planos:** Contratos inteligentes que definem regras de serviço e tarifação.
*   **Gerenciador de Assinaturas:** Automação de ciclos de cobrança e controle de status (Ativo/Suspenso).
*   **Blockchain:** Cartório Digital para registro de provas de serviço e faturamento.
*   **Oráculos:** Validadores de métricas e consumo para faturamento variável (Pay-per-use).
*   **Escrow Automatizado:** Garantia de pagamento condicionada à performance.

## 👥 Atores

1.  **Plataforma:** Gateway e gerenciador central de assinaturas.
2.  **Prestador:** Fornecedor focado em performance e receita recorrente.
3.  **Assinante:** Cliente com gestão simplificada e proteção financeira.
4.  **Oráculos:** Agentes neutros de verificação.
