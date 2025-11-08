#!/bin/bash
set -e

echo "================================"
echo "Running Smart Contract Tests"
echo "================================"
echo ""

echo "1. Running unit tests..."
cargo test --features std

echo ""
echo "2. Building contract..."
cargo contract build --release

echo ""
echo "3. Checking contract artifacts..."
if [ -f "target/ink/polkapay_escrow.wasm" ]; then
    echo "✓ WASM file generated"
    ls -lh target/ink/polkapay_escrow.wasm
else
    echo "✗ WASM file not found"
    exit 1
fi

if [ -f "target/ink/metadata.json" ]; then
    echo "✓ Metadata file generated"
    ls -lh target/ink/metadata.json
else
    echo "✗ Metadata file not found"
    exit 1
fi

if [ -f "target/ink/polkapay_escrow.contract" ]; then
    echo "✓ Contract bundle generated"
    ls -lh target/ink/polkapay_escrow.contract
else
    echo "✗ Contract bundle not found"
    exit 1
fi

echo ""
echo "================================"
echo "All tests passed successfully!"
echo "================================"

