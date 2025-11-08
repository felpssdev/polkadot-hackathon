# Use Cases

Complete use case documentation with Mermaid diagrams.

## User Authentication Flow

User connects wallet and authenticates with the platform.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Wallet
    participant Backend
    participant Database

    User->>Frontend: Click "Connect Wallet"
    Frontend->>Wallet: Request accounts
    Wallet->>User: Show authorization popup
    User->>Wallet: Approve connection
    Wallet-->>Frontend: Return accounts
    Frontend->>User: Select account
    User->>Frontend: Choose account
    
    Frontend->>Wallet: Request signature
    Note over Wallet: Sign message with private key
    Wallet-->>Frontend: Return signature
    
    Frontend->>Backend: POST /auth/wallet (address, message, signature)
    Backend->>Backend: Verify signature
    Backend->>Database: Get or create user
    Database-->>Backend: User data
    Backend->>Backend: Generate JWT token
    Backend-->>Frontend: Return JWT token
    Frontend->>Frontend: Store token
    Frontend-->>User: Show authenticated state
```

## Sell Order Flow (DOT → PIX)

User sells DOT and receives PIX payment.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant SmartContract
    participant Database
    participant LP

    User->>Frontend: Create sell order (2 DOT, PIX key)
    Frontend->>Backend: POST /orders (sell, 2.0, pix_key)
    Backend->>Backend: Validate user limits
    Backend->>Backend: Calculate amounts & fees
    Backend->>SmartContract: create_order(2 DOT)
    Note over SmartContract: Lock 2 DOT in escrow
    SmartContract-->>Backend: order_id
    Backend->>Database: Save order (pending)
    Database-->>Backend: Order created
    Backend-->>Frontend: Order details
    Frontend-->>User: Order created successfully

    LP->>Frontend: View available orders
    Frontend->>Backend: GET /lp/available-orders
    Backend->>Database: Query pending orders
    Database-->>Backend: Order list
    Backend-->>Frontend: Available orders
    Frontend-->>LP: Show order (2 DOT for R$ 75)

    LP->>Frontend: Accept order
    Frontend->>Backend: POST /orders/{id}/accept
    Backend->>SmartContract: accept_order(order_id)
    SmartContract-->>Backend: Success
    Backend->>Database: Update order (accepted, LP assigned)
    Database-->>Backend: Updated
    Backend-->>Frontend: Order accepted
    Frontend-->>LP: Show PIX key

    LP->>LP: Send PIX payment (off-chain)
    Note over LP: Transfer R$ 75 via bank app

    LP->>User: PIX payment sent
    User->>User: Verify PIX received
    User->>Frontend: Confirm payment
    Frontend->>Backend: POST /orders/{id}/confirm-payment
    Backend->>Database: Update order (payment_sent)
    Database-->>Backend: Updated
    Backend-->>Frontend: Payment confirmed

    Backend->>SmartContract: complete_order(order_id)
    Note over SmartContract: Release 1.96 DOT to LP<br/>0.04 DOT to treasury
    SmartContract-->>Backend: Success
    Backend->>Database: Update order (completed)
    Backend->>Database: Update LP earnings
    Database-->>Backend: Updated
    Backend-->>Frontend: Order completed
    Frontend-->>User: Order completed
    Frontend-->>LP: Received 1.96 DOT
```

## Buy Order Flow (PIX → DOT)

User buys DOT by paying with PIX.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database
    participant PIXService
    participant LP
    participant SmartContract

    User->>Frontend: Create buy order (1 DOT)
    Frontend->>Backend: POST /orders (buy, 1.0)
    Backend->>Backend: Validate user limits
    Backend->>Backend: Calculate amounts & fees
    Backend->>Database: Save order (pending)
    Database-->>Backend: Order created
    Backend-->>Frontend: Order details
    Frontend-->>User: Order created

    LP->>Frontend: View available orders
    Frontend->>Backend: GET /lp/available-orders
    Backend->>Database: Query pending orders
    Database-->>Backend: Order list
    Backend-->>Frontend: Available orders
    Frontend-->>LP: Show order (1 DOT for R$ 37.50)

    LP->>Frontend: Accept order
    Frontend->>Backend: POST /orders/{id}/accept
    Backend->>Database: Update order (accepted, LP assigned)
    Backend->>PIXService: Generate QR code (R$ 37.50, LP PIX key)
    PIXService-->>Backend: QR code data
    Backend->>Database: Save QR code
    Database-->>Backend: Updated
    Backend-->>Frontend: Order accepted with QR code
    Frontend-->>User: Show PIX QR code

    User->>User: Scan QR code
    User->>User: Pay via bank app
    Note over User: Transfer R$ 37.50

    User->>Frontend: Mark as paid
    Frontend->>Backend: POST /orders/{id}/confirm-payment
    Backend->>Database: Update order (payment_sent)
    Database-->>Backend: Updated
    Backend-->>Frontend: Waiting for LP confirmation

    LP->>LP: Verify PIX received
    LP->>Frontend: Confirm payment
    Frontend->>Backend: POST /orders/{id}/complete
    Backend->>SmartContract: Transfer 1 DOT to user
    SmartContract-->>Backend: Success
    Backend->>Database: Update order (completed)
    Backend->>Database: Update LP earnings (2% fee)
    Database-->>Backend: Updated
    Backend-->>Frontend: Order completed
    Frontend-->>User: Received 1 DOT
    Frontend-->>LP: Order completed, earned 2% fee
