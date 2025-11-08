from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import httpx
import logging

from app.models import Order, User, LiquidityProvider, OrderStatus, OrderType
from app.schemas import OrderCreate
from app.services.polkadot_service import polkadot_service
from app.services.pix_service import pix_service
from app.config import settings

logger = logging.getLogger(__name__)


class OrderService:
    """Service for order management"""
    
    def __init__(self):
        self.dot_to_brl_rate: Optional[float] = None
        self.dot_to_usd_rate: Optional[float] = None
        
    async def get_exchange_rates(self) -> dict:
        """Fetch current DOT exchange rates"""
        try:
            # Fetch from CoinGecko or similar API
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.coingecko.com/api/v3/simple/price",
                    params={
                        "ids": "polkadot",
                        "vs_currencies": "usd,brl"
                    }
                )
                data = response.json()
                
                self.dot_to_usd_rate = data["polkadot"]["usd"]
                self.dot_to_brl_rate = data["polkadot"]["brl"]
                
                logger.info(f"Exchange rates: 1 DOT = ${self.dot_to_usd_rate} USD = R${self.dot_to_brl_rate} BRL")
                
                return {
                    "dot_to_usd": self.dot_to_usd_rate,
                    "dot_to_brl": self.dot_to_brl_rate
                }
        except Exception as e:
            logger.error(f"Error fetching exchange rates: {e}")
            # Fallback to default rates
            self.dot_to_usd_rate = 7.0  # Example
            self.dot_to_brl_rate = 35.0  # Example
            return {
                "dot_to_usd": self.dot_to_usd_rate,
                "dot_to_brl": self.dot_to_brl_rate
            }
    
    async def create_order(
        self,
        db: Session,
        user: User,
        order_data: OrderCreate
    ) -> Optional[Order]:
        """Create a new order"""
        try:
            # Get current exchange rates
            rates = await self.get_exchange_rates()
            
            # Calculate amounts
            dot_amount = order_data.dot_amount
            brl_amount = dot_amount * rates["dot_to_brl"]
            usd_amount = dot_amount * rates["dot_to_usd"]
            
            # Calculate LP fee
            lp_fee = (brl_amount * settings.lp_fee_percentage) / 100
            
            # Check user limits
            if order_data.order_type == OrderType.BUY:
                if usd_amount > user.buy_limit_usd:
                    logger.warning(f"User {user.id} exceeded buy limit")
                    return None
            else:
                if usd_amount > user.sell_limit_usd:
                    logger.warning(f"User {user.id} exceeded sell limit")
                    return None
            
            # Create order in database
            order = Order(
                order_type=order_data.order_type,
                status=OrderStatus.PENDING,
                dot_amount=dot_amount,
                brl_amount=brl_amount,
                usd_amount=usd_amount,
                exchange_rate_dot_brl=rates["dot_to_brl"],
                lp_fee_amount=lp_fee,
                user_id=user.id,
                pix_key=order_data.pix_key,
                expires_at=datetime.utcnow() + timedelta(minutes=15)
            )
            
            db.add(order)
            db.commit()
            db.refresh(order)
            
            # Create order on blockchain
            order_type_str = "Sell" if order_data.order_type == OrderType.SELL else "Buy"
            blockchain_result = polkadot_service.create_order(order_type_str, dot_amount)
            
            if not blockchain_result:
                logger.error(f"Failed to create order on blockchain for order {order.id}")
                db.delete(order)  # Rollback database if blockchain fails
                db.commit()
                return None
            
            # Update order with blockchain info
            order.blockchain_order_id = blockchain_result["order_id"]
            order.blockchain_tx_hash = blockchain_result["tx_hash"]
            db.commit()
            db.refresh(order)
            
            logger.info(f"{order_type_str} order created: DB ID={order.id}, Blockchain ID={order.blockchain_order_id}")
            
            return order
            
        except Exception as e:
            logger.error(f"Error creating order: {e}")
            db.rollback()
            return None
    
    def get_order(self, db: Session, order_id: int) -> Optional[Order]:
        """Get order by ID"""
        return db.query(Order).filter(Order.id == order_id).first()
    
    def get_active_orders(self, db: Session, order_type: Optional[OrderType] = None) -> List[Order]:
        """Get all active (pending) orders"""
        query = db.query(Order).filter(Order.status == OrderStatus.PENDING)
        
        if order_type:
            query = query.filter(Order.order_type == order_type)
        
        return query.order_by(Order.created_at.desc()).all()
    
    def get_user_orders(self, db: Session, user_id: int) -> List[Order]:
        """Get all orders from a user"""
        return db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()
    
    async def accept_order(
        self,
        db: Session,
        order_id: int,
        lp: LiquidityProvider
    ) -> Optional[Order]:
        """LP accepts an order"""
        try:
            order = self.get_order(db, order_id)
            
            if not order or order.status != OrderStatus.PENDING:
                logger.warning(f"Order {order_id} not available for acceptance")
                return None
            
            # Check if LP can handle this order
            if order.usd_amount > lp.max_order_size_usd or order.usd_amount < lp.min_order_size_usd:
                logger.warning(f"Order size outside LP limits")
                return None
            
            # Accept order on blockchain
            if order.order_type == OrderType.SELL:
                # Sell order: LP accepts without depositing DOT
                blockchain_result = polkadot_service.accept_order(order.blockchain_order_id)
            else:
                # Buy order: LP accepts and deposits DOT
                blockchain_result = polkadot_service.accept_buy_order(order.blockchain_order_id, order.dot_amount)
            
            if not blockchain_result:
                logger.error(f"Failed to accept order {order_id} on blockchain")
                return None
            
            # Update order
            order.lp_id = lp.id
            order.status = OrderStatus.ACCEPTED
            order.accepted_at = datetime.utcnow()
            order.blockchain_tx_hash = blockchain_result["tx_hash"]  # Update with accept tx
            
            # Generate PIX QR code for payment
            if order.order_type == OrderType.BUY:
                # LP will receive PIX from buyer
                pix_result = pix_service.generate_pix_qr_code(
                    pix_key=lp.pix_key,
                    amount=order.brl_amount,
                    recipient_name="PolkaPay LP"
                )
                order.pix_qr_code = pix_result["qr_code"]
                order.pix_txid = pix_result["txid"]
            
            db.commit()
            db.refresh(order)
            
            logger.info(f"Order {order_id} accepted by LP {lp.id}")
            return order
            
        except Exception as e:
            logger.error(f"Error accepting order: {e}")
            db.rollback()
            return None
    
    def confirm_payment(
        self,
        db: Session,
        order_id: int,
        pix_txid: str,
        payment_proof: Optional[str] = None
    ) -> Optional[Order]:
        """Confirm PIX payment was sent"""
        try:
            order = self.get_order(db, order_id)
            
            if not order or order.status != OrderStatus.ACCEPTED:
                return None
            
            # Confirm payment on blockchain
            blockchain_result = polkadot_service.confirm_payment_sent(order.blockchain_order_id)
            
            if not blockchain_result:
                logger.error(f"Failed to confirm payment on blockchain for order {order_id}")
                return None
            
            # Update order
            order.status = OrderStatus.PAYMENT_SENT
            order.pix_txid = pix_txid
            order.pix_payment_proof = payment_proof
            order.payment_sent_at = datetime.utcnow()
            order.blockchain_tx_hash = blockchain_result["tx_hash"]  # Update with confirm tx
            
            db.commit()
            db.refresh(order)
            
            logger.info(f"Payment confirmed for order {order_id}")
            return order
            
        except Exception as e:
            logger.error(f"Error confirming payment: {e}")
            db.rollback()
            return None
    
    async def complete_order(
        self,
        db: Session,
        order_id: int
    ) -> Optional[Order]:
        """Complete order and release funds"""
        try:
            order = self.get_order(db, order_id)
            
            if not order or order.status != OrderStatus.PAYMENT_SENT:
                return None
            
            # Verify PIX payment (in production)
            if order.pix_txid and settings.pix_mock_enabled:
                # Mock verification
                pix_service.mock_confirm_payment(order.pix_txid)
            
            # Complete on blockchain
            blockchain_result = polkadot_service.complete_order(order.blockchain_order_id)
            
            if not blockchain_result:
                logger.error(f"Failed to complete order {order_id} on blockchain")
                return None
            
            # Update order
            order.status = OrderStatus.COMPLETED
            order.completed_at = datetime.utcnow()
            order.blockchain_tx_hash = blockchain_result["tx_hash"]  # Update with complete tx
            
            # Update user stats
            order.user.total_orders += 1
            order.user.successful_orders += 1
            
            # Update LP stats
            if order.liquidity_provider:
                order.liquidity_provider.total_orders_processed += 1
                order.liquidity_provider.total_volume_usd += order.usd_amount
                order.liquidity_provider.total_earnings_usd += (order.lp_fee_amount * order.usd_amount / order.brl_amount)
            
            db.commit()
            db.refresh(order)
            
            logger.info(f"Order {order_id} completed")
            return order
            
        except Exception as e:
            logger.error(f"Error completing order: {e}")
            db.rollback()
            return None
    
    async def cancel_order(
        self,
        db: Session,
        order_id: int
    ) -> Optional[Order]:
        """Cancel order and refund"""
        try:
            order = self.get_order(db, order_id)
            
            if not order or order.status not in [OrderStatus.PENDING, OrderStatus.ACCEPTED]:
                logger.warning(f"Order {order_id} cannot be cancelled (status: {order.status if order else 'not found'})")
                return None
            
            # Cancel on blockchain
            blockchain_result = polkadot_service.cancel_order(order.blockchain_order_id)
            
            if not blockchain_result:
                logger.error(f"Failed to cancel order {order_id} on blockchain")
                return None
            
            # Update order
            order.status = OrderStatus.CANCELLED
            order.cancelled_at = datetime.utcnow()
            order.blockchain_tx_hash = blockchain_result["tx_hash"]  # Update with cancel tx
            
            db.commit()
            db.refresh(order)
            
            logger.info(f"Order {order_id} cancelled")
            return order
            
        except Exception as e:
            logger.error(f"Error cancelling order: {e}")
            db.rollback()
            return None


# Global instance
order_service = OrderService()

