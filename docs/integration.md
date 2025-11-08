# Integration Guide

Complete guide for Backend ↔ Smart Contract ↔ Frontend integration.

## Architecture Overview

```
┌─────────────────┐
│    Frontend     │
│   (Next.js)     │
└────────┬────────┘
         │ HTTP/REST
         │
┌────────▼────────┐
│    Backend      │
│   (FastAPI)     │
└────────┬────────┘
         │ py-substrate-interface
         │
┌────────▼────────┐
│ Smart Contract  │
│  (ink! 5.1)     │
│   Rococo        │
└─────────────────┘
```

## Data Flow

### Complete Order Flow (Sell)

```
1. Frontend: User clicks "Sell 10 DOT"
   ↓
2. Frontend: POST /api/v1/orders
   {
     "order_type": "Sell",
     "dot_amount": 10.0,
     "pix_key": "user@email.com"
   }
   ↓
3. Backend: order_service.create_order()
   - Calculate BRL amount (exchange rate)
   - Calculate LP fee
   ↓
4. Backend: polkadot_service.create_order("Sell", 10.0)
   - Convert DOT to Planck (10.0 * 10^10)
   - Call contract.exec("create_order", OrderType::Sell, value=10 DOT)
   ↓
5. Smart Contract: create_order(OrderType::Sell)
   - Transfer 10 DOT from user to contract
   - Create order record
   - Emit OrderCreated event
   - Return order_id = 1
   ↓
6. Backend: Save to database
   - blockchain_order_id = 1
   - blockchain_tx_hash = "0xabc..."
   - status = PENDING
   ↓
7. Frontend: Display order created
   - Show order ID
   - Show tx hash with link to explorer
   - Redirect to order details page
```

## Backend Integration

### PolkadotService Implementation

**File**: `backend/app/services/polkadot_service.py`

#### Connection Setup

```python
from substrateinterface import SubstrateInterface, Keypair, ContractInstance
from app.config import settings

class PolkadotService:
    def __init__(self):
        self.substrate = None
        self.contract = None
        self.keypair = None
        
    def connect(self):
        # Connect to Rococo
        self.substrate = SubstrateInterface(
            url=settings.polkadot_node_url,
            ss58_format=42,
            type_registry_preset='rococo'
        )
        
        # Load keypair
        self.keypair = Keypair.create_from_uri(settings.signer_seed)
        
        # Load contract
        self.contract = ContractInstance.create_from_address(
            contract_address=settings.contract_address,
            metadata_file=settings.contract_metadata_path,
            substrate=self.substrate
        )
```

#### Create Order Method

```python
def create_order(self, order_type: str, dot_amount: float) -> Optional[Dict]:
    try:
        # Convert order type
        order_type_enum = 0 if order_type == "Sell" else 1
        
        # Convert DOT to Planck
        amount_planck = int(dot_amount * (10 ** 10))
        
        # For Sell orders, send DOT as value
        value = amount_planck if order_type == "Sell" else 0
        
        # Execute contract call
        receipt = self.contract.exec(
            keypair=self.keypair,
            method='create_order',
            args={'order_type': order_type_enum},
            value=value,
            gas_limit={
                'ref_time': 10000000000,
                'proof_size': 1000000
            }
        )
        
        if receipt.is_success:
            # Extract order_id from contract result
            order_id = receipt.contract_result_data
            
            return {
                "order_id": order_id,
                "tx_hash": receipt.extrinsic_hash,
                "block_number": receipt.block_number
            }
        else:
            logger.error(f"Contract call failed: {receipt.error_message}")
            return None
            
    except Exception as e:
        logger.error(f"Error creating order: {e}")
        return None
```

#### Accept Order Methods

