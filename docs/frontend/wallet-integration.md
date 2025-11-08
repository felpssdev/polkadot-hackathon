# Wallet Integration

Complete guide for Polkadot wallet integration.

## Overview

PolkaPay integrates with Polkadot wallet extensions for non-custodial authentication and transaction signing.

## Supported Wallets

| Wallet | Desktop | Mobile | Website |
|--------|---------|--------|---------|
| SubWallet | Yes | Yes | https://subwallet.app |
| Polkadot.js | Yes | No | https://polkadot.js.org/extension/ |
| Talisman | Yes | No | https://talisman.xyz |

## Installation

### Dependencies

```bash
cd frontend
pnpm install
```

Required packages:
- `@polkadot/extension-dapp` - Wallet connection
- `@polkadot/api` - Polkadot API
- `@polkadot/util` - Utilities
- `@polkadot/util-crypto` - Cryptography

### Wallet Extension

#### SubWallet (Recommended)

**Chrome/Brave/Edge**:
1. Visit https://subwallet.app/download.html
2. Click "Install for Chrome"
3. Add to browser

**Firefox**:
1. Visit https://subwallet.app/download.html
2. Click "Install for Firefox"
3. Follow instructions

**Mobile**:
- iOS: App Store
- Android: Google Play

## Setup

### Create Wallet Account

1. Open SubWallet extension
2. Click "Create a new account"
3. **Save seed phrase** (12-24 words)
   - Never share
   - Store securely
   - Required for recovery
4. Set password
5. Account created

### Import Existing Account

1. Open SubWallet
2. Click "Import an account"
3. Enter seed phrase
4. Set password
5. Account imported

## Usage

### Wallet Context

The `WalletProvider` wraps the application in `app/layout.tsx`:

```typescript
import { WalletProvider } from '@/contexts/WalletContext'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  )
}
```

### useWallet Hook

```typescript
import { useWallet } from '@/contexts/WalletContext'

function MyComponent() {
  const {
    isConnected,
    isConnecting,
    selectedAccount,
    accounts,
    connect,
    disconnect,
    selectAccount,
    sign,
    installedWallets,
    error
  } = useWallet()

  return (
    <div>
      {isConnected ? (
        <div>
          <p>Connected: {selectedAccount?.address}</p>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      ) : (
        <button onClick={connect} disabled={isConnecting}>
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
    </div>
  )
}
```

## Authentication Flow

### 1. Detect Wallets

```typescript
const { installedWallets } = useWallet()

installedWallets.map(wallet => (
  wallet.installed && (
    <div key={wallet.name}>
      {wallet.icon} {wallet.displayName}
    </div>
  )
))
```

### 2. Connect Wallet

```typescript
const { connect } = useWallet()

// User clicks connect button
await connect()
```

Process:
1. Call `web3Enable('PolkaPay')`
2. Request user permission (popup)
3. Get accounts with `web3Accounts()`
4. Save to state and localStorage

### 3. Select Account

If multiple accounts exist:

```typescript
const { accounts, selectAccount } = useWallet()

accounts.map(account => (
  <button onClick={() => selectAccount(account)}>
    {account.name} - {account.address}
  </button>
))
```

### 4. Sign Message

```typescript
const { sign, selectedAccount } = useWallet()

async function authenticateWithBackend() {
  const message = 'Login to PolkaPay'
  const signature = await sign(message)
  
  if (signature) {
    const response = await fetch('http://localhost:8000/api/v1/auth/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_address: selectedAccount.address,
        message,
        signature
      })
    })
    
    const data = await response.json()
    // Store JWT token
    localStorage.setItem('jwt_token', data.access_token)
  }
}
```

## Features

### Wallet Detection

Automatically detects installed wallets:

```typescript
const { installedWallets } = useWallet()

// Returns array of wallets with 'installed' flag
[
  { name: 'subwallet-js', displayName: 'SubWallet', icon: '🌊', installed: true },
  { name: 'polkadot-js', displayName: 'Polkadot.js', icon: '⚙️', installed: false },
  { name: 'talisman', displayName: 'Talisman', icon: '🔮', installed: false }
]
```

### Connection Persistence

State persisted in localStorage:

```typescript
// Automatically reconnects on page load
useEffect(() => {
  const savedAddress = localStorage.getItem('selectedWalletAddress')
  if (savedAddress) {
    reconnect(savedAddress)
  }
}, [])
```

