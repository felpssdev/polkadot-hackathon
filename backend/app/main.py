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
        "description": "Autenticação e gerenciamento de usuários. Endpoints para conectar wallet Polkadot.js e obter informações do usuário autenticado.",
    },
    {
        "name": "orders",
        "description": "Gerenciamento de ordens de compra/venda de DOT. Inclui criação, aceitação, confirmação de pagamento, cancelamento e sistema de disputas.",
    },
    {
        "name": "liquidity_providers",
        "description": "Gerenciamento de Provedores de Liquidez (LPs). Registro, perfil, disponibilidade e estatísticas de ganhos.",
    },
]

# API Description
description = """
# PolkaPay - P2P DOT ↔ PIX Exchange

Plataforma descentralizada para troca de DOT (Polkadot) por BRL via PIX.

## Recursos Principais

* **Ordens de Compra/Venda**: Crie ordens para comprar ou vender DOT
* **Escrow Inteligente**: Smart contracts garantem segurança das transações
* **Sistema de Disputas**: Resolução justa de conflitos
* **Provedores de Liquidez**: Ganhe taxas fornecendo liquidez
* **Integração PIX**: Pagamentos instantâneos em BRL

## Fluxo de Transação

### Venda de DOT (SELL)
1. Usuário cria ordem SELL com DOT
2. DOT depositado em escrow no smart contract
3. LP aceita ordem e fornece chave PIX
4. Usuário envia PIX e confirma pagamento
5. LP verifica PIX e completa ordem
6. DOT liberado do escrow para LP

### Compra de DOT (BUY)
1. Usuário cria ordem BUY
2. LP aceita e deposita DOT em escrow
3. LP fornece chave PIX
4. Usuário envia PIX e confirma
5. LP verifica e completa
6. DOT liberado para usuário

## Autenticação

Use o endpoint `/api/v1/auth/wallet` para obter um token JWT.
Adicione o token no header: `Authorization: Bearer <token>`

## Blockchain

- **Network**: Rococo Testnet
- **Smart Contract**: ink! 5.1
- **Token**: ROC (Rococo)
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

