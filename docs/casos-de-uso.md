# Definição de Casos de Uso - Gateway de Serviços "Trustless SLA"

Este documento descreve as funcionalidades de uma plataforma (SaaS) que permite a contratação de serviços (agentes, infraestrutura, consultoria) com gestão automática de SLA e comprovação via Blockchain.

## 1. Atores

*   **Plataforma (O Gateway):** Orquestrador e garante da integridade.
*   **Prestador (Fornecedor):** Quem oferta o serviço.
*   **Assinante (Cliente):** Quem contrata e monitora o serviço.
*   **Oráculos:** Agentes de monitoramento (Uptime, API, Consumo).
*   **Blockchain (Cartório Digital):** Registro imutável de provas (Proof-of-Service).

## 2. Etapa: Onboarding e Contratualização

*   **UC-01: Registro de Oferta:** Cadastro do serviço com parâmetros de SLA e endpoints.
*   **UC-02: Template de Acordo (Smart SLA):** Geração de contrato com regras de cashback.
*   **UC-03: Assinatura da Oferta:** Assinatura digital do Assinante.
*   **UC-04: Registro On-chain:** Publicação do hash do contrato como "Certificado de Garantia".

## 3. Etapa: Fluxo Financeiro (Gateway)

*   **UC-05a: Pagamento de Setup (QR Code PIX):** Pagamento único de implementação.
*   **UC-05b: Ciclo de Assinatura (PIX Recorrente):** Gestão de cobrança mensal automatizada.
*   **UC-06: Escrow de Pagamento:** Retenção dos fundos em conta de garantia.
*   **UC-07: Split de Risco:** Distribuição dinâmica entre Prestador e Cashback.

## 4. Etapa: Monitoramento (SLA Engine)

*   **UC-08: Monitoramento contínuo (Watchdog):** Oráculos checam `GET /health` periodicamente.
*   **UC-09: Auditoria de Consumo:** Medição de uso variável de recursos (tokens/chamadas).
*   **UC-10: Cálculo de Compliance:** Cruzamento de SLA real vs. acordado ao fim do ciclo.
*   **UC-11: Execução Automática:** Repasse ao Prestador ou aplicação de desconto/cashback.

## 5. Etapa: Transparência e Auditoria (Dashboard do Assinante)

*   **UC-12: Dashboard de Disponibilidade:** Painel em tempo real para o Assinante (estilo "Status Page"), exibindo:
    *   Histórico de uptime (gráfico diário/mensal).
    *   Eventos de queda (timestamps de falhas detectadas).
    *   Status atual do SLA (porcentagem acumulada no mês).
*   **UC-13: Auditoria Verificável:** Link direto no Dashboard que leva ao registro na Blockchain, permitindo que o cliente valide que o log de uptime exibido no painel corresponde exatamente ao hash registrado no "Cartório Digital".
*   **UC-14: Relatório de Consumo:** Detalhamento do uso variável, mostrando o quanto foi consumido de tokens comparado ao limite contratado.

## 6. Etapa: Nota Fiscal Blockchain (Transparência)

*   **UC-15: Emissão de Prova de Serviço:** Geração de Relatório de Execução assinado.
*   **UC-16: Registro da Nota:** Gravação do hash final na Blockchain.
*   **UC-17: Validador Público:** Ferramenta para o Assinante verificar a imutabilidade do pagamento e da entrega do serviço.

## 7. Fluxo de Valor

*   **Prestador:** Foco na alta performance para garantir recebimento integral.
*   **Assinante:** Paz de espírito com monitoramento transparente e cashback automático.
*   **Plataforma:** Monetização via taxa administrativa de transações com SLA garantido.
