# Detalhamento de Casos de Uso (Deep-Dive) - HireTrust

Este documento expande os casos de uso críticos do HireTrust, detalhando a mecânica técnica, os pré-requisitos e o impacto arquitetural de cada fluxo.

---

## 1. Gestão Financeira e Escrow (UC-05 & UC-06)
*   **Descrição:** Liquidação de pagamento PIX e travamento de fundos on-chain.
*   **Como:** O backend Next.js coordena a confirmação do pagamento via Webhook e dispara a transação de Escrow no Hardhat. A idempotência é garantida pelo `CorrelationID`.
*   **Impacto:** Segurança total para o assinante; o dinheiro só é liberado mediante prova de serviço.

## 2. SLA Engine e Execução Automática (UC-08 a UC-11)
*   **Descrição:** Auditoria via Oráculo e liquidação automática de multas.
*   **Como:** O Oráculo coleta métricas off-chain e as envia para o Smart Contract de SLA. O contrato calcula o compliance e emite eventos de violação que disparam o cashback via PIX.
*   **Impacto:** Blockchain como um "Cartório Digital" imutável e resolução de disputas sem burocracia.

## 3. Transparência e Auditoria Verificável (UC-12 & UC-13)
*   **Descrição:** Auditoria verificável dos logs de disponibilidade.
*   **Como:** Uso de Merkle Trees para validar logs off-chain contra hashes on-chain.
*   **Impacto:** Prova matemática de idoneidade, impedindo a manipulação de dados de uptime pela plataforma.

---

## 4. Matriz de Transparência (UC-16 & UC-17)
*   **UC-16:** Registro do hash da Nota Fiscal on-chain para comprovação fiscal.
*   **UC-17:** Validador público que permite a consulta do histórico de idoneidade (Audit Trail) de forma imutável.
