# API Examples - PolkaPay

Exemplos práticos de como usar a API do PolkaPay.

## Base URL

```
http://localhost:8000/api/v1
```

## 🔍 Health Check

### Check API Status

```bash
curl http://localhost:8000/health
```

**Response:**
```json
{
  "status": "healthy",
  "polkadot_connected": true
}
```

## 💱 Exchange Rates

### Get Current DOT Exchange Rates

```bash
curl http://localhost:8000/api/v1/orders/rates/exchange
```

**Response:**
```json
{
  "dot_to_usd": 7.5,
  "dot_to_brl": 37.5
}
```

## 📋 Orders

### 1. Create SELL Order (User wants to sell DOT for PIX)

```bash
curl -X POST http://localhost:8000/api/v1/orders/ \
  -H "Content-Type: application/json" \
  -d '{
    "order_type": "sell",
    "dot_amount": 2.0,
    "pix_key": "usuario@email.com"
  }'
```

**Response:**
```json
{
  "id": 1,
  "order_type": "sell",
  "status": "pending",
  "dot_amount": 2.0,
  "brl_amount": 75.0,
  "usd_amount": 15.0,
  "exchange_rate_dot_brl": 37.5,
  "lp_fee_amount": 1.5,
  "user_id": 1,
  "lp_id": null,
  "pix_key": "usuario@email.com",
  "pix_qr_code": null,
  "pix_txid": null,
  "contract_order_id": 1,
  "created_at": "2024-10-03T10:00:00Z",
  "expires_at": "2024-10-03T10:15:00Z"
}
```

### 2. Create BUY Order (User wants to buy DOT with PIX)

```bash
curl -X POST http://localhost:8000/api/v1/orders/ \
  -H "Content-Type: application/json" \
  -d '{
    "order_type": "buy",
    "dot_amount": 1.0
  }'
```

**Response:**
```json
{
  "id": 2,
  "order_type": "buy",
  "status": "pending",
  "dot_amount": 1.0,
  "brl_amount": 37.5,
  "usd_amount": 7.5,
  "exchange_rate_dot_brl": 37.5,
  "lp_fee_amount": 0.75,
  "user_id": 1,
  "lp_id": null,
  "pix_key": null,
  "pix_qr_code": null,
  "pix_txid": null,
  "contract_order_id": null,
  "created_at": "2024-10-03T10:00:00Z",
  "expires_at": "2024-10-03T10:15:00Z"
}
```

### 3. List All Active Orders

```bash
curl http://localhost:8000/api/v1/orders/
```

**Response:**
```json
[
  {
    "id": 1,
    "order_type": "sell",
    "status": "pending",
    ...
  },
  {
    "id": 2,
    "order_type": "buy",
    "status": "pending",
    ...
  }
]
```

### 4. List Only BUY Orders

```bash
curl http://localhost:8000/api/v1/orders/?order_type=buy
```

### 5. Get Order Details

```bash
curl http://localhost:8000/api/v1/orders/1
```

### 6. Get My Orders

```bash
curl http://localhost:8000/api/v1/orders/my-orders
```

## 👤 Liquidity Provider (LP)

### 1. Register as LP

```bash
curl -X POST http://localhost:8000/api/v1/lp/register \
  -H "Content-Type: application/json" \
  -d '{
    "pix_key": "lp@email.com",
    "pix_key_type": "email"
  }'
```

**Response:**
```json
{
  "id": 1,
  "pix_key": "lp@email.com",
  "pix_key_type": "email",
  "total_orders_processed": 0,
  "total_volume_usd": 0,
  "total_earnings_usd": 0,
  "rating": 5.0,
  "is_active": true,
  "is_available": true,
  "created_at": "2024-10-03T10:00:00Z"
}
```

### 2. Get LP Profile

```bash
curl http://localhost:8000/api/v1/lp/profile
```

### 3. Get Available Orders (for LP to accept)

```bash
curl http://localhost:8000/api/v1/lp/available-orders
```

**Response:**
```json
[
  {
    "id": 1,
    "order_type": "sell",
    "status": "pending",
    "dot_amount": 2.0,
    "brl_amount": 75.0,
    "usd_amount": 15.0,
    ...
  }
]
```

