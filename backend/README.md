# PolkaPay Backend

Backend da plataforma P2P para troca de DOT por PIX no ecossistema Polkadot.

## 🚀 Tecnologias

- **FastAPI** - Framework web moderno e rápido
- **SQLAlchemy** - ORM para PostgreSQL
- **py-substrate-interface** - Conexão com Polkadot
- **ink!** - Smart contracts no Polkadot
- **Redis** - Cache e filas
- **PostgreSQL** - Banco de dados

## 📁 Estrutura

```
backend/
├── app/
│   ├── main.py              # Aplicação FastAPI principal
│   ├── config.py            # Configurações
│   ├── database.py          # Configuração do banco
│   ├── models.py            # Modelos SQLAlchemy
│   ├── schemas.py           # Schemas Pydantic
│   ├── api/                 # Endpoints da API
│   │   ├── auth.py         # Autenticação por wallet
│   │   ├── orders.py       # Gestão de ordens
│   │   └── liquidity_providers.py  # Gestão de LPs
│   └── services/            # Serviços
│       ├── polkadot_service.py    # Conexão Polkadot
│       ├── pix_service.py         # PIX (mock)
│       └── order_service.py       # Lógica de ordens
├── contracts/               # Smart contracts ink!
│   ├── lib.rs              # Contrato de escrow
│   └── Cargo.toml
├── requirements.txt
├── Dockerfile
└── README.md
```

## 🏗️ Arquitetura

### Smart Contract (ink!)

O contrato `polkapay_escrow` gerencia o escrow de DOT:

1. **create_order()** - Usuário cria ordem e bloqueia DOT
2. **accept_order()** - LP aceita ordem
3. **confirm_payment_sent()** - Usuário confirma envio do PIX
4. **complete_order()** - Libera DOT para LP após confirmação
5. **cancel_order()** - Cancela ordem (apenas se não aceita)

### Backend API

#### Autenticação
- **POST /api/v1/auth/wallet** - Login via assinatura de wallet Polkadot
- **GET /api/v1/auth/me** - Informações do usuário autenticado

#### Orders
- **POST /api/v1/orders/** - Criar nova ordem
- **GET /api/v1/orders/** - Listar ordens ativas
- **GET /api/v1/orders/my-orders** - Minhas ordens
- **GET /api/v1/orders/{id}** - Detalhes da ordem
- **POST /api/v1/orders/{id}/accept** - LP aceita ordem
- **POST /api/v1/orders/{id}/confirm-payment** - Confirmar pagamento PIX
- **POST /api/v1/orders/{id}/complete** - Completar ordem
- **GET /api/v1/orders/rates/exchange** - Taxas de câmbio DOT/BRL

#### Liquidity Providers
- **POST /api/v1/lp/register** - Registrar como LP
- **GET /api/v1/lp/profile** - Perfil do LP
- **GET /api/v1/lp/available-orders** - Ordens disponíveis
- **GET /api/v1/lp/my-orders** - Ordens do LP
- **PUT /api/v1/lp/availability** - Atualizar disponibilidade
- **GET /api/v1/lp/earnings** - Ganhos do LP

## 🎯 Fluxo de Ordem

### SELL (Vender DOT por PIX)

1. Usuário cria ordem SELL com X DOT
2. DOT é bloqueado no smart contract (escrow)
3. LP vê ordem e aceita
4. LP envia PIX para usuário
5. Usuário confirma recebimento do PIX
6. Sistema verifica pagamento
7. DOT é liberado para LP (com 2% de taxa)

### BUY (Comprar DOT com PIX)

1. Usuário cria ordem BUY para X DOT
2. LP aceita e fornece PIX key
3. Sistema gera QR Code PIX
4. Usuário paga PIX ao LP
5. LP confirma recebimento
6. LP transfere DOT para usuário
7. LP recebe taxa de 2%

## 🔧 Setup Local

### 1. Clonar e instalar dependências

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e configure:

```bash
DATABASE_URL=postgresql://polkapay:polkapay123@localhost:5432/polkapay
POLKADOT_NODE_URL=wss://rococo-rpc.polkadot.io
PIX_MOCK_ENABLED=True
SECRET_KEY=your-secret-key
```

### 3. Rodar com Docker

```bash
# Da raiz do projeto
docker-compose up -d
```

Backend estará disponível em: http://localhost:8000

Documentação da API: http://localhost:8000/docs

### 4. Rodar localmente (sem Docker)

```bash
# Instalar dependências
pip install -r requirements.txt

# Rodar PostgreSQL e Redis localmente ou via Docker
docker-compose up -d db redis

# Rodar aplicação
uvicorn app.main:app --reload
```

## 🎨 Smart Contract

### Compilar

```bash
cd contracts
cargo contract build --release
```

### Deploy (Rococo Testnet)

```bash
cargo contract instantiate \
  --constructor new \
  --args 200 \
  --suri //Alice \
  --url wss://rococo-contracts-rpc.polkadot.io
```

Após deploy, adicione o endereço do contrato em `.env`:
```
CONTRACT_ADDRESS=5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty
```

## 📊 Sistema de Limites

Novos usuários começam com limites baixos para segurança:

- **Compra:** $1 por ordem, 1 ordem/dia
- **Venda:** $100 por ordem, 10 ordens/dia ($1,000 diário)

Limites aumentam com:
- Volume de transações bem-sucedidas
- Tempo de conta ativa
- Rating positivo
- Verificação social (opcional)

## 🔒 Segurança

- ✅ Autenticação via assinatura de wallet (não-custodial)
- ✅ Fundos em escrow no smart contract
- ✅ Limites por usuário
- ✅ Sistema de rating e reputação
- ✅ Verificação de pagamento PIX
- ✅ Suporte a disputas

## 🧪 Testar API

### 1. Health Check

```bash
curl http://localhost:8000/health
```

### 2. Criar ordem de venda

```bash
curl -X POST http://localhost:8000/api/v1/orders/ \
  -H "Content-Type: application/json" \
  -d '{
    "order_type": "sell",
    "dot_amount": 1.5,
    "pix_key": "seu@email.com"
  }'
```

### 3. Listar ordens ativas

```bash
curl http://localhost:8000/api/v1/orders/
```

### 4. Taxas de câmbio

```bash
curl http://localhost:8000/api/v1/orders/rates/exchange
```

## 🌐 Endpoints Principais

- **Backend API:** http://localhost:8000
- **API Docs (Swagger):** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

## 📝 TODO

- [ ] Implementar WebSocket para notificações real-time
- [ ] Adicionar sistema de disputas completo
- [ ] Integrar API PIX real (Stark Bank, etc)
- [ ] Deploy do contrato na mainnet
- [ ] Sistema de verificação social (ZK-KYC)
- [ ] Testes unitários e de integração
- [ ] CI/CD pipeline

## 🤝 Contribuindo

Este é um projeto hackathon. Sinta-se livre para contribuir!

## 📄 Licença

MIT

