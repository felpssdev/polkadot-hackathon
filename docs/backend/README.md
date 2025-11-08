# Backend Documentation

FastAPI backend for PolkaPay P2P platform.

## Overview

The backend provides a REST API for managing users, orders, and liquidity providers. It integrates with PostgreSQL for data persistence, Redis for caching, Polkadot for blockchain interactions, and PIX for payments.

## Technology Stack

- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for PostgreSQL
- **py-substrate-interface** - Polkadot integration
- **ink!** - Smart contracts
- **Redis** - Cache and sessions
- **PostgreSQL** - Database

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration
│   ├── database.py          # Database setup
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── api/                 # API endpoints
│   │   ├── auth.py         # Authentication
│   │   ├── orders.py       # Order management
│   │   └── liquidity_providers.py  # LP management
│   └── services/            # Business logic
│       ├── polkadot_service.py    # Blockchain
│       ├── pix_service.py         # PIX integration
│       └── order_service.py       # Order logic
├── contracts/               # Smart contracts
│   ├── lib.rs              # Escrow contract
│   └── Cargo.toml
├── scripts/
│   └── init_db.py          # Database initialization
├── requirements.txt
├── Dockerfile
└── README.md
```

## Setup

### Using Docker

```bash
# From project root
docker-compose up -d

# Initialize database
docker-compose exec backend python scripts/init_db.py
```

Backend available at: http://localhost:8000

API documentation: http://localhost:8000/docs

### Local Development

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate    # Windows

# Install dependencies
pip install -r requirements.txt

# Start database and Redis
docker-compose up -d db redis

# Configure environment
cp .env.example .env

# Run backend
uvicorn app.main:app --reload
```

## Configuration

Environment variables in `.env`:

```bash
DATABASE_URL=postgresql://polkapay:polkapay123@localhost:5432/polkapay
POLKADOT_NODE_URL=wss://rococo-rpc.polkadot.io
CONTRACT_ADDRESS=<contract-address>
PIX_MOCK_ENABLED=True
SECRET_KEY=<your-secret-key>
REDIS_URL=redis://localhost:6379
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/wallet` - Wallet authentication
- `GET /api/v1/auth/me` - Get user profile

### Orders

- `POST /api/v1/orders/` - Create order
- `GET /api/v1/orders/` - List orders
- `GET /api/v1/orders/my-orders` - User orders
- `GET /api/v1/orders/{id}` - Order details
- `POST /api/v1/orders/{id}/accept` - Accept order (LP)
- `POST /api/v1/orders/{id}/confirm-payment` - Confirm payment
- `POST /api/v1/orders/{id}/complete` - Complete order
- `GET /api/v1/orders/rates/exchange` - Exchange rates

### Liquidity Providers

- `POST /api/v1/lp/register` - Register as LP
- `GET /api/v1/lp/profile` - LP profile
- `GET /api/v1/lp/available-orders` - Available orders
- `GET /api/v1/lp/my-orders` - LP orders
- `PUT /api/v1/lp/availability` - Update availability
- `GET /api/v1/lp/earnings` - LP earnings

See [API Reference](api-reference.md) for detailed documentation.

## Order Flows

### Sell Order (DOT → PIX)

1. User creates sell order with DOT amount
2. DOT locked in smart contract escrow
3. LP accepts order
4. LP sends PIX payment
5. User confirms PIX received
6. System releases DOT to LP (minus 2% fee)

### Buy Order (PIX → DOT)

1. User creates buy order for DOT amount
2. LP accepts and provides PIX key
3. System generates PIX QR code
4. User pays PIX
5. LP confirms payment
6. LP transfers DOT to user
7. LP receives 2% fee

## User Limit System

New users start with conservative limits:

- **Buy**: $1 per order, 1 order/day
- **Sell**: $100 per order, 10 orders/day

Limits increase based on:
- Transaction volume
- Account age
- User rating
- Verification status

## Security Features

- Non-custodial wallet authentication
- Smart contract escrow
- Per-user limits
- Rating system
- Payment verification
- Dispute support

## Smart Contract Integration

The backend interacts with the ink! smart contract for:

- Locking DOT in escrow
- Accepting orders
- Releasing funds
- Canceling orders
- Fee distribution

See [Smart Contracts](smart-contracts.md) for details.

## Testing

### Health Check

```bash
curl http://localhost:8000/health
```

### Create Order

```bash
curl -X POST http://localhost:8000/api/v1/orders/ \
  -H "Content-Type: application/json" \
  -d '{
    "order_type": "sell",
    "dot_amount": 1.5,
    "pix_key": "test@email.com"
  }'
```

### List Orders

```bash
curl http://localhost:8000/api/v1/orders/
```

### Exchange Rates

```bash
curl http://localhost:8000/api/v1/orders/rates/exchange
```

## Database Schema

### User

- Wallet address (unique)
- Buy/sell limits
- Order statistics
- Rating
- Verification status

### LiquidityProvider

- User reference
- PIX key
- Order statistics
- Earnings
- Availability status

### Order

- Order type (buy/sell)
- Status
- DOT amount
- BRL amount
- User and LP references
- PIX details
- Contract order ID
- Timestamps

### Transaction

- Order reference
- Transaction type
- Amount and currency
- Blockchain hash
- Status

## Development

### Running Tests

```bash
pytest
```

### Code Quality

```bash
# Format code
black .

# Sort imports
isort .

# Type checking
mypy .

# Linting
flake8
```

### Database Migrations

```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Troubleshooting

### Database Connection Error

```bash
# Check if PostgreSQL is running
docker-compose ps db

# View logs
docker-compose logs db

# Restart
docker-compose restart db
```

### Redis Connection Error

```bash
# Check if Redis is running
docker-compose ps redis

# View logs
docker-compose logs redis
```

### Smart Contract Error

Check:
- Polkadot node connection
- Contract address configuration
- Account has sufficient balance
- Contract is deployed

## Production Considerations

- Use production-grade ASGI server (Gunicorn + Uvicorn)
- Enable HTTPS
- Configure CORS properly
- Use managed database
- Implement rate limiting
- Add monitoring and logging
- Use environment-specific configs
- Implement backup strategy

## Future Improvements

- WebSocket for real-time updates
- Complete dispute system
- Real PIX API integration
- Mainnet deployment
- Social verification (ZK-KYC)
- Unit and integration tests
- CI/CD pipeline
- Performance optimization