### 4. Accept Order (LP)

```bash
curl -X POST http://localhost:8000/api/v1/orders/1/accept \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "id": 1,
  "order_type": "sell",
  "status": "accepted",
  "lp_id": 1,
  "pix_qr_code": "PIX|KEY:lp@email.com|AMOUNT:75.00|...",
  ...
}
```

### 5. Get LP Orders

```bash
curl http://localhost:8000/api/v1/lp/my-orders
```

### 6. Update LP Availability

```bash
curl -X PUT "http://localhost:8000/api/v1/lp/availability?is_available=false" \
  -H "Content-Type: application/json"
```

### 7. Get LP Earnings

```bash
curl http://localhost:8000/api/v1/lp/earnings
```

**Response:**
```json
{
  "total_orders": 15,
  "total_volume_usd": 1500.0,
  "total_earnings_usd": 30.0,
  "rating": 4.8
}
```

## 💳 Order Flow - Complete Example

### Scenario: User wants to SELL 2 DOT for PIX

#### Step 1: User creates sell order

```bash
curl -X POST http://localhost:8000/api/v1/orders/ \
  -H "Content-Type: application/json" \
  -d '{
    "order_type": "sell",
    "dot_amount": 2.0,
    "pix_key": "usuario@email.com"
  }'
```

#### Step 2: LP accepts order

```bash
curl -X POST http://localhost:8000/api/v1/orders/1/accept
```

#### Step 3: LP sends PIX to user (off-chain)

*LP transfers BRL via PIX to usuario@email.com*

#### Step 4: User confirms PIX payment received

```bash
curl -X POST http://localhost:8000/api/v1/orders/1/confirm-payment \
  -H "Content-Type: application/json" \
  -d '{
    "pix_txid": "E12345678901234567890123456",
    "payment_proof": "screenshot_url_optional"
  }'
```

#### Step 5: System completes order and releases DOT to LP

```bash
curl -X POST http://localhost:8000/api/v1/orders/1/complete
```

**Response:**
```json
{
  "id": 1,
  "status": "completed",
  "completed_at": "2024-10-03T10:30:00Z",
  ...
}
```

## 🧪 Testing with Python

```python
import requests

BASE_URL = "http://localhost:8000/api/v1"

# Get exchange rates
response = requests.get(f"{BASE_URL}/orders/rates/exchange")
rates = response.json()
print(f"1 DOT = R$ {rates['dot_to_brl']}")

# Create sell order
order_data = {
    "order_type": "sell",
    "dot_amount": 1.5,
    "pix_key": "test@email.com"
}
response = requests.post(f"{BASE_URL}/orders/", json=order_data)
order = response.json()
print(f"Order created: {order['id']}")

# List active orders
response = requests.get(f"{BASE_URL}/orders/")
orders = response.json()
print(f"Active orders: {len(orders)}")
```

## 🧪 Testing with JavaScript/Node

```javascript
const BASE_URL = "http://localhost:8000/api/v1";

// Get exchange rates
async function getExchangeRates() {
  const response = await fetch(`${BASE_URL}/orders/rates/exchange`);
  const rates = await response.json();
  console.log(`1 DOT = R$ ${rates.dot_to_brl}`);
}

// Create sell order
async function createSellOrder() {
  const response = await fetch(`${BASE_URL}/orders/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      order_type: 'sell',
      dot_amount: 1.5,
      pix_key: 'test@email.com'
    })
  });
  const order = await response.json();
  console.log(`Order created: ${order.id}`);
}

getExchangeRates();
createSellOrder();
```

## 📝 Notes

- All timestamps are in UTC
- Order expires in 15 minutes by default
- LP fee is 2% of the order amount
- PIX is currently mocked (no real payment integration)
- Authentication is currently simplified (wallet-based auth to be fully implemented)

## 🔐 Authentication (TODO)

Future endpoints will require authentication via wallet signature:

```bash
# Login with wallet
curl -X POST http://localhost:8000/api/v1/auth/wallet \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
    "message": "Login to PolkaPay",
    "signature": "0x..."
  }'

# Use token in subsequent requests
curl http://localhost:8000/api/v1/orders/my-orders \
  -H "Authorization: Bearer <token>"
```

