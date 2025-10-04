from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User, OrderType
from app.schemas import OrderCreate, OrderResponse, OrderAccept, OrderConfirmPayment
from app.services.order_service import order_service

router = APIRouter(prefix="/orders", tags=["orders"])


# Mock dependency for getting current user (in production, use proper JWT auth)
async def get_current_user(db: Session = Depends(get_db)) -> User:
    """Get current authenticated user (mock)"""
    # For now, return first user or create one
    user = db.query(User).first()
    if not user:
        user = User(wallet_address="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@router.post("/", response_model=OrderResponse)
async def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new order
    
    - BUY: User wants to buy DOT (will pay PIX to LP)
    - SELL: User wants to sell DOT (will receive PIX from LP)
    """
    order = await order_service.create_order(db, current_user, order_data)
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create order. Check your limits."
        )
    
    return order


@router.get("/", response_model=List[OrderResponse])
async def get_orders(
    order_type: OrderType = None,
    db: Session = Depends(get_db)
):
    """Get all active orders"""
    orders = order_service.get_active_orders(db, order_type)
    return orders


@router.get("/my-orders", response_model=List[OrderResponse])
async def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's orders"""
    orders = order_service.get_user_orders(db, current_user.id)
    return orders


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    db: Session = Depends(get_db)
):
    """Get order by ID"""
    order = order_service.get_order(db, order_id)
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    return order


@router.post("/{order_id}/accept", response_model=OrderResponse)
async def accept_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    LP accepts an order
    
    User must be registered as LP
    """
    # Check if user is LP
    if not current_user.lp_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not registered as Liquidity Provider"
        )
    
    order = await order_service.accept_order(db, order_id, current_user.lp_profile)
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to accept order"
        )
    
    return order


@router.post("/{order_id}/confirm-payment", response_model=OrderResponse)
async def confirm_payment(
    order_id: int,
    payment_data: OrderConfirmPayment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Confirm PIX payment was sent"""
    order = order_service.confirm_payment(
        db,
        order_id,
        payment_data.pix_txid,
        payment_data.payment_proof
    )
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to confirm payment"
        )
    
    return order


@router.post("/{order_id}/complete", response_model=OrderResponse)
async def complete_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Complete order and release funds
    
    Called by LP after verifying PIX payment
    """
    order = await order_service.complete_order(db, order_id)
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to complete order"
        )
    
    return order


@router.get("/rates/exchange")
async def get_exchange_rates():
    """Get current DOT exchange rates"""
    rates = await order_service.get_exchange_rates()
    return rates

