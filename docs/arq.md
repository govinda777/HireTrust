# Especificação Técnica de Arquitetura Profunda - HireTrust

Como Engenheiro de Software Principal, detalho abaixo os componentes críticos da arquitetura híbrida do HireTrust, focando na integração entre o ecossistema SaaS e a Blockchain.

---

## 1. Deep-Dive: Fluxo Financeiro e Escrow (UC-05 & UC-06)

**Mecânica Híbrida:** A liquidação financeira ocorre no mundo Web2 (PIX), mas a garantia é mantida on-chain (Escrow).
*   **Idempotência:** Cada transação financeira é atrelada a um `CorrelationID` único gerado no momento do checkout. O backend Next.js utiliza este ID para garantir que a liquidação off-chain (webhook do banco) dispare a trava on-chain (`lockFunds`) exatamente uma vez.
*   **Segurança:** Caso o Smart Contract apresente falha de rede, o sistema de reconciliação assíncrona utiliza o ID para retentar a transação on-chain, evitando que o dinheiro fique "órfão" sem proteção contratual.

## 2. Deep-Dive: SLA Engine e Execução Automática (UC-08 a UC-11)

**Mecânica de Oráculo:** O monitoramento é feito por um Worker off-chain (Oráculo) que serve como os "olhos" do Smart Contract.
*   **Compliance:** O cruzamento matemático entre o SLA real (telemetria) e o acordado ocorre de forma determinística. A blockchain atua como um **Cartório Digital**, onde cada prova de serviço assinada pelo oráculo é imutável.
*   **Liquidação Automática:** Se o SLA for violado, o contrato inteligente altera o balanço do Escrow instantaneamente. O Billing Engine do Next.js, ao ouvir o evento `SLAViolated`, executa os splits de PIX (Cashback e Repasse) sem intervenção humana.

## 3. Deep-Dive: Transparência e Auditoria Verificável (UC-12 & UC-13)

**Mecânica de Prova:** A transparência é garantida pelo uso de **Merkle Trees**.
*   **Auditoria Verificável:** O Dashboard de Disponibilidade do cliente não apenas exibe gráficos; ele fornece o hash de cada log. O frontend consulta o `MerkleRoot` registrado on-chain para validar que os dados mostrados no banco Neon não foram alterados pelo provedor SaaS.
*   **Validador Público:** Ao final de cada ciclo, o hash da Nota Fiscal e da Prova de Serviço (UC-16) permite uma auditoria pública da idoneidade fiscal e técnica do prestador (UC-17).

---

## 2. Anatomia das Sub-pastas (Padrão de Implementação)

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
    └── dtos/            # Data Transfer Objects para API
```