```python
def accept_order(self, order_id: int) -> Optional[Dict]:
    """Accept Sell order (LP doesn't deposit DOT)"""
    try:
        receipt = self.contract.exec(
            keypair=self.keypair,
            method='accept_order',
            args={'order_id': order_id},
            value=0,
            gas_limit={'ref_time': 10000000000, 'proof_size': 1000000}
        )
        
        if receipt.is_success:
            return {
                "tx_hash": receipt.extrinsic_hash,
                "block_number": receipt.block_number
            }
        return None
    except Exception as e:
        logger.error(f"Error accepting order: {e}")
        return None

def accept_buy_order(self, order_id: int, dot_amount: float) -> Optional[Dict]:
    """Accept Buy order (LP deposits DOT)"""
    try:
        amount_planck = int(dot_amount * (10 ** 10))
        
        receipt = self.contract.exec(
            keypair=self.keypair,
            method='accept_buy_order',
            args={'order_id': order_id},
            value=amount_planck,  # LP deposits DOT
            gas_limit={'ref_time': 10000000000, 'proof_size': 1000000}
        )
        
        if receipt.is_success:
            return {
                "tx_hash": receipt.extrinsic_hash,
                "block_number": receipt.block_number
            }
        return None
    except Exception as e:
        logger.error(f"Error accepting buy order: {e}")
        return None
```

#### Get Order Method (Read-Only)

```python
def get_order(self, order_id: int) -> Optional[Dict]:
    """Query order details from blockchain"""
    try:
        result = self.contract.read(
            keypair=self.keypair,
            method='get_order',
            args={'order_id': order_id}
        )
        
        if result.contract_result_data:
            order = result.contract_result_data
            
            # Convert Planck to DOT
            amount_dot = order['amount'] / (10 ** 10)
            lp_fee_dot = order['lp_fee'] / (10 ** 10)
            
            # Map status enum to string
            status_map = {
                0: "Pending",
                1: "Accepted",
                2: "PaymentSent",
                3: "Completed",
                4: "Cancelled",
                5: "Disputed"
            }
            
            return {
                "id": order['id'],
                "order_type": "Sell" if order['order_type'] == 0 else "Buy",
                "buyer": order['buyer'],
                "seller": order['seller'],
                "amount": amount_dot,
                "lp_fee": lp_fee_dot,
                "status": status_map.get(order['status'], "Unknown"),
                "created_at": order['created_at']
            }
        return None
    except Exception as e:
        logger.error(f"Error getting order: {e}")
        return None
```

### OrderService Integration

**File**: `backend/app/services/order_service.py`

```python
from app.services.polkadot_service import polkadot_service

class OrderService:
    async def create_order(self, db: Session, user: User, order_data: OrderCreate) -> Optional[Order]:
        # Get exchange rates
        rates = await self.get_exchange_rates()
        
        # Calculate amounts
        dot_amount = order_data.dot_amount
        brl_amount = dot_amount * rates["dot_to_brl"]
        lp_fee = (brl_amount * settings.lp_fee_percentage) / 100
        
        # Call blockchain
        blockchain_result = polkadot_service.create_order(
            order_type=order_data.order_type.value,
            dot_amount=dot_amount
        )
        
        if not blockchain_result:
            logger.error("Failed to create order on blockchain")
            return None
        
        # Save to database
        order = Order(
            blockchain_order_id=blockchain_result["order_id"],
            blockchain_tx_hash=blockchain_result["tx_hash"],
            order_type=order_data.order_type,
            status=OrderStatus.PENDING,
            dot_amount=dot_amount,
            brl_amount=brl_amount,
            lp_fee_amount=lp_fee,
            user_id=user.id,
            pix_key=order_data.pix_key
        )
        
        db.add(order)
        db.commit()
        db.refresh(order)
        
        return order
```

### API Endpoints

**File**: `backend/app/routers/orders.py`

```python
@router.post("/{order_id}/accept")
async def accept_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_lp: LiquidityProvider = Depends(get_current_lp)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order or order.status != OrderStatus.PENDING:
        raise HTTPException(status_code=400, detail="Cannot accept order")
    
    # Call appropriate blockchain method
    if order.order_type == OrderType.SELL:
        result = polkadot_service.accept_order(order.blockchain_order_id)
    else:  # BUY
        result = polkadot_service.accept_buy_order(
            order.blockchain_order_id,
            order.dot_amount
        )
    
    if not result:
        raise HTTPException(status_code=500, detail="Blockchain transaction failed")
    
    # Update database
    order.status = OrderStatus.ACCEPTED
    order.liquidity_provider_id = current_lp.id
    order.blockchain_tx_hash = result["tx_hash"]
    db.commit()
    
    return {"message": "Order accepted", "tx_hash": result["tx_hash"]}
```