```

## Order State Machine

Order lifecycle and state transitions.

```mermaid
stateDiagram-v2
    [*] --> Pending: Create order
    
    Pending --> Accepted: LP accepts
    Pending --> Cancelled: User/System cancels
    
    Accepted --> PaymentSent: Payment confirmed
    Accepted --> Cancelled: Timeout/Cancel
    
    PaymentSent --> Completed: Verification successful
    PaymentSent --> Disputed: Issue reported
    
    Disputed --> Completed: Resolved in favor
    Disputed --> Cancelled: Resolved against
    
    Completed --> [*]
    Cancelled --> [*]
    
    note right of Pending
        Order created
        DOT locked (sell)
        Waiting for LP
    end note
    
    note right of Accepted
        LP assigned
        PIX details shared
        Waiting for payment
    end note
    
    note right of PaymentSent
        Payment confirmed
        Waiting for verification
    end note
    
    note right of Completed
        DOT transferred
        Fee distributed
        Order closed
    end note
    
    note right of Disputed
        Issue raised
        Admin review
        Resolution pending
    end note
```

## System Architecture Diagram

High-level system components and interactions.

```mermaid
graph TB
    subgraph Frontend
        UI[Next.js UI]
        Wallet[Wallet Integration]
    end
    
    subgraph Backend
        API[FastAPI]
        Auth[Auth Service]
        Orders[Order Service]
        PIX[PIX Service]
        Polkadot[Polkadot Service]
    end
    
    subgraph Storage
        DB[(PostgreSQL)]
        Cache[(Redis)]
    end
    
    subgraph Blockchain
        Node[Polkadot Node]
        Contract[Smart Contract]
    end
    
    UI --> API
    Wallet --> Node
    
    API --> Auth
    API --> Orders
    API --> PIX
    API --> Polkadot
    
    Auth --> DB
    Orders --> DB
    Orders --> Cache
    
    Polkadot --> Contract
    Contract --> Node
    
    PIX -.-> ExternalPIX[PIX API<br/>Mock]
```

## Data Model

Entity relationship diagram.

```mermaid
erDiagram
    User ||--o{ Order : creates
    User ||--o| LiquidityProvider : becomes
    LiquidityProvider ||--o{ Order : accepts
    Order ||--o{ Transaction : generates
    
    User {
        int id PK
        string wallet_address UK
        decimal buy_limit_usd
        int buy_orders_per_day
        decimal sell_limit_usd
        int sell_orders_per_day
        int total_orders
        int successful_orders
        float rating
        boolean is_verified
        timestamp created_at
    }
    
    LiquidityProvider {
        int id PK
        int user_id FK
        string pix_key UK
        string pix_key_type
        int total_orders_processed
        decimal total_volume_usd
        decimal total_earnings_usd
        float rating
        boolean is_active
        boolean is_available
        timestamp created_at
    }
    
    Order {
        int id PK
        string order_type
        string status
        decimal dot_amount
        decimal brl_amount
        decimal usd_amount
        decimal exchange_rate_dot_brl
        decimal lp_fee_amount
        int user_id FK
        int lp_id FK
        string pix_key
        string pix_qr_code
        string pix_txid
        int contract_order_id
        timestamp created_at
        timestamp expires_at
        timestamp completed_at
    }
    
    Transaction {
        int id PK
        int order_id FK
        string transaction_type
        decimal amount
        string currency
        string blockchain_tx_hash
        string status
        timestamp created_at
    }
```

## LP Registration Flow

Liquidity Provider registration process.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database

    User->>Frontend: Click "Become LP"
    Frontend->>User: Show registration form
    User->>Frontend: Enter PIX key & type
    Frontend->>Backend: POST /lp/register (pix_key, type)
    Backend->>Backend: Validate PIX key format
    Backend->>Database: Check if already LP
    Database-->>Backend: Not found
    Backend->>Database: Create LP profile
    Database-->>Backend: LP created
    Backend-->>Frontend: LP profile
    Frontend-->>User: Registration successful
    Frontend->>Frontend: Enable LP features
```

## Order Cancellation Flow

Cancel order before completion.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant SmartContract
    participant Database
    participant LP

    User->>Frontend: Cancel order
    Frontend->>Backend: POST /orders/{id}/cancel
    Backend->>Database: Get order details
    Database-->>Backend: Order (status: pending/accepted)
    
    alt Order is pending (no LP)
        Backend->>SmartContract: cancel_order(order_id)
        Note over SmartContract: Refund DOT to user
        SmartContract-->>Backend: Success
        Backend->>Database: Update order (cancelled)
        Database-->>Backend: Updated
        Backend-->>Frontend: Order cancelled
        Frontend-->>User: Refund processed
    else Order is accepted (LP assigned)
        Backend->>Backend: Check cancellation policy
        Backend->>Database: Update order (cancelled)
        Backend->>SmartContract: cancel_order(order_id)
        SmartContract-->>Backend: Success
        Backend-->>Frontend: Order cancelled
        Frontend-->>User: Order cancelled
        Backend-->>LP: Notify cancellation
    end
```

## Exchange Rate Update Flow

Fetch and update DOT exchange rates.

```mermaid
sequenceDiagram
    participant Frontend
    participant Backend
    participant Cache
    participant CoinGecko
    participant Database

    Frontend->>Backend: GET /orders/rates/exchange
    Backend->>Cache: Check cached rates
    
    alt Cache hit
        Cache-->>Backend: Rates (fresh)
        Backend-->>Frontend: Return rates
    else Cache miss or expired
        Backend->>CoinGecko: GET /simple/price (DOT)
        CoinGecko-->>Backend: DOT price in USD
        Backend->>Backend: Calculate DOT to BRL
        Backend->>Cache: Store rates (TTL: 60s)
        Backend->>Database: Log exchange rate
        Backend-->>Frontend: Return rates
    end
```

## Limit System Flow

User limit validation and updates.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database

    User->>Frontend: Create order
    Frontend->>Backend: POST /orders
    Backend->>Database: Get user profile
    Database-->>Backend: User limits & history
    
    Backend->>Backend: Check daily order count
    Backend->>Backend: Check order amount vs limit
    
    alt Within limits
        Backend->>Backend: Process order
        Backend->>Database: Create order
        Backend->>Database: Update user stats
        Database-->>Backend: Success
        Backend-->>Frontend: Order created
    else Exceeds limits
        Backend-->>Frontend: Error: Limit exceeded
        Frontend-->>User: Show limit details
        Frontend-->>User: Suggest verification
    end
```

## Dispute Resolution Flow (Future)

Handle payment disputes.

```mermaid
sequenceDiagram
    participant User
    participant LP
    participant Frontend
    participant Backend
    participant Admin
    participant SmartContract

    User->>Frontend: Report issue
    Frontend->>Backend: POST /orders/{id}/dispute
    Backend->>Database: Update order (disputed)
    Backend-->>Frontend: Dispute created
    Backend-->>Admin: Notify dispute
    Backend-->>LP: Notify dispute

    Admin->>Frontend: Review dispute
    Frontend->>Backend: GET /orders/{id}/dispute
    Backend-->>Frontend: Dispute details
    
    Admin->>Admin: Investigate evidence
    Admin->>Frontend: Make decision
    Frontend->>Backend: POST /orders/{id}/resolve
    
    alt Resolve in favor of user
        Backend->>SmartContract: refund_to_user(order_id)
        SmartContract-->>Backend: Success
        Backend->>Database: Update order (cancelled)
        Backend-->>User: Refund processed
        Backend-->>LP: Dispute resolved
    else Resolve in favor of LP
        Backend->>SmartContract: release_to_lp(order_id)
        SmartContract-->>Backend: Success
        Backend->>Database: Update order (completed)
        Backend-->>LP: Payment released
        Backend-->>User: Dispute resolved
    end
```

## Use Case Summary

### User Actions
- Connect wallet
- Create sell order
- Create buy order
- Confirm payment received
- Cancel order
- View order history

### LP Actions
- Register as LP
- View available orders
- Accept order
- Send PIX payment
- Confirm payment received
- Update availability
- View earnings

### System Actions
- Validate user limits
- Calculate fees
- Generate PIX QR codes
- Update exchange rates
- Process order completion
- Distribute fees
- Handle disputes

### Smart Contract Actions
- Lock DOT in escrow
- Accept order
- Release DOT to LP
- Cancel and refund
- Distribute fees

