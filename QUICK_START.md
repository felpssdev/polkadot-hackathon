# 🚀 Quick Start Guide - PolkaPay

Guia rápido para começar a usar o PolkaPay em minutos!

## ⚡ Início Rápido (Docker)

### 1. Clone e suba os serviços

```bash
# Clone o repositório
git clone <repo-url>
cd polkadot-hackathon

# Suba todos os serviços
make up

# Ou sem make:
docker-compose up -d
```

### 2. Inicialize o banco de dados

```bash
# Inicializar com dados de exemplo
make init-db

# Ou sem make:
docker-compose exec backend python scripts/init_db.py
```

### 3. Acesse a aplicação

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs (Swagger UI interativo!)

### 4. Teste a API

```bash
# Health check
curl http://localhost:8000/health

# Ver taxa de câmbio
curl http://localhost:8000/api/v1/orders/rates/exchange

# Criar ordem de venda
curl -X POST http://localhost:8000/api/v1/orders/ \
  -H "Content-Type: application/json" \
  -d '{
    "order_type": "sell",
    "dot_amount": 1.0,
    "pix_key": "test@email.com"
  }'

# Ver ordens ativas
curl http://localhost:8000/api/v1/orders/
```

### 5. Usar o Swagger UI

Acesse http://localhost:8000/docs para uma interface interativa onde você pode:
- Ver todos os endpoints
- Testar requisições
- Ver schemas e exemplos
- Não precisa de curl!

## 📋 Comandos Úteis

```bash
# Ver logs do backend
make logs-backend

# Ver logs do frontend
make logs-frontend

# Reiniciar backend
make restart-backend

# Parar tudo
make down

# Ver status dos serviços
make status

# Limpar tudo (cuidado: apaga volumes!)
make clean

# Ver todos os comandos
make help
```

## 🎯 Testar Fluxo Completo

### Cenário: Vender DOT por PIX

```bash
# 1. Criar ordem de venda (Usuário)
ORDER_ID=$(curl -s -X POST http://localhost:8000/api/v1/orders/ \
  -H "Content-Type: application/json" \
  -d '{"order_type": "sell", "dot_amount": 2.0, "pix_key": "user@email.com"}' \
  | jq -r '.id')

echo "Order created: $ORDER_ID"

# 2. LP aceita ordem
curl -X POST http://localhost:8000/api/v1/orders/$ORDER_ID/accept

# 3. LP envia PIX (off-chain)
# ... LP transfere via app do banco ...

# 4. Usuário confirma recebimento
curl -X POST http://localhost:8000/api/v1/orders/$ORDER_ID/confirm-payment \
  -H "Content-Type: application/json" \
  -d '{"pix_txid": "E12345678901234567890123456"}'

# 5. Sistema completa ordem
curl -X POST http://localhost:8000/api/v1/orders/$ORDER_ID/complete

# 6. Verificar ordem completada
curl http://localhost:8000/api/v1/orders/$ORDER_ID | jq
```

## 🔧 Desenvolvimento Local (Sem Docker)

### Backend

```bash
cd backend

# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Instalar dependências
pip install -r requirements.txt

# Subir apenas DB e Redis via Docker
docker-compose up -d db redis

# Configurar .env (copiar de .env.example)
cp .env.example .env

# Rodar backend
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Rodar dev server
npm run dev
```

## 📊 Estrutura de Dados

### User (Usuário)

```json
{
  "id": 1,
  "wallet_address": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  "buy_limit_usd": 1.0,
  "buy_orders_per_day": 1,
  "sell_limit_usd": 100.0,
  "sell_orders_per_day": 10,
  "total_orders": 5,
  "successful_orders": 5,
  "rating": 5.0,
  "is_verified": false
}
```

### Order (Ordem)

