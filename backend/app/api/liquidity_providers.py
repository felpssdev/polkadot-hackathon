from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User, LiquidityProvider, Order, OrderStatus
from app.schemas import LiquidityProviderCreate, LiquidityProviderResponse, OrderResponse
from app.services.pix_service import pix_service
from app.api.auth import get_current_user_dependency

router = APIRouter(prefix="/lp", tags=["liquidity_providers"])


@router.post("/register", response_model=LiquidityProviderResponse)
async def register_as_lp(
    lp_data: LiquidityProviderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dependency)
):
    """Register as Liquidity Provider"""
    
    # Check if already LP
    if current_user.lp_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already registered as LP"
        )
    
    # Validate PIX key
    if not pix_service.validate_pix_key(lp_data.pix_key, lp_data.pix_key_type):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid PIX key"
        )
    
    # Create LP profile
    lp = LiquidityProvider(
        user_id=current_user.id,
        pix_key=lp_data.pix_key,
        pix_key_type=lp_data.pix_key_type
    )
    
    db.add(lp)
    db.commit()
    db.refresh(lp)
    
    return lp


@router.get("/profile", response_model=LiquidityProviderResponse)
async def get_lp_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dependency)
):
    """Get LP profile"""
    if not current_user.lp_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not registered as LP"
        )
    
    return current_user.lp_profile


@router.get("/available-orders", response_model=List[OrderResponse])
async def get_available_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dependency)
):
    """Get orders available for LP to accept"""
    
    if not current_user.lp_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not registered as LP"
        )
    
    lp = current_user.lp_profile
    
    # Get pending orders within LP limits
    orders = db.query(Order).filter(
        Order.status == OrderStatus.PENDING,
        Order.usd_amount >= lp.min_order_size_usd,
        Order.usd_amount <= lp.max_order_size_usd
    ).order_by(Order.created_at.desc()).all()
    
    return orders


@router.get("/my-orders", response_model=List[OrderResponse])
async def get_lp_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dependency)
):
    """Get orders processed by this LP"""
    
    if not current_user.lp_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not registered as LP"
        )
    
    orders = db.query(Order).filter(
        Order.lp_id == current_user.lp_profile.id
    ).order_by(Order.created_at.desc()).all()
    
    return orders


@router.put("/availability")
async def update_availability(
    is_available: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dependency)
):
    """Update LP availability"""
    
    if not current_user.lp_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not registered as LP"
        )
    
    current_user.lp_profile.is_available = is_available
    db.commit()
    
    return {"message": "Availability updated", "is_available": is_available}


@router.get("/earnings")
async def get_earnings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dependency)
):
    """Get LP earnings"""
    
    if not current_user.lp_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not registered as LP"
        )
    
    lp = current_user.lp_profile
    
    return {
        "total_orders": lp.total_orders_processed,
        "total_volume_usd": lp.total_volume_usd,
        "total_earnings_usd": lp.total_earnings_usd,
        "rating": lp.rating
    }

