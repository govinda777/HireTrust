# Definição de Casos de Uso - Gateway de Serviços "Trustless SLA"

Este documento descreve as funcionalidades de uma plataforma (SaaS) que atua como um **Gateway de Serviços e Gerenciador de Assinaturas**, permitindo a contratação de serviços (agentes, infraestrutura, consultoria) com gestão automática de SLA, cobrança recorrente e comprovação via Blockchain.

## 1. Atores

*   **Plataforma (O Gateway):** Orquestrador, gerenciador de assinaturas e garante da integridade.
*   **Prestador (Fornecedor):** Quem oferta o serviço e define os planos de assinatura.
*   **Assinante (Cliente):** Quem contrata, gerencia suas assinaturas e monitora o serviço.
*   **Oráculos:** Agentes de monitoramento (Uptime, API, Consumo).
*   **Blockchain (Cartório Digital):** Registro imutável de provas (Proof-of-Service) e histórico de conformidade.

## 2. Etapa: Onboarding e Contratualização

*   **UC-01: Registro de Oferta:** Cadastro do serviço com parâmetros de SLA, endpoints e **configuração de planos de assinatura**.
*   **UC-02: Template de Acordo (Smart SLA):** Geração de contrato com regras de cashback, limites de consumo e termos de renovação.
*   **UC-03: Assinatura da Oferta:** Assinatura digital do Assinante e vinculação ao método de pagamento.
*   **UC-04: Registro On-chain:** Publicação do hash do contrato como "Certificado de Garantia".

## 3. Etapa: Gestão de Assinaturas e Fluxo Financeiro

*   **UC-05a: Pagamento de Setup (QR Code PIX):** Pagamento único de implementação para ativar a assinatura.
*   **UC-05b: Ciclo de Assinatura (Cobrança Recorrente):**
    *   Gestão de ciclos mensais automatizada.
    *   Controle de status da assinatura: **Ativa, Suspensa (por inadimplência ou falha de SLA), Cancelada**.
    *   Renovação automática baseada no histórico de conformidade.
*   **UC-06: Escrow de Pagamento:** Retenção dos fundos em conta de garantia durante o ciclo vigente.
*   **UC-07: Split de Risco e Receita:** Distribuição dinâmica entre Prestador, Fundo de Cashback e Taxa da Plataforma.

## 4. Etapa: Monitoramento e Billing (SLA Engine)

*   **UC-08: Monitoramento contínuo (Watchdog):** Oráculos checam `GET /health` periodicamente.
*   **UC-09: Auditoria de Consumo:** Medição de uso variável (tokens/chamadas) para **faturamento de excedentes (Pay-per-use)**.
*   **UC-10: Cálculo de Compliance:** Cruzamento de SLA real vs. acordado ao fim do ciclo de faturamento.
*   **UC-11: Execução Automática de Liquidação:** Repasse ao Prestador ou aplicação de desconto/cashback diretamente na próxima fatura ou via estorno.

## 5. Etapa: Transparência e Auditoria (Dashboard do Assinante)

*   **UC-12: Painel de Gestão de Assinaturas:**
    *   Status atual da assinatura e data da próxima cobrança.
    *   Histórico de faturas e comprovantes.
    *   Visualização de Uptime e SLA acumulado.
*   **UC-13: Auditoria Verificável:** Link direto para o registro na Blockchain (Cartório Digital).
*   **UC-14: Relatório de Consumo:** Detalhamento do uso para transparência no faturamento variável.

## 6. Etapa: Nota Fiscal Blockchain (Transparência)

*   **UC-15: Emissão de Prova de Serviço:** Geração de Relatório de Execução assinado ao fim de cada ciclo.
*   **UC-16: Registro da Nota:** Gravação do hash final da transação e entrega na Blockchain.
*   **UC-17: Validador Público:** Ferramenta para verificar a imutabilidade do ciclo de vida da assinatura.

## 7. Fluxo de Valor

*   **Prestador:** Recebimento recorrente garantido por alta performance.
*   **Assinante:** Gestão centralizada de fornecedores com proteção financeira automática.
*   **Plataforma:** Monetização via taxa de transação e gestão do ecossistema de confiança.

---

## 8. Deep-Dive Técnico dos Casos de Uso Críticos

### UC-05 & UC-06: Gestão Financeira e Escrow Híbrido
*   **O Que é:** A coordenação entre o pagamento via PIX (Web2) e o travamento de fundos em Smart Contract (Web3).
*   **Como Funciona:** Utilizamos uma abordagem de **Liquidação Idempotente**. O backend Next.js atua como o orquestrador. Ao receber a confirmação da API Bancária via Webhook, o sistema consulta o estado atual no banco Neon e no Smart Contract. Se a transação on-chain já tiver sido disparada (verificada via CorrelationID), o sistema ignora a retentativa. Caso contrário, submete o `lockFunds` ao Escrow no Hardhat. Isso evita travamentos duplos e garante que o fundo só seja bloqueado se o pagamento real existir.

### UC-08 a UC-11: SLA Engine e Cartório Digital
*   **O Que é:** Monitoramento contínuo da performance do prestador com execução automática de multas.
*   **Como Funciona:** O **Oráculo do HireTrust** consome endpoints de telemetria do prestador (ex: `/metrics`). O resultado é comparado com os limites de SLA definidos no Agregado `Agreement`. A cada ciclo, um hash da medição é gravado on-chain. Se o SLA cair abaixo do limite (ex: < 99.5% uptime), o Smart SLA emite um evento de quebra. O Next.js, ouvindo esse evento, dispara automaticamente um PIX de cashback para o assinante. Os logs gravados funcionam como um **Cartório Digital**, fornecendo provas imutáveis para auditoria.

### UC-12 & UC-13: Transparência e Auditoria Verificável
*   **O Que é:** Garantia para o cliente de que os dados de performance exibidos no Dashboard são verdadeiros.
*   **Como Funciona:** Implementamos a validação via **Merkle Trees**. A cada ciclo de SLA, o Oráculo gera uma árvore de hashes de todos os logs coletados e grava o `MerkleRoot` na blockchain. O cliente, ao visualizar o Dashboard de Disponibilidade, pode clicar em qualquer ponto de dados para verificar sua prova. O sistema gera o "Caminho de Merkle" e o valida contra o root on-chain. Se os dados tivessem sido manipulados pelo HireTrust, o hash não bateria, garantindo transparência total.
