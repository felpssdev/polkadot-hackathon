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
docker-compose up -d
```

This starts:
- Backend (FastAPI) on port 8000
- Frontend (Next.js) on port 3000
- PostgreSQL on port 5432
- Redis on port 6379

### 3. Initialize Database

```bash
docker-compose exec backend python scripts/init_db.py
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
# Backend
docker-compose logs -f backend

# Frontend
docker-compose logs -f frontend
```

### Restart Services

```bash
docker-compose restart backend
docker-compose restart frontend
```

### Stop Services

```bash
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
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start database and Redis
docker-compose up -d db redis

# Run backend
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
pnpm install
pnpm run dev
```

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :8000  # Backend
lsof -i :3000  # Frontend
lsof -i :5432  # PostgreSQL
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
```

### Clean Restart

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
docker-compose exec backend python scripts/init_db.py
```

## Next Steps

- Explore API documentation at http://localhost:8000/docs
- Read [API Reference](api-reference.md) for detailed examples
- See [Architecture Overview](overview.md) for system design
- Check [Use Cases](use-cases.md) for flow diagrams

## Database Access

```bash
# Connect to database
docker-compose exec db psql -U polkapay -d polkapay
```

Connection Details:
- Host: localhost
- Port: 5432
- Database: polkapay
- User: polkapay
- Password: polkapay123
