# Deployment Guide

Complete guide for deploying PolkaPay to Rococo testnet.

## Prerequisites

### Required Tools

**Rust and Cargo**:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup default stable
rustup update
rustup component add rust-src
rustup target add wasm32-unknown-unknown
```

**cargo-contract**:
```bash
cargo install cargo-contract --force --locked
```

**binaryen** (for wasm optimization):
```bash
# Ubuntu/Debian
sudo apt install binaryen

# macOS
brew install binaryen

# Or download from https://github.com/WebAssembly/binaryen/releases
```

**Node.js and pnpm**:
```bash
# Install Node.js 18+ from https://nodejs.org/
npm install -g pnpm
```

**Python 3.11+**:
```bash
# Ubuntu/Debian
sudo apt install python3.11 python3.11-venv

# macOS
brew install python@3.11
```

### Verify Installation

```bash
# Check Rust
rustc --version
cargo --version

# Check cargo-contract
cargo contract --version
# Should show: cargo-contract-contract 4.0.0 or higher

# Check binaryen
wasm-opt --version

# Check Node.js and pnpm
node --version
pnpm --version

# Check Python
python3 --version
```

## Step 1: Obtain ROC Tokens

### Create Substrate Account

1. **Install Wallet Extension**:
   - SubWallet: https://subwallet.app/
   - Polkadot.js Extension: https://polkadot.js.org/extension/
   - Talisman: https://talisman.xyz/

2. **Create New Account**:
   - Open wallet extension
   - Click "Create New Account"
   - Save your seed phrase securely (12 or 24 words)
   - Set a strong password
   - Copy your Substrate address (starts with `5...`)

### Get ROC Tokens from Faucet

1. **Access Faucet**:
   - Go to https://faucet.polkadot.io/rococo
   
2. **Request Tokens**:
   - Paste your Substrate address
   - Complete CAPTCHA
   - Click "Submit"
   - Wait 1-2 minutes for confirmation

3. **Verify Balance**:
   - Open https://polkadot.js.org/apps/?rpc=wss://rococo-rpc.polkadot.io
   - Go to Accounts
   - Find your address
   - Should show ~100 ROC

**Minimum Required**: 50 ROC (for deployment + initial operations)

## Step 2: Build Smart Contract

### Navigate to Contract Directory

```bash
cd backend/contracts
```

### Clean Previous Builds

```bash
cargo clean
rm -rf target/
```

### Build Contract

```bash
cargo contract build --release
```

**Expected Output**:
```
 [1/5] Building cargo project
 [2/5] Post processing wasm file
 [3/5] Optimizing wasm file
 [4/5] Generating metadata
 [5/5] Generating bundle

Original wasm size: 45.2K, Optimized: 11.0K

Your contract artifacts are ready:
  - target/ink/polkapay_escrow.contract (bundle)
  - target/ink/polkapay_escrow.wasm (bytecode)
  - target/ink/polkapay_escrow.json (metadata)
```

### Run Tests (Optional but Recommended)

```bash
cargo test
```

All 34 tests should pass.

## Step 3: Deploy to Rococo

### Set Environment Variable

```bash
export SIGNER_SEED="your twelve word seed phrase goes here like this example"
```

**Security Note**: Never commit your seed phrase to git!

### Upload Contract Code

```bash
cargo contract upload \
  --suri "$SIGNER_SEED" \
  --url wss://rococo-contracts-rpc.polkadot.io \
  --execute
```

**Expected Output**:
```
 Code hash: 0x1234567890abcdef...
   Deposit: 0.5 ROC
 Gas required: 1,234,567,890
```

**Save the Code Hash!**

### Instantiate Contract

```bash
cargo contract instantiate \
  --suri "$SIGNER_SEED" \
  --url wss://rococo-contracts-rpc.polkadot.io \
  --constructor new \
  --args 300 \
  --execute
```

**Constructor Arguments**:
- `300` = LP fee in basis points (3%)

**Expected Output**:
```
  Contract: 5GxxYyyy... (THIS IS YOUR CONTRACT ADDRESS - SAVE IT!)
   Deposit: 0.1 ROC
 Gas required: 2,345,678,901
```

**Save the Contract Address!**

### Alternative: Use Deploy Script

```bash
# Make script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

## Step 4: Verify Deployment

### Using Polkadot.js Apps

1. **Open Contracts UI**:
   - Go to https://polkadot.js.org/apps/?rpc=wss://rococo-contracts-rpc.polkadot.io
   - Navigate to Developer → Contracts

2. **Add Existing Contract**:
   - Click "Add an existing contract"
   - Paste your contract address
   - Upload `target/ink/polkapay_escrow.json` metadata file
   - Click "Save"

3. **Test Read Function**:
   - Select your contract
   - Call `is_paused()` (should return `false`)
   - Call `get_lp_fee()` (should return `300`)
   - Call `get_order(1)` (should return `OrderNotFound` error - this is expected)

4. **Verify Owner**:
   - Call `owner()` 
   - Should return your Substrate address

### Using Substrate Contracts Node (Local Testing)

If you want to test locally first:

