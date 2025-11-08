from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app.models import User, OrderType, OrderStatus
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


@router.post(
    "/",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar nova ordem",
    description="""
    Criar uma nova ordem de compra ou venda de DOT.
    
    **Tipos de Ordem:**
    - **BUY**: Usuário quer comprar DOT (pagará PIX ao LP)
    - **SELL**: Usuário quer vender DOT (receberá PIX do LP)
    
    **Limites:**
    - Usuários não verificados: $1 USD para compra, $100 USD para venda
    - Verificados: limites maiores baseados no nível de verificação
    
    **Fluxo:**
    1. Ordem criada com status PENDING
    2. DOT depositado em escrow no smart contract (para SELL)
    3. Ordem fica disponível para LPs aceitarem
    """,
    responses={
        201: {
            "description": "Ordem criada com sucesso",
            "content": {
                "application/json": {
                    "example": {
                        "id": 1,
                        "order_type": "sell",
                        "status": "pending",
                        "dot_amount": 10.0,
                        "brl_amount": 500.0,
                        "usd_amount": 100.0,
                        "exchange_rate_dot_brl": 50.0,
                        "lp_fee_amount": 2.0,
                        "user_id": 1,
                        "lp_id": None,
                        "pix_key": "user@example.com",
                        "pix_qr_code": None,
                        "pix_txid": None,
                        "blockchain_order_id": 0,
                        "blockchain_tx_hash": "0x123...",
                        "created_at": "2025-11-08T19:00:00Z",
                        "expires_at": "2025-11-08T20:00:00Z"
                    }
                }
            }
        },
        400: {"description": "Falha ao criar ordem - limites excedidos ou dados inválidos"},
        401: {"description": "Não autenticado"},
    }
)
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


@router.post(
    "/{order_id}/cancel",
    response_model=OrderResponse,
    summary="Cancelar ordem",
    description="""
    Cancela uma ordem e reembolsa DOT do escrow.
    
    **Restrições:**
    - Apenas o criador da ordem pode cancelar
    - Apenas ordens PENDING ou ACCEPTED podem ser canceladas
    - DOT é automaticamente reembolsado do smart contract
    
    **Casos de Uso:**
    - Usuário desistiu da transação
    - Nenhum LP aceitou a tempo
    - Erro na criação da ordem
    """,
    responses={
        200: {"description": "Ordem cancelada com sucesso"},
        403: {"description": "Não autorizado - não é o dono da ordem"},
        400: {"description": "Ordem não pode ser cancelada neste status"},
        404: {"description": "Ordem não encontrada"}
    }
)
async def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cancel order and refund DOT
    
    Only order creator can cancel
    Only PENDING or ACCEPTED orders can be cancelled
    """
    # Get order and validate ownership
    order = order_service.get_order(db, order_id)
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this order"
        )
    
    # Cancel order
    cancelled_order = await order_service.cancel_order(db, order_id)
    
    if not cancelled_order:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to cancel order. Order may not be in cancellable status."
        )
    
    return cancelled_order


@router.post(
    "/{order_id}/dispute",
    response_model=OrderResponse,
    summary="Criar disputa",
    description="""
    Cria uma disputa para uma ordem em andamento.
    
    **Quando usar:**
    - Pagamento PIX não foi recebido (comprador)
    - Pagamento PIX foi enviado mas LP não confirmou (vendedor)
    - Problemas na transação
    
    **Restrições:**
    - Disponível apenas em status PAYMENT_SENT
    - Pode ser chamado por comprador ou vendedor
    - Congela fundos no escrow até resolução
    
    **Próximos Passos:**
    - Admin analisa evidências
    - Admin resolve disputa via `/resolve-dispute`
    - Fundos são liberados para a parte favorecida
    """,
    responses={
        200: {"description": "Disputa criada com sucesso"},
        403: {"description": "Não autorizado - não está envolvido na ordem"},
        500: {"description": "Falha ao criar disputa no blockchain"}
    }
)
async def create_dispute(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create dispute for an order
    
    Only available in PAYMENT_SENT status
    Can be called by buyer or seller
    """
    order = order_service.get_order(db, order_id)
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Verify user is involved in the order
    is_buyer = order.user_id == current_user.id
    is_seller = order.lp_id and order.liquidity_provider.user_id == current_user.id
    
    if not (is_buyer or is_seller):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to dispute this order"
        )
    
    # Create dispute on blockchain
    from app.services.polkadot_service import polkadot_service
    
    blockchain_result = polkadot_service.create_dispute(order.blockchain_order_id)
    
    if not blockchain_result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create dispute on blockchain"
        )
    
    # Update order status
    order.status = OrderStatus.DISPUTED
    order.blockchain_tx_hash = blockchain_result["tx_hash"]
    db.commit()
    db.refresh(order)
    
    return order


