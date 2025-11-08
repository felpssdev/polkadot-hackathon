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

**Responsibilities**:
- Persistent data storage
- Transaction management
- Data integrity

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

**Technology**: Polkadot (Rococo Testnet), ink! Smart Contracts

**Responsibilities**:
- DOT escrow management
- Order state on-chain
- Fund transfers
- Fee distribution

**Smart Contract Functions**:
- `create_order()` - Lock DOT in escrow
- `accept_order()` - LP accepts order
- `confirm_payment_sent()` - User confirms PIX payment
- `complete_order()` - Release DOT to LP
- `cancel_order()` - Cancel and refund

### PIX Integration

**Technology**: Mock implementation (future: Stark Bank, Mercado Pago)

**Responsibilities**:
- Generate PIX QR codes
- Verify payments
- Payment confirmation

## Data Flow

### Sell Order Flow (DOT → PIX)

1. User connects wallet (frontend)
2. User creates sell order (frontend → backend)
3. Backend locks DOT in smart contract (backend → blockchain)
4. Order appears in marketplace (backend → database)
5. LP accepts order (frontend → backend)
6. Backend updates order status (backend → database)
7. LP sends PIX payment (off-chain)
8. User confirms PIX received (frontend → backend)
9. Backend releases DOT to LP (backend → blockchain)
10. Order marked complete (backend → database)

### Buy Order Flow (PIX → DOT)

1. User connects wallet (frontend)
2. User creates buy order (frontend → backend)
3. Order appears in marketplace (backend → database)
4. LP accepts order (frontend → backend)
5. Backend generates PIX QR code (backend → PIX API)
6. User pays PIX (off-chain)
7. LP confirms payment (frontend → backend)
8. LP sends DOT to user (backend → blockchain)
9. Order marked complete (backend → database)

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

- Escrow pattern
- State validation
- Access control
- Emergency pause functionality

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

## Development Workflow

### Local Development

1. Clone repository
2. Start Docker containers
3. Initialize database
4. Run tests
5. Develop features
6. Submit pull request

### CI/CD Pipeline (Future)

1. Code push
2. Automated tests
3. Build Docker images
4. Deploy to staging
5. Integration tests
6. Deploy to production

## Technology Decisions

### Why FastAPI?

- High performance (async)
- Automatic API documentation
- Type hints support
- Modern Python features
- Easy testing

### Why Next.js?

- Server-side rendering
- File-based routing
- API routes
- Image optimization
- Built-in TypeScript support

### Why PostgreSQL?

- ACID compliance
- Complex queries
- JSON support
- Reliability
- Mature ecosystem

### Why ink!?

- Rust-based (safety)
- Polkadot native
- WebAssembly compilation
- Small contract size
- Active development

