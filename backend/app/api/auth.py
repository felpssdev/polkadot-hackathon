from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Optional

from app.database import get_db
from app.models import User
from app.schemas import WalletAuthRequest, TokenResponse, UserResponse
from app.config import settings
from app.services.polkadot_service import polkadot_service

router = APIRouter(prefix="/auth", tags=["auth"])


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


@router.post(
    "/wallet",
    response_model=TokenResponse,
    summary="Authenticate with Polkadot.js wallet",
    description="""
    Authenticates user using Polkadot.js wallet signature.
    
    **Flow:**
    1. Frontend generates random message
    2. User signs with wallet
    3. Backend validates signature
    4. Returns JWT token
    
    **Token Usage:**
    - Add token in header: `Authorization: Bearer <token>`
    - Token expires in 30 minutes
    - Use in all protected endpoints
    """,
    responses={
        200: {
            "description": "Authentication successful",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "token_type": "bearer"
                    }
                }
            }
        },
        401: {"description": "Invalid signature"}
    }
)
async def authenticate_wallet(
    auth_request: WalletAuthRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate user via wallet signature
    
    User signs a message with their wallet, we verify the signature
    """
    # Verify signature
    is_valid = polkadot_service.verify_signature(
        wallet_address=auth_request.wallet_address,
        message=auth_request.message,
        signature=auth_request.signature
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature"
        )
    
    # Get or create user
    user = db.query(User).filter(User.wallet_address == auth_request.wallet_address).first()
    
    if not user:
        # Create new user
        user = User(
            wallet_address=auth_request.wallet_address,
            buy_limit_usd=settings.default_buy_limit_usd,
            buy_orders_per_day=settings.default_buy_orders_per_day,
            sell_limit_usd=settings.default_sell_limit_usd,
            sell_orders_per_day=settings.default_sell_orders_per_day
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user.wallet_address, "user_id": user.id}
    )
    
    return TokenResponse(access_token=access_token)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get authenticated user",
    description="""
    Returns authenticated user information.
    
    **Requires:** JWT token in Authorization header
    
    **Returns:**
    - Profile information
    - Buy/sell limits
    - Order statistics
    - Verification level
    """,
    responses={
        200: {
            "description": "User data",
            "content": {
                "application/json": {
                    "example": {
                        "id": 1,
                        "wallet_address": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
                        "buy_limit_usd": 1.0,
                        "buy_orders_per_day": 1,
                        "sell_limit_usd": 100.0,
                        "sell_orders_per_day": 10,
                        "total_orders": 5,
                        "successful_orders": 4,
                        "rating": 4.8,
                        "is_verified": False,
                        "created_at": "2025-11-08T10:00:00Z"
                    }
                }
            }
        },
        401: {"description": "Invalid or expired token"},
        404: {"description": "User not found"}
    }
)
async def get_current_user(
    token: str,
    db: Session = Depends(get_db)
):
    """Get current authenticated user"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        wallet_address: str = payload.get("sub")
        
        if wallet_address is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = db.query(User).filter(User.wallet_address == wallet_address).first()
        
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        
        return user
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

