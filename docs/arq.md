# Especificação Técnica de Arquitetura - HireTrust

Esta documentação detalha a anatomia técnica do HireTrust, estruturada sob os pilares de **Clean Architecture**, **Event Sourcing** e **CQRS**. O sistema é desenhado como um sistema distribuído híbrido, integrando a agilidade do SaaS (Next.js/Neon) com a imutabilidade da Blockchain (Hardhat/Smart Contracts).

---

## 1. Estrutura de Domínio e Sub-níveis Técnicos (DDD)

A implementação física em `/src` segue rigorosamente a separação de preocupações:

*   **domain/model/**: Contém *Aggregate Roots* (ex: `Agreement`, `ServiceProof`, `EscrowAccount`), Entidades e *Value Objects* (ex: `SLAThreshold`, `MerkleRoot`). As regras de negócio são protegidas por invariantes (ex: um Escrow não pode ser liberado sem uma prova de serviço validada).
*   **application/use-cases/**: Orquestração pura. Contém *Command Handlers* que executam a lógica de negócio sem vazar detalhes de infraestrutura.
*   **infrastructure/**: Adaptadores de baixo nível.
    *   `BlockchainAdapter`: Encapsula a complexidade do `ethers.js` ou `viem` para interagir com o Hardhat.
    *   `PaymentGateway`: Interface com APIs bancárias simuladas para fluxos de PIX.
*   **read-side/projections/**: Escuta eventos do *Event Store* e atualiza o banco Neon com modelos de leitura otimizados, eliminando queries complexas (SELECT SUM).

---

## 2. Deep-Dive de Casos de Uso Críticos

### UC-05 & UC-06: Fluxo Financeiro e Escrow (Liquidação Híbrida)
**Descrição Técnica:** Este caso de uso gerencia a transição do pagamento Web2 (PIX) para a garantia Web3 (Escrow).
*   **Idempotência e Segurança:** Para evitar gastos duplos ou travamentos órfãos, implementamos uma máquina de estados financeira com `CorrelationID`. O pagamento PIX é o gatilho; após a confirmação via webhook, o backend Next.js verifica a existência de transações on-chain pendentes antes de submeter o `lockFunds` ao Smart Contract.
*   **Impacto:** Garante que o dinheiro do assinante esteja sempre protegido por código (Escrow), e que o prestador tenha a garantia de recebimento antes de iniciar o serviço.

### UC-08 a UC-11: SLA Engine & Execução Automática ("Cartório Digital")
**Descrição Técnica:** O motor de SLA cruza a telemetria em tempo real com os termos do contrato.
*   **Orquestração de Oráculos:** O Oráculo (Worker) coleta métricas (uptime, consumo de tokens via Helicone) e gera uma prova criptográfica. O cruzamento matemático entre o SLA real vs. o acordado ocorre off-chain por performance, mas o resultado final (veredito) é enviado ao Smart Contract.
*   **Prova de Serviço:** A blockchain atua como um **Cartório Digital**, registrando logs imutáveis que servem como evidência jurídica e técnica. Se o SLA for descumprido, o contrato liquida o cashback automaticamente, emitindo um evento que dispara o PIX de reembolso via API bancária.

### UC-12 & UC-13: Transparência e Auditoria Verificável
**Descrição Técnica:** Resolvemos o problema da confiança no provedor SaaS através da prova matemática.
*   **Verificação via Merkle Trees:** O Dashboard do cliente exibe dados do banco Neon, mas permite a auditoria direta contra a blockchain. O sistema armazena o `MerkleRoot` de cada ciclo de monitoramento on-chain.
*   **Auditoria:** O cliente pode solicitar a prova de qualquer log de serviço. O HireTrust fornece o "Path" na Merkle Tree que, ao ser hashado no frontend, deve coincidir com o root gravado na blockchain. Isso prova que os logs de disponibilidade não foram alterados retroativamente.

---

## 3. Ambiente de Desenvolvimento e Testes E2E

### Mock Provider Injection (ERC-4337 Adaptado)
Para viabilizar testes automatizados (Playwright) sem a necessidade de intervenção manual no Privy (assinatura de transações), a arquitetura suporta a injeção de um **Mock Provider**.
*   **Fluxo de Teste:** Em ambiente de CI/CD, o Next.js ignora a UI de login e utiliza chaves privadas controladas para assinar transações de Escrow e SLA diretamente no Nodo local do Hardhat. Isso garante testes determinísticos, rápidos e 100% automatizados.

---

## 4. Anatomia das Sub-pastas (Padrão de Implementação)

```text
/src/modules/[modulo]
├── domain/
│   ├── model/           # Agregados, Entidades e VOs (Puros)
│   ├── events/          # Eventos de domínio (Event Sourcing)
│   └── repositories/    # Interfaces dos Repositories
├── application/
│   ├── use-cases/       # Command Handlers (Orquestração)
│   └── services/        # Lógica que cruza múltiplos agregados
├── infrastructure/
│   ├── persistence/     # Implementação Neon/Prisma
│   ├── blockchain/      # Smart Contract Repositories (Hardhat)
│   └── adapters/        # Oráculos, Gateways de Pagamento (PIX)
└── read-side/
    ├── projections/     # Lógica de transformação Evento -> Read Model
    └── dtos/           # Data Transfer Objects para API
```