## Frontend Integration

### API Client

**File**: `frontend/src/lib/api/orders.ts`

```typescript
import { api } from './api';

export interface CreateOrderRequest {
  order_type: 'Sell' | 'Buy';
  dot_amount: number;
  pix_key: string;
}

export interface Order {
  id: number;
  blockchain_order_id: number;
  blockchain_tx_hash: string;
  order_type: 'Sell' | 'Buy';
  status: string;
  dot_amount: number;
  brl_amount: number;
  lp_fee_amount: number;
  created_at: string;
}

export const ordersApi = {
  async createOrder(data: CreateOrderRequest): Promise<Order> {
    const response = await api.post('/orders', data);
    return response.data;
  },

  async getOrder(orderId: number): Promise<Order> {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  async acceptOrder(orderId: number): Promise<void> {
    await api.post(`/orders/${orderId}/accept`);
  },

  async completeOrder(orderId: number): Promise<void> {
    await api.post(`/orders/${orderId}/complete`);
  }
};
```

### useOrder Hook

**File**: `frontend/src/hooks/useOrder.ts`

```typescript
import { useState, useCallback } from 'react';
import { ordersApi, Order, CreateOrderRequest } from '@/lib/api/orders';
import { useWallet } from '@/contexts/WalletContext';

export function useOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { selectedAccount } = useWallet();

  const createOrder = useCallback(async (data: CreateOrderRequest): Promise<Order | null> => {
    if (!selectedAccount) {
      setError('No wallet connected');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const order = await ordersApi.createOrder(data);
      return order;
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to create order';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [selectedAccount]);

  return {
    createOrder,
    loading,
    error
  };
}
```

### Component Integration

**File**: `frontend/src/components/features/sell-modal.tsx`

```typescript
import { useOrder } from '@/hooks/useOrder';
import { useWallet } from '@/contexts/WalletContext';

export function SellModal() {
  const { createOrder, loading, error } = useOrder();
  const { isConnected } = useWallet();
  const [dotAmount, setDotAmount] = useState('');
  const [pixKey, setPixKey] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    const order = await createOrder({
      order_type: 'Sell',
      dot_amount: parseFloat(dotAmount),
      pix_key: pixKey
    });

    if (order) {
      // Show success message
      alert(`Order created! ID: ${order.id}, TX: ${order.blockchain_tx_hash}`);
      
      // Redirect to order details
      router.push(`/orders/${order.id}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="number"
        value={dotAmount}
        onChange={(e) => setDotAmount(e.target.value)}
        placeholder="DOT Amount"
        disabled={loading}
      />
      <input
        type="text"
        value={pixKey}
        onChange={(e) => setPixKey(e.target.value)}
        placeholder="PIX Key"
        disabled={loading}
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading || !isConnected}>
        {loading ? 'Creating...' : 'Sell DOT'}
      </button>
    </form>
  );
}
```

## State Synchronization

### Database vs Blockchain

The system maintains state in two places:
1. **PostgreSQL Database**: Fast queries, user-friendly data
2. **Blockchain**: Source of truth, immutable

**Synchronization Strategy**:

1. **Write Operations**: Always write to blockchain first, then database
2. **Read Operations**: Read from database for speed, verify with blockchain when needed
3. **Recovery**: If database write fails after blockchain success, use blockchain as source of truth

### Handling Failures

**Scenario 1: Blockchain fails, database not touched**
```python
blockchain_result = polkadot_service.create_order(...)
if not blockchain_result:
    return None  # Don't touch database
```

**Scenario 2: Blockchain succeeds, database fails**
```python
blockchain_result = polkadot_service.create_order(...)  # Success
try:
    db.add(order)
    db.commit()
except Exception as e:
    # Log error, blockchain transaction is already done
    # Recovery: Query blockchain and recreate database record
    logger.error(f"Database failed after blockchain success: {e}")
    # Trigger recovery process
```

**Recovery Process**:
```python
def recover_order(blockchain_order_id: int):
    # Query blockchain
    blockchain_order = polkadot_service.get_order(blockchain_order_id)
    
    # Check if exists in database
    db_order = db.query(Order).filter(
        Order.blockchain_order_id == blockchain_order_id
    ).first()
    
    if not db_order:
        # Create missing database record
        order = Order(
            blockchain_order_id=blockchain_order_id,
            # ... populate from blockchain data
        )
        db.add(order)
        db.commit()
