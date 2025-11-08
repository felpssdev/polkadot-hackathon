# Testing Guide

Complete testing documentation for PolkaPay.

## Smart Contract Tests

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

### Unit Tests

Run contract unit tests:

```bash
cd backend/contracts

# Run all tests
cargo test --features std

# Run with detailed output
cargo test --features std -- --nocapture

# Run specific test
cargo test --features std test_create_order_works
```

### Build Contract

```bash
cd backend/contracts

# Build release version
cargo contract build --release

# Verify artifacts
ls -la target/ink/
```

### Test Script

Use the provided test script:

```bash
cd backend/contracts
./test.sh
```

Output:
- Runs all unit tests
- Builds contract
- Verifies artifacts (wasm, metadata.json, contract bundle)

### Deploy to Rococo

```bash
cd backend/contracts
./deploy.sh //Alice
```

Or manually:

```bash
cargo contract instantiate \
  --constructor new \
  --args 200 \
  --suri //Alice \
  --url wss://rococo-contracts-rpc.polkadot.io \
  --execute
```

## Backend Tests

### Prerequisites

```bash
cd backend
pip install -r requirements.txt
```

### Run Tests

```bash
# Run all tests
pytest backend/tests/

# Run with verbose output
pytest backend/tests/ -v

# Run specific test file
pytest backend/tests/test_polkadot_service.py -v

# Run specific test
pytest backend/tests/test_polkadot_service.py::test_connect -v
```

### Test Coverage

```bash
# Run with coverage
pytest backend/tests/ --cov=app --cov-report=html

# View coverage report
open htmlcov/index.html
```

### Test Files

- `backend/tests/test_polkadot_service.py` - Polkadot service tests
  - Connection tests
  - Signature verification
  - Contract loading
  - Mock order operations
  - Gas estimation

## Makefile Commands

### Contract Tests

```bash
# Run contract tests
make test-contract

# Build contract
make build-contract
```

### API Tests

```bash
# Test API health
make test-api
```

## Testing Workflow

### 1. Test Contract

```bash
# Run contract tests
cd backend/contracts
./test.sh
```

Expected output:
```
Running unit tests...
test tests::test_new_works ... ok
test tests::test_create_order_works ... ok
...
Building contract...
Contract artifacts in backend/contracts/target/ink/
```

### 2. Test Backend

```bash
# Run backend tests
pytest backend/tests/ -v
```

Expected output:
```
test_polkadot_service.py::test_polkadot_service_initialization PASSED
test_polkadot_service.py::test_connect PASSED
...
```

### 3. Test API

Start services:

```bash
docker-compose up -d
make init-db
```

Test endpoints:

```bash
# Health check
curl http://localhost:8000/health

# Exchange rates
curl http://localhost:8000/api/v1/orders/rates/exchange

# Create order
curl -X POST http://localhost:8000/api/v1/orders/ \
  -H "Content-Type: application/json" \
  -d '{"order_type": "sell", "dot_amount": 1.0, "pix_key": "test@email.com"}'
```

## Continuous Integration

### GitHub Actions

The project includes a CI workflow for contract testing:

`.github/workflows/test-contract.yml`

Runs on:
- Push to any branch
- Pull requests

Steps:
1. Install Rust toolchain
2. Add wasm32 target
3. Install cargo-contract
4. Run contract tests
5. Build contract

## Troubleshooting

### Contract Tests

**Error**: `cargo: command not found`
**Solution**: Install Rust toolchain

**Error**: `cargo-contract: command not found`
**Solution**: Run `cargo install cargo-contract --force`

**Error**: Test fails with "missing features"
**Solution**: Use `cargo test --features std`

### Backend Tests

**Error**: `ModuleNotFoundError: No module named 'app'`
**Solution**: Run from project root or set PYTHONPATH

**Error**: `pytest: command not found`
**Solution**: Install pytest: `pip install pytest`

**Error**: Connection tests fail
**Solution**: Expected in CI without network access

### API Tests

**Error**: `Connection refused`
**Solution**: Ensure services are running with `docker-compose up -d`

**Error**: `404 Not Found`
**Solution**: Check API prefix `/api/v1/`

## Test Data

### Mock Addresses

- Alice: `5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY`
- Bob: `5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty`

### Test Orders

```json
{
  "order_type": "sell",
  "dot_amount": 1.0,
  "pix_key": "test@email.com"
}
```

```json
{
  "order_type": "buy",
  "dot_amount": 0.5
}
```

## Best Practices

1. **Run contract tests before committing**
   ```bash
   make test-contract
   ```

2. **Run backend tests before pushing**
   ```bash
   pytest backend/tests/ -v
   ```

3. **Test API after changes**
   ```bash
   make test-api
   ```

4. **Verify contract builds**
   ```bash
   make build-contract
   ```

5. **Check CI status before merging**
   - All tests must pass
   - Contract must build successfully

## Next Steps

After tests pass:
1. Deploy contract to Rococo
2. Update CONTRACT_ADDRESS in .env
3. Test real contract integration
4. Deploy to production

