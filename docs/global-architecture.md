# Visão Global da Arquitetura e Jornadas Técnicas - HireTrust

Esta documentação detalha os fluxos de interação entre os componentes do HireTrust, integrando o ecossistema SaaS (Next.js/Neon) com a infraestrutura Web3 (Hardhat/Smart Contracts).

---

## 1. Diagramas de Sequência de Jornadas Críticas

### DIAGRAMA 1: Jornada do Assinante - Onboarding, Assinatura e Travamento de Escrow
Mapeamento dos fluxos de contratualização e garantia financeira inicial (Etapas 1 e 2).

```mermaid
sequenceDiagram
    autonumber
    participant U as Assinante (Cliente)
    participant F as Frontend Next.js (Dashboard)
    participant B as Backend Next.js / Banco Neon (DB)
    participant M as API Bancária Simulada (Mock Bank)
    participant H as Smart Contract de Escrow & Smart SLA (Hardhat Node)

    U->>F: Escolhe oferta e assina digitalmente (Mock Provider)
    F->>B: Envia termos assinados e dados do contrato
    B->>B: Registra contrato no DB Neon (Status: PENDING)
    B->>H: UC-04: Publica hash do contrato on-chain (Certificado de Garantia)
    H-->>B: Confirmação de registro on-chain

    B->>M: Solicita QR Code PIX (Setup/Ciclo Recorrente)
    M-->>F: Retorna QR Code PIX para o Assinante
    U->>M: Realiza pagamento do PIX (Simulado)

    M->>B: Envia Webhook HTTP assinado e idempotente (Confirmação de Liquidação)
    Note over B: Valida assinatura do Webhook e CorrelationID
    B->>B: Altera status da assinatura para 'PAID' no DB Neon

    B->>H: UC-06: Dispara transação de Escrow (Travamento de fundos)
    Note over H: lockFunds(AgreementID)
    H-->>B: Emite evento on-chain: EscrowLocked
    B-->>F: Notifica sucesso e ativa dashboard
    F->>U: Exibe confirmação de serviço ativo
```

---

### DIAGRAMA 2: Jornada de Operação - Monitoramento de SLA Engine e Auditoria por Oráculos
Fluxo de verificação neutra e transparência de dados em tempo real (Etapa 3).

```mermaid
sequenceDiagram
    autonumber
    participant H as Smart Contract de SLA (Hardhat)
    participant O as Worker do Oráculo (Agente Neutro)
    participant P as API / Endpoint do Prestador (Serviço)
    participant B as Backend Next.js (Watchdog / Event Listener)
    participant F as Frontend Next.js (Dashboard Cliente)

    Note over H, O: Trigger Periódico de Auditoria On-chain
    H-->>O: Emite evento de solicitação de auditoria

    O->>P: UC-08/UC-09: Chamada de telemetria HTTP (GET /health ou Consumo)
    P-->>O: Retorna métricas de performance real (uptime/tokens consumidos)

    O->>O: Assina evidência (Proof-of-Service)
    O->>H: Submete transação com a prova para o Smart Contract de SLA

    H-->>B: Evento on-chain detectado (SLA atualizado)
    B->>B: Sincroniza dados no DB Neon

    B->>F: Atualiza gráficos via WebSocket/Server Events (UC-12)
    F->>H: UC-13: Consulta Merkle Root / Hash registrado on-chain
    Note over F: Validação de integridade: Dados Locais vs. Blockchain
    F->>U: Exibe "Verificado via Blockchain" no Dashboard
```

---

### DIAGRAMA 3: Jornada do Prestador e Plataforma - Encerramento do Ciclo (Liquidação e Cashback via PIX)
Fechamento de ciclo, cálculo de compliance e execução da justiça financeira automática (Etapa 4).

```mermaid
sequenceDiagram
    autonumber
    participant H as Smart Contract SLA / Escrow (Hardhat)
    participant B as Backend Next.js (Billing Engine)
    participant M as API Bancária Simulada (Mock Bank)
    participant P as Prestador (Fornecedor)
    participant S as Assinante (Cliente)

    Note over H: Término do ciclo de faturamento
    H->>H: UC-10: Executa Cálculo de Compliance (Telemetria vs. Regras)

    Note over H: Cenário: Quebra de SLA detectada
    H->>H: Liquida valores de forma ponderada (Penalidades)
    H-->>B: Emite evento on-chain: SLAViolated (Cashback e Split líquido)

    B->>M: UC-11: Dispara ordem de transferência PIX Cashback (Assinante)
    M-->>S: Crédito recebido na conta do Assinante

    B->>M: UC-11: Dispara ordem de transferência PIX Split Líquido (Prestador)
    M-->>P: Valor líquido recebido na conta do Prestador

    B->>H: UC-16: Registra hash final da Nota Fiscal e Prova de Serviço on-chain
    H-->>B: Confirmação de registro fiscal imutável

    P->>B: Acessa Validador Público (UC-17)
    S->>B: Acessa Validador Público (UC-17)
    B->>H: Consulta histórico de idoneidade (Audit Trail)
    H-->>B: Retorna dados e hashes do ciclo
    B-->>P: Exibe extrato e prova de idoneidade
    B-->>S: Exibe extrato e prova de idoneidade
```
