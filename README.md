# PolkaPay

P2P platform for exchanging DOT (Polkadot) with PIX in Brazil.

## Documentation

Complete documentation available in [docs/](docs/)

## Quick Start

```bash
# Start services
docker-compose up -d

# Initialize database
docker-compose exec backend python scripts/init_db.py

# Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

## Key Features

- Non-custodial wallet authentication
- Smart contract escrow on Polkadot
- 2% liquidity provider fee
- PIX payment integration
- Anti-fraud limit system

## Project Structure

```
polkadot-hackathon/
├── backend/           # FastAPI backend
├── frontend/          # Next.js frontend
├── docs/              # Documentation
├── docker-compose.yml
└── Makefile
```

## Links

- [Documentation](docs/)
- [Quick Start Guide](docs/getting-started/quick-start.md)
- [Architecture Overview](docs/architecture/overview.md)
- [API Reference](docs/backend/api-reference.md)
- [Frontend Guide](docs/frontend/README.md)

## Technology Stack

### Backend
- FastAPI
- PostgreSQL
- Redis
- Polkadot (ink! smart contracts)

### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS 4
- Polkadot.js

## Development

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
pnpm install
pnpm run dev
```

### Smart Contracts

```bash
cd backend/contracts
cargo contract build --release
```

## License

MIT

## Inspiration

Inspired by [P2P.me](https://p2p.me) - P2P USDC marketplace.
