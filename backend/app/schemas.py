from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models import OrderStatus, OrderType


# User Schemas
class UserBase(BaseModel):
    wallet_address: str


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    id: int
    buy_limit_usd: float
    buy_orders_per_day: int
    sell_limit_usd: float
    sell_orders_per_day: int
    total_orders: int
    successful_orders: int
    rating: float
    is_verified: bool
    is_admin: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# Liquidity Provider Schemas
class LiquidityProviderCreate(BaseModel):
    pix_key: str = Field(..., description="LP's PIX key")
    pix_key_type: str = Field(..., description="Type: cpf, email, phone, random")
    
    class Config:
        json_schema_extra = {
            "example": {
                "pix_key": "lp@example.com",
                "pix_key_type": "email"
            }
        }


class LiquidityProviderResponse(BaseModel):
    id: int
    pix_key: str
    pix_key_type: str
    total_orders_processed: int
    total_volume_usd: float
    total_earnings_usd: float
    rating: float
    is_active: bool
    is_available: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# Order Schemas
class OrderCreate(BaseModel):
    order_type: OrderType = Field(..., description="Order type: buy or sell")
    dot_amount: float = Field(..., gt=0, description="Amount of DOT")
    pix_key: Optional[str] = Field(None, description="PIX key (required for SELL orders)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "order_type": "sell",
                "dot_amount": 10.0,
                "pix_key": "user@example.com"
            }
        }


class OrderResponse(BaseModel):
    id: int
    order_type: OrderType
    status: OrderStatus
    dot_amount: float
    brl_amount: float
    usd_amount: float
    exchange_rate_dot_brl: float
    lp_fee_amount: float
    user_id: int
    lp_id: Optional[int]
    pix_key: Optional[str]
    pix_qr_code: Optional[str]
    pix_txid: Optional[str]
    blockchain_order_id: Optional[int]
    blockchain_tx_hash: Optional[str]
    created_at: datetime
    expires_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class OrderAccept(BaseModel):
    lp_id: int


class OrderConfirmPayment(BaseModel):
    pix_txid: str = Field(..., description="PIX transaction ID")
    payment_proof: Optional[str] = Field(None, description="URL or hash of payment proof")
    
    class Config:
        json_schema_extra = {
            "example": {
                "pix_txid": "E12345678202511081900abcd1234567",
                "payment_proof": "https://storage.example.com/proof123.jpg"
            }
        }


# PIX Schemas
class PIXQRCodeResponse(BaseModel):
    qr_code: str
    qr_code_image: str
    pix_key: str
    amount: float


# Auth Schemas
class WalletAuthRequest(BaseModel):
    wallet_address: str = Field(..., description="Polkadot.js wallet address")
    signature: str = Field(..., description="Message signature")
    message: str = Field(..., description="Signed message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "wallet_address": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
                "signature": "0x1234567890abcdef...",
                "message": "Sign in to PolkaPay - Nonce: 123456"
            }
        }


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

