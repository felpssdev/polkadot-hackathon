# Quick Start Guide

Get PolkaPay running in minutes using Docker.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Git

## Installation

### 1. Clone Repository

```bash
git clone <repo-url>
cd polkadot-hackathon
```

### 2. Start Services

```bash
# Start all services
docker-compose up -d

# Or using Makefile
make up
```

This starts:
- Backend (FastAPI) on port 8000
- Frontend (Next.js) on port 3000
- PostgreSQL on port 5432
- Redis on port 6379

### 3. Initialize Database

```bash
# Initialize with sample data
docker-compose exec backend python scripts/init_db.py

# Or using Makefile
make init-db
```

### 4. Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Testing the API

### Health Check

```bash
curl http://localhost:8000/health
```

### Get Exchange Rates

```bash
curl http://localhost:8000/api/v1/orders/rates/exchange
```

### Create Sell Order

```bash
curl -X POST http://localhost:8000/api/v1/orders/ \
  -H "Content-Type: application/json" \
  -d '{
    "order_type": "sell",
    "dot_amount": 1.0,
    "pix_key": "test@email.com"
  }'
```

### List Active Orders

```bash
curl http://localhost:8000/api/v1/orders/
```

## Useful Commands

### View Logs

```bash
# All services
make logs

# Backend only
make logs-backend

# Frontend only
make logs-frontend
```

### Restart Services

```bash
# Restart backend
make restart-backend

# Restart all
docker-compose restart
```

### Stop Services

```bash
# Stop all services
make down

# Or
docker-compose down
```

### Clean Everything

```bash
# Stop and remove volumes (deletes data)
docker-compose down -v

# Rebuild images
docker-compose build --no-cache
```

## Development Without Docker

### Backend

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

# Run backend
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend

# Install dependencies
pnpm install

# Run development server
pnpm run dev
```

## Complete Order Flow Example

### Scenario: Sell 2 DOT for PIX

```bash
# 1. Create sell order
ORDER_ID=$(curl -s -X POST http://localhost:8000/api/v1/orders/ \
  -H "Content-Type: application/json" \
  -d '{"order_type": "sell", "dot_amount": 2.0, "pix_key": "user@email.com"}' \
  | jq -r '.id')

echo "Order created: $ORDER_ID"

# 2. LP accepts order
curl -X POST http://localhost:8000/api/v1/orders/$ORDER_ID/accept

# 3. LP sends PIX (off-chain)

# 4. User confirms payment received
curl -X POST http://localhost:8000/api/v1/orders/$ORDER_ID/confirm-payment \
  -H "Content-Type: application/json" \
  -d '{"pix_txid": "E12345678901234567890123456"}'

# 5. System completes order
curl -X POST http://localhost:8000/api/v1/orders/$ORDER_ID/complete

# 6. Verify order completed
curl http://localhost:8000/api/v1/orders/$ORDER_ID | jq
```

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :8000  # Backend
lsof -i :3000  # Frontend
lsof -i :5432  # PostgreSQL

# Change port in docker-compose.yml
# Example: "8001:8000" instead of "8000:8000"
```

### Database Connection Error

```bash
# Check if PostgreSQL is running
docker-compose ps db

# View database logs
docker-compose logs db

# Restart database
docker-compose restart db
```

### Backend Error

```bash
# View detailed logs
docker-compose logs -f backend

# Enter container
docker-compose exec backend bash

# Check dependencies
docker-compose exec backend pip list
```

### Clean Restart

```bash
# Stop everything
docker-compose down

# Remove volumes (deletes data)
docker-compose down -v

# Rebuild images
docker-compose build --no-cache

# Start again
docker-compose up -d

# Reinitialize database
make init-db
```

## Next Steps

- Explore API documentation at http://localhost:8000/docs
- Read [API Reference](../backend/api-reference.md) for detailed examples
- See [Architecture Overview](../architecture/overview.md) for system design
- Check [Use Cases](../architecture/use-cases.md) for flow diagrams

## Database Access

### Using psql

```bash
# Connect to database
make db-shell

# Or directly
docker-compose exec db psql -U polkapay -d polkapay
```

### Connection Details

- Host: localhost
- Port: 5432
- Database: polkapay
- User: polkapay
- Password: polkapay123

### GUI Clients

Compatible with:
- DBeaver
- pgAdmin
- TablePlus
- DataGrip

