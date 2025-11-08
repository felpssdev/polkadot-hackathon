#!/bin/bash
set -e

# Deploy script for Rococo testnet
# Usage: ./deploy.sh [signer_seed]
# Example: ./deploy.sh "//Alice"

SIGNER_SEED=${1:-"//Alice"}
NODE_URL="wss://rococo-contracts-rpc.polkadot.io"
LP_FEE_BPS=200  # 2% fee

echo "================================"
echo "Deploying to Rococo Testnet"
echo "================================"
echo ""
echo "Node URL: $NODE_URL"
echo "Signer: $SIGNER_SEED"
echo "LP Fee: $LP_FEE_BPS basis points (2%)"
echo ""

# Check if contract is built
if [ ! -f "target/ink/polkapay_escrow.contract" ]; then
    echo "Error: Contract not built. Run 'cargo contract build --release' first."
    exit 1
fi

echo "Deploying contract..."
echo ""

cargo contract instantiate \
  --constructor new \
  --args $LP_FEE_BPS \
  --suri "$SIGNER_SEED" \
  --url "$NODE_URL" \
  --execute

echo ""
echo "================================"
echo "Deployment Complete!"
echo "================================"
echo ""
echo "IMPORTANT: Save the contract address to your .env file:"
echo "CONTRACT_ADDRESS=<your_contract_address>"
echo ""
echo "You can verify the deployment at:"
echo "https://polkadot.js.org/apps/?rpc=$NODE_URL#/contracts"

