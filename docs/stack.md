Em um ambiente descentralizado híbrido, a conexão entre uma **Smart Wallet (gerada via Account Abstraction/ERC-4337)** e um **Nó Blockchain Local (Hardhat)** é o maior gargalo de testes, principalmente para testes de ponta a ponta (E2E).

Se você usar o Privy em modo de teste nativo, ele gerará carteiras que esperam uma infraestrutura de produção (como Bundlers e Paymasters da testnet) que o seu nó básico do Hardhat não possui por padrão.

Vamos redesenhar a arquitetura local para torná-la **eficiente, testável em fluxos E2E, fidedigna em relação aos Oráculos** e incluindo a **camada de APIs bancárias** (com a conta controlada pelo próprio projeto).

---

### 1. Resolvendo Privy + Smart Wallets no Hardhat (Foco em E2E)

Para fazer a carteira gerada pelo Privy interagir com o Hardhat local de forma fluida, você precisa simular a especificação **ERC-4337 (Account Abstraction)** localmente.

**A Solução Eficiente:**
Em vez de tentar emular o Privy rodando um fluxo de UI complexo em testes automatizados E2E (como Cypress ou Playwright), você deve criar um **Mecanismo de Injeção de Provedor (Provider Injection)** no seu Frontend e nas Serverless Functions do Next.js.

* **Durante o desenvolvimento visual:** Configure o Privy para apontar para o seu RPC local (`http://127.0.0.1:8545`). O Privy injetará o provedor e assinará as transações.
* **Nos testes automatizados E2E / CI:** Crie um *bypass* controlado por variáveis de ambiente (`NEXT_PUBLIC_APP_ENV=test`). Quando essa flag estiver ativa, sua aplicação substitui o SDK do Privy por um **Mock Wallet Provider** local que utiliza uma das chaves privadas ricas geradas pelo próprio Hardhat.

#### Como a Smart Wallet aparece no Hardhat?

Para o Hardhat, não importa se a transação veio de uma chave privada tradicional (EOA) ou se é uma chamada de um contrato de Smart Wallet. No ambiente local, você deve rodar o script de deploy que publica o contrato **EntryPoint** da ERC-4337. O seu backend ou o mock de teste agirá como o **Bundler**, empacotando a requisição de assinatura do usuário e enviando-a para o nó local.

---

### 2. Deixando os Oráculos mais Fiéis à Realidade

Usar um script Node.js simples que roda em um *timer* `setInterval` quebra a semelhança com a infraestrutura da Chainlink. A Chainlink Functions executa código JavaScript em um ambiente isolado (Decentralized Oracle Network - DON) e retorna uma resposta assinada para um contrato agregador na blockchain.

Para simular isso localmente com máxima fidelidade, você pode subir um **Worker Docker que mimetiza um Nó de Computação Confidencial**:

```
[ Next.js API /health ] <--- (HTTP GET) --- [ Worker Local (Mock DON) ]
                                                    |
                                            (Envia Prova Assinada)
                                                    v
                                        [ Hardhat: SLA Contract ]

```

1. **Simulação do Gatilho:** Crie um contrato chamado `ChainlinkFunctionsOracle.sol` e faça o deploy no Hardhat.
2. **O Fluxo do Worker:** Em vez do Worker rodar por conta própria de forma isolada, ele fica escutando os eventos (WebSockets) do Hardhat.
3. Quando o seu contrato de SLA dispara uma requisição de checagem, o Hardhat emite um evento `OracleRequest`.
4. O seu Worker Docker captura o evento, faz o `GET /health` real na API cadastrada no Neon, recebe o payload, assina criptograficamente e chama a função de *callback* (`fulfillRequest`) no contrato do Hardhat.

Isso replica exatamente o ciclo de vida assíncrono e baseado em eventos da Chainlink.

---

### 3. Incluindo a Camada de APIs Bancárias (A Conta do Projeto)

Como o gateway de serviços automatiza ciclos de cobrança e cashback usando o ecossistema financeiro tradicional (ex: PIX), o projeto precisa controlar uma conta bancária programável.

