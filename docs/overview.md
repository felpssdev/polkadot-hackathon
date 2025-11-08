# Architecture Overview

PolkaPay system architecture and design patterns.

## System Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│   Frontend  │─────▶│   Backend    │─────▶│   PostgreSQL    │
│  (Next.js)  │      │  (FastAPI)   │      │                 │
└─────────────┘      └──────────────┘      └─────────────────┘
                            │
                            ├──────────────▶ ┌─────────────────┐
                            │                │   Polkadot      │
                            │                │  (Smart Contract)│
                            │                └─────────────────┘
                            │
                            ├──────────────▶ ┌─────────────────┐
                            │                │   Redis         │
                            │                │  (Cache)        │
                            │                └─────────────────┘
                            │
                            └──────────────▶ ┌─────────────────┐
                                             │   PIX API       │
                                             │   (Mock)        │
                                             └─────────────────┘
```

## Components

### Frontend

**Technology**: Next.js 15, React 19, TypeScript, Tailwind CSS 4

**Responsibilities**:
- User interface rendering
- Wallet integration (Polkadot.js)
- Client-side state management
- API communication

**Key Features**:
- 8-bit themed UI
- Wallet authentication
- Real-time order updates
- Responsive design

### Backend

**Technology**: FastAPI, Python 3.11

**Responsibilities**:
- REST API endpoints
- Business logic
- Database operations
- Smart contract interaction
- PIX integration
- Authentication/Authorization

**Key Features**:
- Async request handling
- Automatic API documentation
- JWT authentication
- Rate limiting
- Error handling

### Database

**Technology**: PostgreSQL 15

**Entities**:
- Users
- Liquidity Providers
- Orders
- Transactions

### Cache

**Technology**: Redis 7

**Responsibilities**:
- Session storage
- Rate limiting
- Temporary data caching
- Queue management

### Blockchain

**Technology**: Polkadot (Rococo Testnet), ink! 5.1 Smart Contracts

**Smart Contract Functions**:
- `create_order(order_type)` - Create and lock DOT in escrow (Sell) or create order without locking (Buy)
- `accept_order(order_id)` - LP accepts Sell order (no DOT deposit)
- `accept_buy_order(order_id)` - LP accepts Buy order (deposits DOT)
- `confirm_payment_sent(order_id)` - Mark payment as sent
- `complete_order(order_id)` - Release DOT to recipient (buyer or seller based on order type)
- `cancel_order(order_id)` - Cancel and refund DOT
- `create_dispute(order_id)` - Create dispute in PaymentSent status
- `resolve_dispute(order_id, favor_buyer)` - Admin resolves dispute
- `pause()` / `unpause()` - Emergency controls (owner only)
- `get_order(order_id)` - Read order details (view function)

**Backend Integration**:
- `PolkadotService` class handles all blockchain interactions
- Uses `py-substrate-interface` library
- `ContractInstance` for contract method calls
- Automatic gas estimation
- Transaction receipt handling
- Error mapping to user-friendly messages

### PIX Integration

**Technology**: Mock implementation (future: Stark Bank, Mercado Pago)

**Responsibilities**:
- Generate PIX QR codes
- Verify payments
- Payment confirmation

## Data Flow

### Sell Order Flow (DOT → PIX)

1. **User connects wallet** (Frontend)
   - Polkadot.js Extension integration
   - SubWallet, Talisman, or Polkadot.js supported
   
2. **User creates sell order** (Frontend → Backend API)
   - POST `/api/v1/orders`
   - Payload: `{ order_type: "Sell", dot_amount: 10.0, pix_key: "user@email.com" }`
   
3. **Backend locks DOT in smart contract** (Backend → Blockchain)
   - `polkadot_service.create_order(OrderType::Sell, 10.0)`
   - Smart contract locks DOT from user's wallet
   - Returns `blockchain_order_id` and `tx_hash`
   
4. **Order saved in database** (Backend → PostgreSQL)
   - Order record with `blockchain_order_id` and `blockchain_tx_hash`
   - Status: PENDING
   
5. **LP accepts order** (Frontend → Backend API)
   - POST `/api/v1/orders/{id}/accept`
   - Backend calls `polkadot_service.accept_order(order_id)`
   - Smart contract marks order as ACCEPTED
   
6. **LP sends PIX payment** (Off-chain)
   - LP transfers BRL via PIX to user's key
   
7. **User confirms PIX received** (Frontend → Backend API)
   - POST `/api/v1/orders/{id}/confirm-payment`
   - Backend calls `polkadot_service.confirm_payment_sent(order_id)`
   - Smart contract status: PAYMENT_SENT
   
8. **LP completes order** (Frontend → Backend API)
   - POST `/api/v1/orders/{id}/complete`
   - Backend calls `polkadot_service.complete_order(order_id)`
   - Smart contract releases DOT to LP (minus fee)
   - Fee transferred to contract owner
   
9. **Order marked complete** (Backend → Database)
   - Status: COMPLETED
   - `completed_at` timestamp saved

### Buy Order Flow (PIX → DOT)

1. **User connects wallet** (Frontend)
   - Polkadot.js Extension integration
   
2. **User creates buy order** (Frontend → Backend API)
   - POST `/api/v1/orders`
   - Payload: `{ order_type: "Buy", dot_amount: 10.0, pix_key: "user@email.com" }`
   
3. **Backend creates order on blockchain** (Backend → Blockchain)
   - `polkadot_service.create_order(OrderType::Buy, 10.0)`
   - Smart contract creates order WITHOUT locking DOT
   - Returns `blockchain_order_id` and `tx_hash`
   
4. **Order saved in database** (Backend → PostgreSQL)
   - Order record with blockchain references
   - Status: PENDING
   
5. **LP accepts order** (Frontend → Backend API)
   - POST `/api/v1/orders/{id}/accept`
   - Backend calls `polkadot_service.accept_buy_order(order_id, 10.0)`
   - Smart contract locks DOT from LP's wallet
   - Status: ACCEPTED
   
6. **LP generates PIX QR code** (Frontend → Backend)
   - Backend generates PIX payment details
   - QR code displayed to user
   
7. **User pays PIX** (Off-chain)
   - User transfers BRL via PIX to LP
   
8. **LP confirms payment received** (Frontend → Backend API)
   - POST `/api/v1/orders/{id}/confirm-payment`
   - Backend calls `polkadot_service.confirm_payment_sent(order_id)`
   - Status: PAYMENT_SENT
   
9. **User completes order** (Frontend → Backend API)
   - POST `/api/v1/orders/{id}/complete`
   - Backend calls `polkadot_service.complete_order(order_id)`
   - Smart contract releases DOT to user (minus fee)
   - Fee transferred to contract owner
   
10. **Order marked complete** (Backend → Database)
    - Status: COMPLETED
    - `completed_at` timestamp saved

### Dispute Flow

1. **User or LP creates dispute** (Frontend → Backend API)
   - POST `/api/v1/orders/{id}/dispute`
   - Only available in PAYMENT_SENT status
   - Backend calls `polkadot_service.create_dispute(order_id)`
   
2. **Admin reviews dispute** (Manual process)
   - Admin investigates evidence
   - Determines who should receive funds
   
3. **Admin resolves dispute** (Admin Panel → Backend API)
   - POST `/api/v1/orders/{id}/resolve-dispute`
   - Payload: `{ favor_buyer: true/false }`
   - Backend calls `polkadot_service.resolve_dispute(order_id, favor_buyer)`
   - Smart contract transfers DOT accordingly
   
4. **Order marked resolved** (Backend → Database)
   - Status: COMPLETED or DISPUTED_RESOLVED

## Security Architecture

### Authentication

- Non-custodial wallet authentication
- Message signing with private key
- JWT token generation
- Token-based API access

### Authorization

- Role-based access control (User, LP)
- Order ownership verification
- Action permissions

### Data Security

- Encrypted database connections
- Environment variable configuration
- HTTPS in production
- CORS configuration

### Smart Contract Security

- Escrow pattern for fund safety
- State validation on every transition
- Access control (only authorized parties can act)
- Emergency pause functionality (owner can halt operations)
- Reentrancy protection (Checks-Effects-Interactions pattern)
- Checked arithmetic (prevents overflow/underflow)
- Authorization checks (only buyer/seller can complete orders)

## Scalability Considerations

### Horizontal Scaling

- Stateless backend design
- Load balancer ready
- Redis for session sharing
- Database connection pooling

### Performance Optimization

- Database indexing
- Query optimization
- Redis caching
- Async operations
- Connection pooling

### Future Improvements

- WebSocket for real-time updates
- Message queue (RabbitMQ/Kafka)
- Microservices architecture
- CDN for static assets
- Database replication

## Deployment Architecture

### Development

```
Docker Compose
├── Backend container
├── Frontend container
├── PostgreSQL container
└── Redis container
```

### Production (Future)

```
Cloud Provider
├── Load Balancer
├── Backend instances (multiple)
├── Frontend (CDN)
├── Managed PostgreSQL
├── Managed Redis
└── Monitoring/Logging
```

## API Architecture

### RESTful Design

- Resource-based URLs
- HTTP methods (GET, POST, PUT, DELETE)
- JSON request/response
- Standard status codes
- Pagination support

### API Versioning

- URL-based versioning (`/api/v1/`)
- Backward compatibility
- Deprecation notices

### Documentation

- OpenAPI/Swagger specification
- Interactive API docs
- Code examples
- Response schemas

## Error Handling

### Backend

- Exception middleware
- Structured error responses
- Error logging
- Status code mapping

### Frontend

- Error boundaries
- User-friendly messages
- Retry mechanisms
- Fallback UI

## Monitoring and Logging

### Logging

- Structured logging (JSON)
- Log levels (DEBUG, INFO, WARNING, ERROR)
- Request/response logging
- Error tracking

### Metrics (Future)

- API response times
- Error rates
- Active users
- Order volume
- System health