### Multiple Accounts

Support for multiple accounts per wallet:

```typescript
const { accounts, selectedAccount, selectAccount } = useWallet()

// Switch account without disconnecting
selectAccount(accounts[1])
```

### Error Handling

```typescript
const { error } = useWallet()

{error && (
  <div className="error">
    <AlertCircle />
    <p>{error}</p>
  </div>
)}
```

Common errors:
- "No wallet extension found"
- "No accounts found"
- "User rejected request"
- "Failed to connect wallet"

## Security

### Non-Custodial

- App never accesses private keys
- Wallet extension maintains control
- Signatures done in extension
- User approves each action

### Signature Verification

Backend verifies signatures:

```python
from app.services.polkadot_service import polkadot_service

is_valid = polkadot_service.verify_signature(
    wallet_address="5GrwvaEF...",
    message="Login to PolkaPay",
    signature="0x..."
)
```

## Testing

### Local Testing

1. Start frontend:
```bash
cd frontend
pnpm run dev
```

2. Open http://localhost:3000/wallet

3. Test connection:
   - Click "Connect Wallet"
   - Authorize in popup
   - Select account
   - Verify connection

### Test Features

**Multiple Accounts**:
1. Create 2+ accounts in SubWallet
2. Connect to PolkaPay
3. Select different accounts
4. Verify switching works

**Persistence**:
1. Connect wallet
2. Refresh page (F5)
3. Verify still connected
4. Close and reopen browser
5. Verify still connected

**Disconnection**:
1. Connect wallet
2. Click disconnect
3. Verify redirected to /wallet
4. Verify state cleared

## Troubleshooting

### Wallet Not Detected

**Solution**:
- Install wallet extension
- Enable extension
- Refresh page
- Check browser console

### No Accounts Found

**Solution**:
- Create account in wallet
- Import existing account
- Refresh page
- Reconnect wallet

### User Rejected Request

**Normal behavior** - user cancelled in popup

**Solution**:
- Try again
- Click "Authorize" in popup

### Connection Failed

**Solutions**:
1. Reload page
2. Check extension is active
3. Verify console for errors
4. Try different browser
5. Reinstall extension

### Extension Not Detected in Firefox

**Solution**:
- Check Firefox extension settings
- Verify extension enabled
- Check permissions

## Advanced Usage

### Custom Message Signing

```typescript
const message = `
Welcome to PolkaPay!

Sign this message to login.

Nonce: ${Date.now()}
`

const signature = await sign(message)
```

### Account Formatting

```typescript
import { formatAddress } from '@/lib/polkadot'

// Shorten address
const short = formatAddress(address) // "5GrwvaE...HGKutQY"

// Full address
const full = address // "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
```

### Balance Checking

```typescript
import { ApiPromise, WsProvider } from '@polkadot/api'

async function getBalance(address: string) {
  const wsProvider = new WsProvider('wss://rococo-rpc.polkadot.io')
  const api = await ApiPromise.create({ provider: wsProvider })
  
  const { data: balance } = await api.query.system.account(address)
  return balance.free.toString()
}
```

## UI Components

### Wallet Status

```typescript
{isConnected && (
  <div className="wallet-status">
    <Wallet className="icon" />
    <span>{formatAddress(selectedAccount.address)}</span>
    <div className="indicator" />
  </div>
)}
```

### Connection Button

```typescript
<Button 
  onClick={connect} 
  disabled={isConnecting}
  variant="primary"
>
  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
</Button>
```

### Account Dropdown

```typescript
<DropdownMenu>
  <DropdownMenuTrigger>
    {formatAddress(selectedAccount.address)}
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={copyAddress}>
      Copy Address
    </DropdownMenuItem>
    <DropdownMenuItem onClick={disconnect}>
      Disconnect
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Future Improvements

- WalletConnect for mobile
- Ledger hardware wallet support
- Multi-signature wallets
- Balance display in header
- Transaction history
- Network switching
- Multiple network support

## Resources

- [Polkadot.js Extension Docs](https://polkadot.js.org/docs/extension/)
- [SubWallet Documentation](https://docs.subwallet.app/)
- [Talisman Documentation](https://docs.talisman.xyz/)
- [Polkadot Wiki](https://wiki.polkadot.network/)
- [Rococo Faucet](https://faucet.polkadot.io/)

