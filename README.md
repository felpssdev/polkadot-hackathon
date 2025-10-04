# 🚀 PolkaPay - P2P DOT ⇄ PIX Exchange

Plataforma P2P inspirada no [P2P.me](https://p2p.me) para trocar DOT (Polkadot) por PIX no Brasil, construída para o ecossistema Polkadot.

## 🎯 Visão Geral

PolkaPay permite que usuários comprem e vendam DOT usando PIX de forma:
- ✅ **Descentralizada** - Smart contracts em ink! no Polkadot
- ✅ **Segura** - Fundos em escrow no blockchain
- ✅ **Rápida** - Transações PIX instantâneas
- ✅ **Não-custodial** - Autenticação via wallet Polkadot

## 🏗️ Arquitetura

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│   Frontend  │─────▶│   Backend    │─────▶│   PostgreSQL    │
│  (Next.js)  │      │  (FastAPI)   │      │                 │
└─────────────┘      └──────────────┘      └─────────────────┘
                            │
                            ├──────────────▶ ┌─────────────────┐
                            │                │   Polkadot      │
                            │                │  (Smart Contract)│
                            │                └─────────────────┘
                            │
                            └──────────────▶ ┌─────────────────┐
                                             │   PIX API       │
                                             │   (Mock)        │
                                             └─────────────────┘
```

## 📦 Stack Tecnológica

### Backend
- **FastAPI** - API REST moderna e rápida
- **SQLAlchemy** - ORM para PostgreSQL
- **py-substrate-interface** - Integração com Polkadot
- **ink!** - Smart contracts no Polkadot/Substrate
- **Redis** - Cache e filas

### Frontend
- **Next.js 14** - Framework React
- **TailwindCSS** - Estilização
- **Polkadot.js** - Integração com wallets

### Blockchain
- **Polkadot (Rococo)** - Testnet para contratos
- **ink!** - Linguagem de smart contracts

## 🚀 Começar

### Pré-requisitos

- Docker & Docker Compose
- Node.js 18+ (para desenvolvimento frontend)
- Python 3.11+ (para desenvolvimento backend)
- Rust (para compilar smart contracts)

### 1. Clonar repositório

```bash
git clone <repo-url>
cd polkadot-hackathon
```

### 2. Subir com Docker

```bash
# Subir todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f backend
```

### 3. Inicializar banco de dados

```bash
# Entrar no container do backend
docker-compose exec backend bash

# Rodar script de inicialização
python scripts/init_db.py
```

### 4. Acessar aplicação

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

## 📖 Funcionalidades

### ✅ Para Usuários

1. **Comprar DOT com PIX**
   - Cria ordem de compra
   - LP aceita e fornece chave PIX
   - Paga via PIX
   - Recebe DOT na wallet

2. **Vender DOT por PIX**
   - Cria ordem de venda e bloqueia DOT em escrow
   - LP aceita ordem
   - LP envia PIX
   - Confirma recebimento
   - DOT é liberado para LP

### ✅ Para Liquidity Providers (LPs)

- Registrar como LP com chave PIX
- Ver ordens disponíveis
- Aceitar ordens
- Processar pagamentos
- **Ganhar 2% em cada transação**
- Acompanhar ganhos e volume

### ✅ Smart Contract

- Escrow de DOT
- Gestão de ordens on-chain
- Liberação automática de fundos
- Taxa de 2% para LPs
- Sistema de cancelamento

## 🔒 Sistema de Limites

Para prevenir fraudes, novos usuários têm limites:

**Limites Iniciais:**
- Compra: $1 por ordem, 1 ordem/dia
- Venda: $100 por ordem, 10 ordens/dia

**Aumentar limites:**
- ✅ Volume de transações bem-sucedidas
- ✅ Tempo de conta ativa  
- ✅ Rating positivo
- ✅ Verificação social (futuro)

## 🛠️ Desenvolvimento

### Backend

```bash
cd backend

# Instalar dependências
pip install -r requirements.txt

# Rodar localmente
uvicorn app.main:app --reload

# Compilar smart contract
cd contracts
cargo contract build --release
```

Ver [backend/README.md](backend/README.md) para mais detalhes.

### Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Rodar dev server
npm run dev
```

## 📚 API Endpoints

### Autenticação
- `POST /api/v1/auth/wallet` - Login via wallet
- `GET /api/v1/auth/me` - Perfil do usuário

### Orders
- `POST /api/v1/orders/` - Criar ordem
- `GET /api/v1/orders/` - Listar ordens
- `GET /api/v1/orders/{id}` - Detalhes da ordem
- `POST /api/v1/orders/{id}/accept` - Aceitar ordem (LP)
- `POST /api/v1/orders/{id}/confirm-payment` - Confirmar pagamento
- `POST /api/v1/orders/{id}/complete` - Completar ordem
- `GET /api/v1/orders/rates/exchange` - Taxa de câmbio

### Liquidity Providers
- `POST /api/v1/lp/register` - Registrar como LP
- `GET /api/v1/lp/profile` - Perfil do LP
- `GET /api/v1/lp/available-orders` - Ordens disponíveis
- `GET /api/v1/lp/my-orders` - Minhas ordens (LP)
- `GET /api/v1/lp/earnings` - Ganhos

## 🎯 Fluxo de Ordem

### Venda (DOT → PIX)

```
1. User: Criar ordem SELL (1 DOT)
   └─> DOT bloqueado em escrow no smart contract

2. LP: Aceitar ordem
   └─> Sistema registra LP

3. LP: Enviar PIX para user
   └─> User confirma recebimento

4. Sistema: Verifica pagamento
   └─> Libera DOT para LP
   └─> LP recebe 0.98 DOT (2% de taxa)
   └─> Treasury recebe 0.02 DOT
```

### Compra (PIX → DOT)

```
1. User: Criar ordem BUY (1 DOT)

2. LP: Aceitar ordem
   └─> Sistema gera QR Code PIX

3. User: Pagar PIX
   └─> LP confirma recebimento

4. LP: Enviar DOT para user
   └─> LP recebe 2% de taxa em DOT
```

## 🧪 Testar

### Criar ordem de venda

```bash
curl -X POST http://localhost:8000/api/v1/orders/ \
  -H "Content-Type: application/json" \
  -d '{
    "order_type": "sell",
    "dot_amount": 1.5,
    "pix_key": "seu@email.com"
  }'
```

### Ver ordens ativas

```bash
curl http://localhost:8000/api/v1/orders/
```

### Taxa de câmbio

```bash
curl http://localhost:8000/api/v1/orders/rates/exchange
```

## 📋 TODO

- [ ] Implementar WebSocket para notificações real-time
- [ ] Sistema de disputas completo
- [ ] Integrar API PIX real (Stark Bank, Mercado Pago)
- [ ] Deploy contrato na mainnet Polkadot
- [ ] Sistema de verificação social (ZK-KYC)
- [ ] Suporte a múltiplas moedas (USDC, etc)
- [ ] App mobile
- [ ] Testes automatizados

## 🤝 Contribuir

Este é um projeto hackathon. Contribuições são bem-vindas!

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

MIT

## 🙏 Inspiração

Inspirado no incrível trabalho do [P2P.me](https://p2p.me) - uma plataforma P2P para USDC.

## 📞 Contato

Para questões sobre o projeto, abra uma issue no GitHub.

---

**Construído com ❤️ para o ecossistema Polkadot**
