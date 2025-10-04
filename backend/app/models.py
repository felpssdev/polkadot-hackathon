from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum

from app.database import Base


class OrderStatus(str, enum.Enum):
    """Order status enum"""
    PENDING = "pending"
    ACCEPTED = "accepted"
    PAYMENT_SENT = "payment_sent"
    COMPLETED = "completed"
    DISPUTED = "disputed"
    CANCELLED = "cancelled"


class OrderType(str, enum.Enum):
    """Order type enum"""
    BUY = "buy"  # User wants to buy DOT (sell BRL via PIX)
    SELL = "sell"  # User wants to sell DOT (receive BRL via PIX)


class User(Base):
    """User model"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    wallet_address = Column(String, unique=True, index=True, nullable=False)
    
    # Limits
    buy_limit_usd = Column(Float, default=1.0)
    buy_orders_per_day = Column(Integer, default=1)
    sell_limit_usd = Column(Float, default=100.0)
    sell_orders_per_day = Column(Integer, default=10)
    
    # Stats
    total_orders = Column(Integer, default=0)
    successful_orders = Column(Integer, default=0)
    rating = Column(Float, default=5.0)
    
    # Verification
    is_verified = Column(Boolean, default=False)
    verification_level = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    orders_created = relationship("Order", back_populates="user", foreign_keys="Order.user_id")
    lp_profile = relationship("LiquidityProvider", back_populates="user", uselist=False)


class LiquidityProvider(Base):
    """Liquidity Provider model"""
    __tablename__ = "liquidity_providers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    
    # PIX Info
    pix_key = Column(String, nullable=False)
    pix_key_type = Column(String)  # cpf, email, phone, random
    
    # Stats
    total_orders_processed = Column(Integer, default=0)
    total_volume_usd = Column(Float, default=0.0)
    total_earnings_usd = Column(Float, default=0.0)
    rating = Column(Float, default=5.0)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_available = Column(Boolean, default=True)
    
    # Limits
    max_order_size_usd = Column(Float, default=1000.0)
    min_order_size_usd = Column(Float, default=1.0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="lp_profile")
    orders_processed = relationship("Order", back_populates="liquidity_provider")


class Order(Base):
    """Order model"""
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    
    # Order info
    order_type = Column(Enum(OrderType), nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    
    # Amounts
    dot_amount = Column(Float, nullable=False)
    brl_amount = Column(Float, nullable=False)
    usd_amount = Column(Float, nullable=False)
    exchange_rate_dot_brl = Column(Float, nullable=False)
    lp_fee_amount = Column(Float, default=0.0)
    
    # Participants
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lp_id = Column(Integer, ForeignKey("liquidity_providers.id"), nullable=True)
    
    # PIX Info
    pix_key = Column(String, nullable=True)
    pix_qr_code = Column(String, nullable=True)
    pix_txid = Column(String, nullable=True)
    pix_payment_proof = Column(String, nullable=True)
    
    # Blockchain
    contract_order_id = Column(Integer, nullable=True)
    escrow_tx_hash = Column(String, nullable=True)
    release_tx_hash = Column(String, nullable=True)
    
    # Metadata
    notes = Column(String, nullable=True)
    dispute_reason = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    payment_sent_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="orders_created", foreign_keys=[user_id])
    liquidity_provider = relationship("LiquidityProvider", back_populates="orders_processed")


class Transaction(Base):
    """Transaction history model"""
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    
    tx_hash = Column(String, nullable=False)
    tx_type = Column(String, nullable=False)  # escrow, release, refund
    block_number = Column(Integer, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

