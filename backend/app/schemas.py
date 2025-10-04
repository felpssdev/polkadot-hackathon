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
    created_at: datetime
    
    class Config:
        from_attributes = True


# Liquidity Provider Schemas
class LiquidityProviderCreate(BaseModel):
    pix_key: str
    pix_key_type: str  # cpf, email, phone, random


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
    order_type: OrderType
    dot_amount: float = Field(..., gt=0, description="Amount of DOT")
    pix_key: Optional[str] = None  # Required for SELL orders


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
    contract_order_id: Optional[int]
    created_at: datetime
    expires_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class OrderAccept(BaseModel):
    lp_id: int


class OrderConfirmPayment(BaseModel):
    pix_txid: str
    payment_proof: Optional[str] = None


# PIX Schemas
class PIXQRCodeResponse(BaseModel):
    qr_code: str
    qr_code_image: str
    pix_key: str
    amount: float


# Auth Schemas
class WalletAuthRequest(BaseModel):
    wallet_address: str
    signature: str
    message: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

