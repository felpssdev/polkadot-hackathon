# PolkaPay Documentation

P2P platform for exchanging DOT (Polkadot) with PIX in Brazil.

## Quick Links

- [Quick Start](getting-started/quick-start.md) - Installation and setup
- [Architecture Overview](architecture/overview.md) - System architecture
- [Technology Stack](architecture/tech-stack.md) - Technologies used
- [Use Cases](architecture/use-cases.md) - Use case diagrams
- [Backend API](backend/api-reference.md) - API endpoints
- [Frontend](frontend/README.md) - Frontend documentation
- [Smart Contracts](backend/smart-contracts.md) - Contract documentation

## Project Overview

PolkaPay is a P2P marketplace for exchanging Polkadot (DOT) with Brazilian PIX payments. The platform enables users to buy and sell DOT directly with each other, secured by smart contract escrow.

### Key Features

- Non-custodial wallet authentication
- Smart contract escrow on Polkadot
- 2% liquidity provider fee
- PIX payment integration
- Anti-fraud limit system
- Liquidity provider marketplace

### Architecture

```
Frontend (Next.js) → Backend (FastAPI) → PostgreSQL
                                       → Redis
                                       → Polkadot Smart Contract
                                       → PIX API
```

## Getting Started

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (frontend development)
- Python 3.11+ (backend development)
- Rust 1.70+ with cargo-contract (smart contract compilation)

### Quick Start

```bash
# Clone repository
git clone <repo-url>
cd polkadot-hackathon

# Start services
docker-compose up -d

# Initialize database
docker-compose exec backend python scripts/init_db.py

# Access application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

See [Quick Start Guide](getting-started/quick-start.md) for detailed instructions.

## Documentation Structure

### Getting Started
- Quick start guide
- Installation requirements
- Development setup

### Architecture
- System overview
- Technology stack
- Use case diagrams
- Data models

### Backend
- API reference
- Smart contracts
- Development guide

### Frontend
- Component architecture
- Wallet integration
- Development guide

## Project Structure

```
polkadot-hackathon/
├── backend/           # FastAPI backend
├── frontend/          # Next.js frontend
├── docs/              # Documentation
├── docker-compose.yml # Docker configuration
└── Makefile          # Development commands
```

## License

MIT

