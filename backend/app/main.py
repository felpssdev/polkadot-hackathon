from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.config import settings
from app.database import engine, Base
from app.api import auth, orders, liquidity_providers
from app.services.polkadot_service import polkadot_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# OpenAPI tags metadata
tags_metadata = [
    {
        "name": "auth",
        "description": "Authentication and user management. Endpoints to connect Polkadot.js wallet and get authenticated user information.",
    },
    {
        "name": "orders",
        "description": "DOT buy/sell order management. Includes creation, acceptance, payment confirmation, cancellation and dispute system.",
    },
    {
        "name": "liquidity_providers",
        "description": "Liquidity Provider (LP) management. Registration, profile, availability and earnings statistics.",
    },
]

# API Description
description = """
# PolkaPay - P2P DOT ↔ PIX Exchange

Decentralized platform for exchanging DOT (Polkadot) for BRL via PIX.

## Main Features

* **Buy/Sell Orders**: Create orders to buy or sell DOT
* **Smart Escrow**: Smart contracts ensure transaction security
* **Dispute System**: Fair conflict resolution
* **Liquidity Providers**: Earn fees by providing liquidity
* **PIX Integration**: Instant payments in BRL

## Transaction Flow

### Selling DOT (SELL)
1. User creates SELL order with DOT
2. DOT deposited in escrow in smart contract
3. LP accepts order and provides PIX key
4. User sends PIX and confirms payment
5. LP verifies PIX and completes order
6. DOT released from escrow to LP

### Buying DOT (BUY)
1. User creates BUY order
2. LP accepts and deposits DOT in escrow
3. LP provides PIX key
4. User sends PIX and confirms
5. LP verifies and completes
6. DOT released to user

## Authentication

Use the `/api/v1/auth/wallet` endpoint to obtain a JWT token.
Add the token in the header: `Authorization: Bearer <token>`

## Blockchain

- **Network**: Rococo Testnet
- **Smart Contract**: ink! 5.1
- **Token**: ROC (Rococo)

## Development Notes

**PIX Payment Service:**
- **MOCK MODE ACTIVE**: PIX payment verification is currently mocked for development/testing
- Current provider: `mock` (simulated transactions in memory)
- To switch to real provider: Set `PIX_PROVIDER=starkbank` and configure credentials
- Mock allows testing without real PIX integration
- For production migration guide, see: `/docs/pix-integration.md`
- **WARNING**: Mock transactions are lost on server restart

**Authentication:**
- JWT-based authentication via Polkadot.js wallet signature
- Token expires in 30 minutes
- Admin endpoints require `is_admin=true` in user profile

**Smart Contract:**
- Contract must be deployed to Rococo before backend can interact
- Set `CONTRACT_ADDRESS` and `SIGNER_SEED` in environment variables
- Backend will attempt to connect on startup
"""

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=description,
    openapi_tags=tags_metadata,
    contact={
        "name": "PolkaPay Team",
        "url": "https://github.com/your-repo/polkapay",
        "email": "contact@polkapay.io"
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT"
    },
    swagger_ui_parameters={
        "persistAuthorization": True,
        "displayRequestDuration": True,
        "filter": True,
        "tryItOutEnabled": True
    }
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(orders.router, prefix=settings.api_prefix)
app.include_router(liquidity_providers.router, prefix=settings.api_prefix)

# Webhooks (no prefix - direct access)
try:
    from app.api import webhooks
    app.include_router(webhooks.router)
except ImportError:
    # Webhooks module is optional
    pass


@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    
    # Create database tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created")
    
    # Connect to Polkadot
    if polkadot_service.connect():
        logger.info("Connected to Polkadot network")
    else:
        logger.warning("Failed to connect to Polkadot network")


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    logger.info("Shutting down...")
    polkadot_service.disconnect()


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "polkadot_connected": polkadot_service.substrate is not None
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )

