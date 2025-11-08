# Smart Contracts

ink! smart contract documentation for PolkaPay escrow system.

## Overview

The PolkaPay smart contract manages DOT escrow for P2P orders. It ensures secure fund transfer between users and liquidity providers.

## Contract Functions

### create_order

Creates a new order and locks DOT in escrow.

**Parameters**:
- None (DOT sent with transaction)

**Returns**: Order ID

**Access**: Any user

**Description**: User sends DOT to contract, which locks it in escrow and creates an order record.

### accept_order

LP accepts an order.

**Parameters**:
- `order_id`: u32

**Returns**: Success/Error

**Access**: Any LP

**Description**: Assigns the order to the calling LP.

### confirm_payment_sent

User confirms PIX payment sent.

**Parameters**:
- `order_id`: u32

**Returns**: Success/Error

**Access**: Order creator

**Description**: Marks that user has sent PIX payment.

### complete_order

Completes order and releases funds.

**Parameters**:
- `order_id`: u32

**Returns**: Success/Error

**Access**: Contract owner or authorized

**Description**: Releases DOT to LP minus 2% fee to treasury.

### cancel_order

Cancels order and refunds user.

**Parameters**:
- `order_id`: u32

**Returns**: Success/Error

**Access**: Order creator or contract owner

**Description**: Refunds DOT to user if order not yet accepted.

### get_order

Gets order details.

**Parameters**:
- `order_id`: u32

**Returns**: Order struct

**Access**: Anyone

**Description**: Returns order information.

### get_balance

Gets contract balance.

**Parameters**: None

**Returns**: Balance

**Access**: Anyone

**Description**: Returns total DOT held in contract.

## Data Structures

### Order

```rust
pub struct Order {
    pub id: u32,
    pub creator: AccountId,
    pub lp: Option<AccountId>,
    pub amount: Balance,
    pub status: OrderStatus,
    pub created_at: Timestamp,
}
```

### OrderStatus

```rust
pub enum OrderStatus {
    Pending,
    Accepted,
    PaymentSent,
    Completed,
    Cancelled,
}
```

## Events

### OrderCreated

Emitted when order is created.

```rust
pub struct OrderCreated {
    pub order_id: u32,
    pub creator: AccountId,
    pub amount: Balance,
}
```

### OrderAccepted

Emitted when LP accepts order.

```rust
pub struct OrderAccepted {
    pub order_id: u32,
    pub lp: AccountId,
}
```

### OrderCompleted

Emitted when order is completed.

```rust
pub struct OrderCompleted {
    pub order_id: u32,
    pub lp_amount: Balance,
    pub fee_amount: Balance,
}
```

### OrderCancelled

Emitted when order is cancelled.

```rust
pub struct OrderCancelled {
    pub order_id: u32,
    pub refund_amount: Balance,
}
```

## Error Types

```rust
pub enum Error {
    OrderNotFound,
    OrderAlreadyAccepted,
    OrderNotAccepted,
    OrderNotPending,
    Unauthorized,
    InsufficientBalance,
    TransferFailed,
}
```

## Fee Structure

- **LP Fee**: 2% (200 basis points)
- **Treasury**: Receives fee
- **User**: Receives full amount (buy orders)
- **LP**: Receives amount minus fee (sell orders)

### Example

Sell order for 2 DOT:
- User locks: 2 DOT
- LP receives: 1.96 DOT (98%)
- Treasury receives: 0.04 DOT (2%)

## Compilation

### Prerequisites

- Rust 1.70+
- cargo-contract 4.0+
- ink! 5.1
- binaryen (wasm-opt)

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add WebAssembly target
rustup target add wasm32-unknown-unknown

# Install cargo-contract
cargo install cargo-contract --force --locked

# Install binaryen (Ubuntu/Debian)
sudo apt-get update && sudo apt-get install -y binaryen
```

### Build Contract

```bash
cd backend/contracts

# Build release version
cargo contract build --release

# Output: target/ink/polkapay_escrow.contract
```

### Build Artifacts

- `polkapay_escrow.contract` - Contract bundle
- `polkapay_escrow.wasm` - WebAssembly binary
- `metadata.json` - Contract metadata

## Deployment

### Rococo Testnet

```bash
# Deploy contract
cargo contract instantiate \
  --constructor new \
  --args 200 \
  --suri //Alice \
  --url wss://rococo-contracts-rpc.polkadot.io \
  --execute

# Note the contract address
```

### Local Node

```bash
# Start local contracts node
substrate-contracts-node --dev

# Deploy
cargo contract instantiate \
  --constructor new \
  --args 200 \
  --suri //Alice \
  --url ws://localhost:9944 \
  --execute
```

### Configuration

After deployment, update `.env`:

```bash
CONTRACT_ADDRESS=5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty
```

## Testing

### Unit Tests

The contract includes comprehensive unit tests covering all functions:

```bash
cd backend/contracts

# Run all tests
cargo test --features std

# Run with output
cargo test --features std -- --nocapture

# Run specific test
cargo test --features std test_create_order_works
```

**Test Coverage**:
- Constructor initialization
- Order creation (valid and invalid amounts)
- Order acceptance (by LP)
- Payment confirmation (by buyer)
- Order completion (fund transfers)
- Order cancellation (pending only)
- Authorization checks
- Status validation
- Fee calculations
- Multiple orders handling

### Run Test Script

```bash
cd backend/contracts
./test.sh
```

This script will:
1. Run all unit tests
2. Build the contract
3. Verify artifacts are generated

### Integration Tests

```bash
# Test with local node
cargo contract test
```

### Common Test Failures

**Issue**: `cargo test` fails with missing features
**Solution**: Always use `cargo test --features std`

**Issue**: Transfer tests fail
**Solution**: These are expected in unit tests as transfers require runtime

**Issue**: Contract not building
**Solution**: Ensure `cargo-contract` is installed and up to date

## Contract Interaction

### Via Backend

Backend uses `py-substrate-interface`:

```python
from substrateinterface import SubstrateInterface, Keypair

# Connect to node
substrate = SubstrateInterface(url="wss://rococo-rpc.polkadot.io")

# Load keypair
keypair = Keypair.create_from_uri('//Alice')

# Call contract
call = substrate.compose_call(
    call_module='Contracts',
    call_function='call',
    call_params={
        'dest': contract_address,
        'value': amount,
        'gas_limit': gas_limit,
        'storage_deposit_limit': None,
        'data': method_data
    }
)
```

### Via Polkadot.js

```javascript
import { ApiPromise, WsProvider } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';

// Connect
const wsProvider = new WsProvider('wss://rococo-rpc.polkadot.io');
const api = await ApiPromise.create({ provider: wsProvider });

// Load contract
const contract = new ContractPromise(api, metadata, contractAddress);

// Call method
const { gasRequired, result, output } = await contract.query.getOrder(
  caller.address,
  { gasLimit: -1 },
  orderId
);
```

## Security Considerations

### Access Control

- Only order creator can cancel pending orders
- Only contract owner can complete orders
- Only authorized addresses can call sensitive functions

### Reentrancy Protection

- State changes before external calls
- Checks-effects-interactions pattern

### Balance Checks

- Verify sufficient balance before transfers
- Handle transfer failures gracefully

### Order Validation

- Validate order exists
- Check order status
- Verify caller permissions

## Gas Optimization

- Minimize storage operations
- Use efficient data structures
- Batch operations when possible
- Optimize event emissions

## Upgrade Strategy

### Current

Contract is not upgradeable. New version requires:
1. Deploy new contract
2. Migrate data
3. Update backend configuration

### Future

Consider:
- Proxy pattern for upgrades
- Data migration tools
- Backward compatibility

## Monitoring

### Events

Monitor blockchain events:
- OrderCreated
- OrderAccepted
- OrderCompleted
- OrderCancelled

### Metrics

Track:
- Total orders created
- Active orders
- Completed orders
- Total volume
- Fee collected

## Troubleshooting

### Compilation Errors

```bash
# Clean build
cargo clean

# Update dependencies
cargo update

# Rebuild
cargo contract build --release
```

### Deployment Failures

Check:
- Sufficient balance for deployment
- Correct network URL
- Valid constructor arguments
- Gas limit sufficient

### Call Failures

Verify:
- Contract deployed
- Correct contract address
- Sufficient gas
- Valid parameters
- Caller has permissions

## Future Improvements

- Multi-signature support
- Time-locked escrow
- Dispute resolution on-chain
- Automated refunds
- Cross-chain support
- Governance integration

## Resources

- [ink! Documentation](https://use.ink/)
- [Substrate Contracts](https://docs.substrate.io/tutorials/smart-contracts/)
- [Polkadot.js API](https://polkadot.js.org/docs/)
- [Rococo Faucet](https://faucet.polkadot.io/)
- [Contracts UI](https://contracts-ui.substrate.io/)