```

## Error Handling

### Contract Errors

Map contract errors to user-friendly messages:

```python
ERROR_MESSAGES = {
    "InsufficientBalance": "You don't have enough DOT",
    "OrderNotFound": "Order not found",
    "Unauthorized": "You don't have permission for this action",
    "InvalidOrderStatus": "Order is not in the correct status",
    "ContractPaused": "System is under maintenance",
    "OrderExpired": "Order has expired",
    "InvalidAmount": "Invalid amount specified"
}

def handle_contract_error(error: str) -> str:
    return ERROR_MESSAGES.get(error, f"Transaction failed: {error}")
```

### Network Errors

Implement retry logic for network failures:

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10)
)
def call_blockchain_with_retry(method, *args, **kwargs):
    return method(*args, **kwargs)
```

## Testing Integration

### Unit Tests

Test each layer independently:

```python
# Test PolkadotService
def test_create_order():
    service = PolkadotService()
    service.connect()
    
    result = service.create_order("Sell", 1.0)
    
    assert result is not None
    assert "order_id" in result
    assert "tx_hash" in result
```

### Integration Tests

Test full flow:

```python
@pytest.mark.asyncio
async def test_create_order_flow(client, db_session):
    # Create order via API
    response = client.post("/api/v1/orders", json={
        "order_type": "Sell",
        "dot_amount": 1.0,
        "pix_key": "test@email.com"
    })
    
    assert response.status_code == 200
    order = response.json()
    
    # Verify in database
    db_order = db_session.query(Order).filter(Order.id == order["id"]).first()
    assert db_order is not None
    assert db_order.blockchain_order_id is not None
    
    # Verify on blockchain
    blockchain_order = polkadot_service.get_order(db_order.blockchain_order_id)
    assert blockchain_order is not None
    assert blockchain_order["status"] == "Pending"
```

## Monitoring

### Blockchain Events

Listen to contract events:

```python
def monitor_contract_events():
    # Subscribe to events
    for event in substrate.subscribe_block_headers():
        # Check for contract events
        events = substrate.get_events(event['header']['number'])
        
        for evt in events:
            if evt.module_id == 'Contracts' and evt.event_id == 'ContractEmitted':
                # Parse event data
                contract_address = evt.params[0]['value']
                event_data = evt.params[1]['value']
                
                # Handle event
                handle_contract_event(contract_address, event_data)
```

### Health Checks

```python
@router.get("/health/blockchain")
async def blockchain_health():
    try:
        # Check connection
        polkadot_service.substrate.get_block()
        
        # Check contract
        polkadot_service.contract.read(method='is_paused')
        
        return {"status": "healthy"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
```

## Best Practices

1. **Always validate on blockchain**: Don't trust database alone
2. **Use transactions**: Wrap database operations in transactions
3. **Log everything**: Log all blockchain interactions
4. **Handle gas estimation**: Always estimate gas before transactions
5. **Implement idempotency**: Handle duplicate requests gracefully
6. **Monitor gas prices**: Adjust gas limits based on network conditions
7. **Cache blockchain data**: Cache read-only data to reduce RPC calls
8. **Implement circuit breakers**: Fail fast when blockchain is down
9. **Use websockets**: For real-time updates, use websocket subscriptions
10. **Test on testnet first**: Always test on Rococo before mainnet

## Troubleshooting

### "Transaction failed" errors

1. Check gas limit is sufficient
2. Verify contract is not paused
3. Check user has sufficient balance
4. Verify order status allows the operation

### Database out of sync

1. Query blockchain for truth
2. Update database record
3. Log discrepancy for investigation

### High latency

1. Cache frequently accessed data
2. Use read replicas for database
3. Implement request batching
4. Use websockets instead of polling

## Resources

- [py-substrate-interface Documentation](https://github.com/polkascan/py-substrate-interface)
- [Substrate RPC Documentation](https://polkadot.js.org/docs/substrate/rpc)
- [ink! Events](https://use.ink/basics/events)
- [FastAPI Background Tasks](https://fastapi.tiangolo.com/tutorial/background-tasks/)

