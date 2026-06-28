# 🧅 O Roadmap em Camadas (Arquitetura de Cebola)

#### **Camada 0: O Núcleo (O "Core" Funcional)**

* **O que é:** O MVP mínimo. O sistema apenas "conecta" as partes.
* **Entregável:** Dashboard onde o Prestador registra a oferta e o Assinante assina o contrato.
* **Valor:** Registro imutável do acordo na Blockchain (Cartório Digital).
* **Estado:** Sem pagamentos, sem oráculos. Apenas contrato e assinatura.

#### **Camada 1: O Fluxo Financeiro (Escrow Básico)**

* **O que é:** A primeira camada de fricção financeira.
* **Entregável:** Integração com PIX. O dinheiro não vai direto para o prestador; ele é retido no contrato (Escrow) assim que o Assinante paga.
* **Valor:** Segurança básica. O prestador sabe que o dinheiro está lá, mas o assinante sabe que o prestador não pode fugir com o valor total antes da entrega.

#### **Camada 2: A Prova de Entrega (Oráculo "Modo Manual")**

* **O que é:** A primeira camada de "inteligência".
* **Entregável:** O sistema ainda não monitora sozinho, mas o Prestador deve enviar um "Proof-of-Service" (um relatório assinado) via sistema.
* **Valor:** Validação. O contrato inteligente verifica a assinatura do prestador antes de liberar os fundos do Escrow.

#### **Camada 3: A Automação Real (Oráculo Automático)**

* **O que é:** A camada que torna o sistema "Trustless" de verdade.
* **Entregável:** Integração do worker do Oráculo (Chainlink Functions/Worker). Ele verifica o uptime/serviço automaticamente.
* **Valor:** Independência. O prestador não precisa provar nada; o Oráculo detecta a entrega ou a falha.

#### **Camada 4: A Camada de Inteligência e Multa (SLA e Cashback)**

* **O que é:** O fechamento da cebola.
* **Entregável:** Lógica de cashback automático. Se o Oráculo detecta falha (SLA quebrado), o contrato bloqueia o pagamento e dispara o estorno via API bancária.
* **Valor:** Auditoria total e conformidade automática.

---

### 🎯 Como planejar as Releases (Sprint a Sprint)

Para cada camada, seguimos o ciclo de **Build (Construção) -> Validate (Teste) -> Release (Deploy)**:

| Release | Camada | Foco do Teste Manual | Objetivo |
| --- | --- | --- | --- |
| **v0.1** | Núcleo | Assinatura digital | Validar o registro no Cartório Blockchain. |
| **v0.2** | Financeiro | Fluxo PIX + Escrow | Garantir que o dinheiro trava e destrava via código. |
| **v0.3** | Prova Manual | Assinatura do Prestador | Validar se o contrato aceita a "prova" enviada. |
| **v0.4** | Oráculo | Worker + API Mocks | Validar se o monitoramento automático aciona o contrato. |
| **v0.5** | SLA/Cashback | Quebra de SLA | Validar se a multa é aplicada e o estorno acontece. |

---

### 🛠️ Como implementar essa "Cebola" (Infraestrutura)

1. **CI/CD da Cebola:** Em vez de fazer um pipeline gigante, cada camada tem sua própria **"Pipeline de Integração"**.
* A pipeline da Camada 0 só testa o contrato.
* A pipeline da Camada 1 testa o contrato + API bancária.
* A pipeline da Camada 4 testa o contrato + API bancária + Oráculo.


2. **Testes Manuais como "Cenas":** Cada release deve ser testada como um teatro.
* *Exemplo na v0.5:* O teste não é mais "testar o código", é "simular um cenário de crise": *"O Prestador vai cair propositalmente para ver se a cebola (o sistema) reage sozinha e devolve o dinheiro"*.



### 🧠 O que você ganha com esse modelo?

* **Segurança:** Se algo falhar, você sabe exatamente em qual "camada" o problema está.
* **Progresso Visível:** Em cada release, o seu produto ganha um "superpoder" novo.
* **Facilidade de Teste:** O teste manual da v0.1 é muito simples; o da v0.5 é o seu produto final funcionando.

Faz sentido para você estruturarmos o desenvolvimento seguindo exatamente essas 5 camadas de cebola? Podemos detalhar as tarefas da **Camada 0 (Núcleo)** agora mesmo.