```bash
# Install substrate-contracts-node
cargo install contracts-node --git https://github.com/paritytech/substrate-contracts-node.git

# Run local node
substrate-contracts-node --dev

# Deploy to local node (use ws://127.0.0.1:9944 instead of Rococo URL)
```

## Step 5: Configure Backend

### Update Environment Variables

Edit `backend/.env`:

```bash
# Polkadot Configuration
POLKADOT_NODE_URL=wss://rococo-contracts-rpc.polkadot.io
CONTRACT_ADDRESS=5GxxYyyy...  # YOUR CONTRACT ADDRESS FROM STEP 3
CONTRACT_METADATA_PATH=./contracts/target/ink/polkapay_escrow.json
SIGNER_SEED=your twelve word seed phrase  # SAME AS DEPLOYMENT

# Contract Settings
DEFAULT_LP_FEE=300  # 3%

# Database (keep existing)
DATABASE_URL=postgresql://user:password@localhost:5432/polkapay

# Redis (keep existing)
REDIS_URL=redis://localhost:6379

# JWT (keep existing)
SECRET_KEY=your-secret-key-here
```

### Update env.example

```bash
cp backend/.env backend/env.example
# Remove sensitive values from env.example
sed -i 's/SIGNER_SEED=.*/SIGNER_SEED=your_seed_phrase_here/' backend/env.example
sed -i 's/CONTRACT_ADDRESS=.*/CONTRACT_ADDRESS=5Gxx.../' backend/env.example
```

### Test Backend Connection

```bash
cd backend
source venv/bin/activate
python -c "
from app.services.polkadot_service import polkadot_service
polkadot_service.connect()
print('✅ Connected to Rococo!')
print(f'Contract address: {polkadot_service.contract_address}')
"
```

**Expected Output**:
```
✅ Connected to Rococo!
Contract address: 5GxxYyyy...
```

## Step 6: Run Database Migrations

```bash
cd backend

# Create migration for blockchain fields
alembic revision --autogenerate -m "add blockchain fields to orders"

# Review the migration file in alembic/versions/

# Apply migration
alembic upgrade head
```

## Step 7: Start Services

### Using Docker Compose

```bash
# From project root
docker-compose up -d
```

### Manual Start

**Backend**:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend**:
```bash
cd frontend
pnpm install
pnpm dev
```

## Step 8: Test End-to-End

### Create Test Order

```bash
curl -X POST http://localhost:8000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "order_type": "Sell",
    "dot_amount": 1.0,
    "pix_key": "test@email.com"
  }'
```

**Expected Response**:
```json
{
  "id": 1,
  "blockchain_order_id": 1,
  "blockchain_tx_hash": "0x...",
  "status": "pending",
  ...
}
```

### Verify on Blockchain

1. Go to Polkadot.js Apps → Contracts
2. Select your contract
3. Call `get_order(1)`
4. Should return order details

## Troubleshooting

### Deployment Fails with "Insufficient Balance"

**Solution**: Get more ROC tokens from faucet or use a different account.

### "Code hash already exists"

**Solution**: Contract code is already uploaded. Skip to instantiate step.

### "Contract execution failed"

**Possible Causes**:
1. **Insufficient gas**: Increase gas limit
2. **Wrong constructor args**: Verify `300` for LP fee
3. **Network issues**: Check Rococo RPC is accessible

### Backend Can't Connect to Contract

**Check**:
1. `CONTRACT_ADDRESS` is correct in `.env`
2. `CONTRACT_METADATA_PATH` points to correct file
3. Rococo RPC URL is accessible: `wss://rococo-contracts-rpc.polkadot.io`
4. Seed phrase is correct (test by importing to wallet)

### Transaction Fails with "Module Error"

**Solution**: Check contract events in Polkadot.js Apps for specific error message.

### "Metadata version mismatch"

**Solution**: Rebuild contract and re-upload metadata file.

## Rollback Procedure

If deployment fails and you need to start over:

1. **Keep the same contract code** (don't re-upload if code hash exists)
2. **Instantiate new contract** with different constructor args if needed
3. **Update backend `.env`** with new contract address
4. **Restart backend services**

## Production Deployment (Future)

For mainnet deployment:

1. **Use Polkadot mainnet** instead of Rococo
2. **Fund account with real DOT** (not testnet tokens)
3. **Audit smart contract** before deployment
4. **Use hardware wallet** for deployment account
5. **Set up monitoring** for contract events
6. **Implement upgrade strategy** (proxy pattern)

## Security Checklist

Before deploying to production:

- [ ] Smart contract audited by professional firm
- [ ] All tests passing (unit + integration)
- [ ] Seed phrase stored securely (hardware wallet or HSM)
- [ ] Environment variables not committed to git
- [ ] Rate limiting configured on backend
- [ ] Database backups automated
- [ ] Monitoring and alerting set up
- [ ] Incident response plan documented
- [ ] Insurance or bug bounty program considered

## Resources

- [Rococo Faucet](https://faucet.polkadot.io/rococo)
- [Polkadot.js Apps](https://polkadot.js.org/apps/)
- [ink! Documentation](https://use.ink/)
- [cargo-contract Documentation](https://github.com/paritytech/cargo-contract)
- [Substrate Contracts](https://docs.substrate.io/tutorials/smart-contracts/)