A arquitetura para acoplar isso ao fluxo Web3 e Off-chain local envolve os seguintes componentes:

* **Em Produção:** Integração com BaaS (Banking as a Service) focado em desenvolvedores no Brasil (ex: Stark Bank, Open Finance de bancos tradicionais ou Efí Bank), permitindo a emissão de PIX dinâmico (QR Code) e liquidação automática via Webhooks.
* **Localmente (Ambiente Dev/Docker):** Um container dedicado para simular o banco (Mock Bank API).

#### Como tudo interage junto no ambiente local?

Aqui está a esteira de execução de um teste completo de ponta a ponta (E2E), desde o pagamento via banco até a execução do SLA na Blockchain:

```
[ 1. Assinante paga PIX ] -> [ Mock Bank API (Docker) ]
                                    |
                            (Webhook HTTP)
                                    v
[ 2. Confirmação ] --------> [ Next.js Serverless API ]
                                    |
                            (Atualiza DB) & (Libera Escrow)
                                    v
[ 3. Registro On-chain ] --> [ Hardhat Node (Fase Trustless) ]

```

1. **UC-05b (Ciclo de Assinatura):** O Frontend solicita a criação de um PIX. O Next.js se comunica com o container `mock-bank-api`, gerando um payload simulado.
2. **Simulação de Pagamento:** No seu painel de teste E2E, você clica em um botão para "Simular Pagamento bem-sucedido". A API do banco dispara um webhook HTTP simulado para o endpoint do seu Next.js.
3. **Escrow e Liquidação (UC-06):** O Next.js processa o webhook, valida os dados off-chain no banco Neon local e executa uma transação no nó do Hardhat para travar os fundos equivalentes no **Smart Contract de Escrow**.
4. **Monitoramento Realístico:** O contrato dispara a solicitação de monitoramento de SLA. O Worker do Oráculo escuta, bate na API do prestador, constata se o uptime foi respeitado ou violado e devolve o resultado para o Hardhat.
5. **Execução Automática (UC-11):** Caso haja quebra de SLA, o contrato executa a regra de cashback e emite um evento on-chain. O seu backend Next.js captura esse evento de multa e dispara uma chamada para a `mock-bank-api` para realizar uma transferência PIX de volta para a conta do Assinante.

### O Compose ideal para essa arquitetura repensada

Para orquestrar essa infraestrutura completa localmente:

```yaml
version: '3.8'

services:
  # Persistência Off-chain (Substituto do Neon)
  postgres:
    image: postgres:15-alpine
    container_name: hiresmart-db-local
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: local_password
      POSTGRES_DB: hiresmart_dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  # Simulador da API do Banco (Stark Bank / Efí Mock)
  mock-bank-api:
    image: node:18-alpine
    container_name: hiresmart-bank-mock
    ports:
      - "8080:8080"
    volumes:
      - ./mocks/bank:/app
    working_dir: /app
    command: sh -c "pnpm install && pnpm start"
    environment:
      - NEXT_JS_WEBHOOK_URL=http://host.docker.internal:3000/api/webhooks/v1/bank

  # Simulador da Chainlink Functions (DON Mock Worker)
  chainlink-functions-mock:
    image: node:18-alpine
    container_name: hiresmart-oracle-don
    volumes:
      - ./oracle:/app
    working_dir: /app
    command: sh -c "pnpm install && pnpm start"
    environment:
      - RPC_URL=http://host.docker.internal:8545
      - PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 # Chave rica do Hardhat para o Oráculo assinar respostas

volumes:
  pgdata:

```

### Resumo do ganho de eficiência:

Com esse desenho, o Frontend Next.js consome dados do Postgres e interage com o Hardhat via chaves controladas no teste E2E, eliminando a dependência de login manual do Privy. O ecossistema financeiro ganha um simulador local de API bancária que se comunica perfeitamente com os contratos inteligentes através de webhooks, garantindo um ciclo de automação idêntico ao de produção.
