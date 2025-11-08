# API Reference

Complete API documentation with examples.

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

### Wallet Login

Authenticate using Polkadot wallet signature.

**Endpoint**: `POST /auth/wallet`

**Request**:
```json
{
  "wallet_address": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  "message": "Login to PolkaPay",
  "signature": "0x..."
}
```

**Response**:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

### Get User Profile

Get authenticated user information.

**Endpoint**: `GET /auth/me`

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "id": 1,
  "wallet_address": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  "buy_limit_usd": 1.0,
  "sell_limit_usd": 100.0,
  "total_orders": 5,
  "rating": 5.0
}
```

## Exchange Rates

### Get Current Rates

Get DOT exchange rates.

**Endpoint**: `GET /orders/rates/exchange`

**Example**:
```bash
curl http://localhost:8000/api/v1/orders/rates/exchange
```

**Response**:
```json
{
  "dot_to_usd": 7.5,
  "dot_to_brl": 37.5
}
```

## Orders

### Create Sell Order

User sells DOT for PIX.

**Endpoint**: `POST /orders/`

**Request**:
```json
{
  "order_type": "sell",
  "dot_amount": 2.0,
  "pix_key": "user@email.com"
}
```

**Example**:
```bash
curl -X POST http://localhost:8000/api/v1/orders/ \
  -H "Content-Type: application/json" \
  -d '{
    "order_type": "sell",
    "dot_amount": 2.0,
    "pix_key": "user@email.com"
  }'
```

**Response**:
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
  "pix_key": "user@email.com",
  "pix_qr_code": null,
  "pix_txid": null,
  "contract_order_id": 1,
  "created_at": "2024-10-03T10:00:00Z",
  "expires_at": "2024-10-03T10:15:00Z"
}
```

### Create Buy Order

User buys DOT with PIX.

**Endpoint**: `POST /orders/`

**Request**:
```json
{
  "order_type": "buy",
  "dot_amount": 1.0
}
```

**Example**:
```bash
curl -X POST http://localhost:8000/api/v1/orders/ \
  -H "Content-Type: application/json" \
  -d '{
    "order_type": "buy",
    "dot_amount": 1.0
  }'
```

**Response**:
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

### List Orders

Get all active orders.

**Endpoint**: `GET /orders/`

**Query Parameters**:
- `order_type` (optional): Filter by "buy" or "sell"
- `status` (optional): Filter by status

**Example**:
```bash
# All orders
curl http://localhost:8000/api/v1/orders/

# Only buy orders
curl http://localhost:8000/api/v1/orders/?order_type=buy
```

**Response**:
```json
[
  {
    "id": 1,
    "order_type": "sell",
    "status": "pending",
    "dot_amount": 2.0,
    "brl_amount": 75.0,
    ...
  },
  {
    "id": 2,
    "order_type": "buy",
    "status": "pending",
    "dot_amount": 1.0,
    "brl_amount": 37.5,
    ...
  }
]
```

### Get Order Details

Get specific order information.

**Endpoint**: `GET /orders/{id}`

**Example**:
```bash
curl http://localhost:8000/api/v1/orders/1
```

### Get My Orders

Get orders for authenticated user.

**Endpoint**: `GET /orders/my-orders`

**Headers**: `Authorization: Bearer <token>`

### Accept Order (LP)

LP accepts an order.

**Endpoint**: `POST /orders/{id}/accept`

**Example**:
```bash
curl -X POST http://localhost:8000/api/v1/orders/1/accept \
  -H "Content-Type: application/json"
```

**Response**:
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

### Confirm Payment

User confirms PIX payment received.

**Endpoint**: `POST /orders/{id}/confirm-payment`

**Request**:
```json
{
  "pix_txid": "E12345678901234567890123456",
  "payment_proof": "https://example.com/proof.jpg"
}
```

**Example**:
```bash
curl -X POST http://localhost:8000/api/v1/orders/1/confirm-payment \
  -H "Content-Type: application/json" \
  -d '{
    "pix_txid": "E12345678901234567890123456"
  }'
```

### Complete Order

System completes the order.

**Endpoint**: `POST /orders/{id}/complete`

**Example**:
```bash
curl -X POST http://localhost:8000/api/v1/orders/1/complete
```

**Response**:
```json
{
  "id": 1,
  "status": "completed",
  "completed_at": "2024-10-03T10:30:00Z",
  ...
}
```

## Liquidity Providers

### Register as LP

Register as a liquidity provider.

**Endpoint**: `POST /lp/register`

**Request**:
```json
{
  "pix_key": "lp@email.com",
  "pix_key_type": "email"
}
```

**Example**:
```bash
curl -X POST http://localhost:8000/api/v1/lp/register \
  -H "Content-Type: application/json" \
  -d '{
    "pix_key": "lp@email.com",
    "pix_key_type": "email"
  }'
```

**Response**:
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

### Get LP Profile

Get LP profile information.

**Endpoint**: `GET /lp/profile`

**Headers**: `Authorization: Bearer <token>`

### Get Available Orders

Get orders available for LP to accept.

**Endpoint**: `GET /lp/available-orders`

**Example**:
```bash
curl http://localhost:8000/api/v1/lp/available-orders
```

**Response**:
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

### Get LP Orders

Get orders accepted by LP.

**Endpoint**: `GET /lp/my-orders`

**Headers**: `Authorization: Bearer <token>`

### Update LP Availability

Update LP availability status.

**Endpoint**: `PUT /lp/availability`

**Query Parameters**:
- `is_available`: boolean

**Example**:
```bash
curl -X PUT "http://localhost:8000/api/v1/lp/availability?is_available=false" \
  -H "Content-Type: application/json"
```

### Get LP Earnings

Get LP earnings statistics.

**Endpoint**: `GET /lp/earnings`

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "total_orders": 15,
  "total_volume_usd": 1500.0,
  "total_earnings_usd": 30.0,
  "rating": 4.8
}
```

## Complete Order Flow Example

### Sell Order Flow

```bash
# 1. Create sell order
ORDER_ID=$(curl -s -X POST http://localhost:8000/api/v1/orders/ \
  -H "Content-Type: application/json" \
  -d '{"order_type": "sell", "dot_amount": 2.0, "pix_key": "user@email.com"}' \
  | jq -r '.id')

echo "Order created: $ORDER_ID"

# 2. LP accepts order
curl -X POST http://localhost:8000/api/v1/orders/$ORDER_ID/accept

# 3. LP sends PIX (off-chain)

# 4. User confirms payment
curl -X POST http://localhost:8000/api/v1/orders/$ORDER_ID/confirm-payment \
  -H "Content-Type: application/json" \
  -d '{"pix_txid": "E12345678901234567890123456"}'

# 5. Complete order
curl -X POST http://localhost:8000/api/v1/orders/$ORDER_ID/complete

# 6. Verify completion
curl http://localhost:8000/api/v1/orders/$ORDER_ID | jq
```

## Code Examples

### Python

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

### JavaScript

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

## Status Codes

- `200 OK` - Successful request
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation error
- `500 Internal Server Error` - Server error

## Error Response Format

```json
{
  "detail": "Error message description"
}
```

## Notes

- All timestamps are in UTC
- Orders expire in 15 minutes by default
- LP fee is 2% of order amount
- PIX is currently mocked
- Authentication via JWT tokens
- Rate limiting applied per IP

## Interactive Documentation

For interactive API testing, visit:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