```json
{
  "id": 1,
  "order_type": "sell",
  "status": "pending",
  "dot_amount": 2.0,
  "brl_amount": 75.0,
  "usd_amount": 15.0,
  "exchange_rate_dot_brl": 37.5,
  "lp_fee_amount": 1.5,
  "user_id": 1,
  "lp_id": null,
  "pix_key": "user@email.com",
  "contract_order_id": 1
}
```

### Liquidity Provider (LP)

```json
{
  "id": 1,
  "pix_key": "lp@email.com",
  "pix_key_type": "email",
  "total_orders_processed": 10,
  "total_volume_usd": 1000.0,
  "total_earnings_usd": 20.0,
  "rating": 4.9,
  "is_active": true,
  "is_available": true
}
```

## 🎓 Próximos Passos

### 1. Explorar a API

- Acesse http://localhost:8000/docs
- Teste criar ordens BUY e SELL
- Registre-se como LP
- Veja ordens disponíveis

### 2. Ver Exemplos de API

Veja [backend/API_EXAMPLES.md](backend/API_EXAMPLES.md) para exemplos completos.

### 3. Estudar o Smart Contract

```bash
# Ver código do contrato
cat backend/contracts/lib.rs

# Compilar contrato
cd backend/contracts
cargo contract build --release
```

### 4. Personalizar

- Ajuste limites em `backend/app/config.py`
- Modifique taxa de LP (padrão 2%)
- Conecte a um node Polkadot diferente
- Customize o frontend

## 🐛 Troubleshooting

### Porta já em uso

```bash
# Verificar o que está usando a porta
lsof -i :8000  # Backend
lsof -i :3000  # Frontend
lsof -i :5432  # PostgreSQL

# Mudar porta no docker-compose.yml
# Exemplo: "8001:8000" ao invés de "8000:8000"
```

### Erro de conexão com banco

```bash
# Verificar se PostgreSQL está rodando
docker-compose ps db

# Ver logs do banco
docker-compose logs db

# Reiniciar banco
docker-compose restart db
```

### Erro no backend

```bash
# Ver logs detalhados
docker-compose logs -f backend

# Entrar no container
docker-compose exec backend bash

# Verificar dependências
docker-compose exec backend pip list
```

### Limpar e recomeçar

```bash
# Parar tudo
docker-compose down

# Remover volumes (ATENÇÃO: apaga dados!)
docker-compose down -v

# Reconstruir imagens
docker-compose build --no-cache

# Subir novamente
docker-compose up -d

# Reinicializar banco
make init-db
```

## 📚 Documentação Adicional

- [README.md](README.md) - Visão geral do projeto
- [backend/README.md](backend/README.md) - Detalhes do backend
- [backend/API_EXAMPLES.md](backend/API_EXAMPLES.md) - Exemplos de API
- [backend/contracts/README.md](backend/contracts/README.md) - Smart contract

## 💡 Dicas

1. **Use o Swagger UI**: É muito mais fácil que curl!
   - http://localhost:8000/docs

2. **Ative hot reload**: Já está ativo no Docker
   - Backend: Edite arquivos em `backend/app/` e veja mudanças instantâneas
   - Frontend: Edite arquivos em `frontend/src/` e veja mudanças instantâneas

3. **Use o Makefile**: Facilita muito!
   ```bash
   make help  # Ver todos os comandos
   ```

4. **Inspecione o banco**: Use um cliente PostgreSQL
   ```bash
   # Via linha de comando
   make db-shell
   
   # Ou use um cliente GUI como:
   # - DBeaver
   # - pgAdmin
   # - TablePlus
   
   # Conexão:
   # Host: localhost
   # Port: 5432
   # Database: polkapay
   # User: polkapay
   # Password: polkapay123
   ```

5. **Monitore logs**: Sempre tenha um terminal com logs abertos
   ```bash
   make logs
   ```

## 🎉 Pronto!

Agora você está pronto para explorar o PolkaPay!

Dúvidas? Abra uma issue no GitHub ou veja a documentação completa.

Happy coding! 🚀

