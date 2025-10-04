# PolkaPay Smart Contract

Smart contract em ink! para escrow de DOT em ordens P2P.

## Funcionalidades

- ✅ Criar ordem com DOT em escrow
- ✅ LP aceita ordem
- ✅ Confirmação de pagamento PIX
- ✅ Liberação de fundos após confirmação
- ✅ Cancelamento de ordem (apenas se não aceita)
- ✅ Taxa de 2% para LP

## Compilar

```bash
cargo contract build --release
```

## Deploy (Rococo Testnet)

```bash
cargo contract instantiate \
  --constructor new \
  --args 200 \
  --suri //Alice \
  --url wss://rococo-contracts-rpc.polkadot.io
```

## Testar

```bash
cargo test
```

## Estrutura

- `create_order()`: Usuário cria ordem e bloqueia DOT
- `accept_order()`: LP aceita ordem
- `confirm_payment_sent()`: Usuário confirma envio do PIX
- `complete_order()`: Libera fundos para LP após confirmação
- `cancel_order()`: Cancela ordem e reembolsa

## Taxa

- 2% (200 basis points) cobrado de cada ordem
- Taxa vai para o owner do contrato (treasury)