@router.post(
    "/{order_id}/resolve-dispute",
    response_model=OrderResponse,
    summary="Resolver disputa (Admin)",
    description="""
    Resolve uma disputa existente. **Apenas Admin.**
    
    **Parâmetros:**
    - `favor_buyer`: true = transfere DOT para comprador, false = transfere para vendedor
    
    **Processo:**
    1. Admin analisa evidências (comprovantes PIX, mensagens)
    2. Decide a favor de uma das partes
    3. Smart contract transfere fundos automaticamente
    4. Ordem marcada como COMPLETED
    
    **TODO:** Implementar verificação de admin real (atualmente usa contract owner)
    """,
    responses={
        200: {"description": "Disputa resolvida com sucesso"},
        400: {"description": "Ordem não está em disputa"},
        500: {"description": "Falha ao resolver disputa no blockchain"}
    }
)
async def resolve_dispute(
    order_id: int,
    favor_buyer: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Resolve dispute (Admin only)
    
    favor_buyer: True to transfer DOT to buyer, False to transfer to seller
    """
    # TODO: Add proper admin check
    # For now, only contract owner can resolve
    
    order = order_service.get_order(db, order_id)
    
    if not order or order.status != OrderStatus.DISPUTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order not found or not in disputed status"
        )
    
    # Resolve dispute on blockchain
    from app.services.polkadot_service import polkadot_service
    
    blockchain_result = polkadot_service.resolve_dispute(
        order.blockchain_order_id,
        favor_buyer
    )
    
    if not blockchain_result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to resolve dispute on blockchain"
        )
    
    # Update order status
    order.status = OrderStatus.COMPLETED
    order.completed_at = datetime.utcnow()
    order.blockchain_tx_hash = blockchain_result["tx_hash"]
    db.commit()
    db.refresh(order)
    
    return order


@router.get(
    "/{order_id}/blockchain",
    summary="Consultar ordem na blockchain",
    description="""
    Consulta dados da ordem diretamente no smart contract.
    
    **Uso:**
    - Verificação de sincronização entre DB e blockchain
    - Debugging de inconsistências
    - Auditoria de transações
    
    **Retorna:**
    - Dados do banco de dados local
    - Dados do smart contract
    - Status de sincronização (synced/out_of_sync)
    """,
    responses={
        200: {
            "description": "Dados da ordem na blockchain",
            "content": {
                "application/json": {
                    "example": {
                        "database_order_id": 1,
                        "blockchain_order_id": 0,
                        "blockchain_data": {
                            "buyer": "5GrwvaEF...",
                            "seller": None,
                            "dot_amount": 10000000000000,
                            "status": "pending",
                            "order_type": "sell"
                        },
                        "sync_status": "synced"
                    }
                }
            }
        },
        404: {"description": "Ordem não encontrada ou não está na blockchain"}
    }
)
async def get_blockchain_order(
    order_id: int,
    db: Session = Depends(get_db)
):
    """
    Get order details directly from blockchain
    
    Useful for verification and debugging
    """
    order = order_service.get_order(db, order_id)
    
    if not order or not order.blockchain_order_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found or not on blockchain"
        )
    
    # Query blockchain
    from app.services.polkadot_service import polkadot_service
    
    blockchain_order = polkadot_service.get_order(order.blockchain_order_id)
    
    if not blockchain_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found on blockchain"
        )
    
    return {
        "database_order_id": order.id,
        "blockchain_order_id": order.blockchain_order_id,
        "blockchain_data": blockchain_order,
        "sync_status": "synced" if order.status.value.lower() == blockchain_order["status"].lower() else "out_of_sync"
    }


@router.get("/rates/exchange")
async def get_exchange_rates():
    """Get current DOT exchange rates"""
    rates = await order_service.get_exchange_rates()
    return rates

