# Wallet Integration Guide

Complete guide for Polkadot wallet integration in PolkaPay frontend.

## Overview

PolkaPay uses Polkadot.js Extension for non-custodial wallet authentication. Users maintain full control of their private keys.

**Supported Wallets**:
- SubWallet
- Polkadot.js Extension
- Talisman

## Architecture

```
┌─────────────────┐
│   User Browser  │
│                 │
│  ┌───────────┐  │
│  │  PolkaPay │  │
│  │  Frontend │  │
│  └─────┬─────┘  │
│        │        │
│  ┌─────▼─────┐  │
│  │  Wallet   │  │
│  │ Extension │  │
│  └───────────┘  │
└─────────────────┘
```

**Communication Flow**:
1. Frontend requests wallet connection
2. Extension shows authorization popup
3. User approves/rejects
4. Extension returns accounts
5. Frontend stores selected account
6. User signs messages/transactions

## Implementation

### WalletContext

**File**: `frontend/src/contexts/WalletContext.tsx`

The `WalletContext` provides wallet state and actions throughout the app.

**State**:
```typescript
interface WalletContextType {
  // State
  isConnected: boolean
  isConnecting: boolean
  accounts: InjectedAccountWithMeta[]
  selectedAccount: InjectedAccountWithMeta | null
  installedWallets: WalletExtension[]
  error: string | null

  // Actions
  connect: () => Promise<boolean>
  disconnect: () => void
  selectAccount: (account: InjectedAccountWithMeta) => void
  sign: (message: string) => Promise<string | null>

  // Utils
  getFormattedAddress: (length?: number) => string
}
```

**Usage**:
```typescript
import { useWallet } from '@/contexts/WalletContext'

function MyComponent() {
  const { isConnected, selectedAccount, connect } = useWallet()

  return (
    <div>
      {isConnected ? (
        <p>Connected: {selectedAccount?.address}</p>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  )
}
```

### Polkadot Utilities

**File**: `frontend/src/lib/polkadot.ts`

Utility functions for wallet interactions.

#### Initialize Extension

```typescript
import { web3Enable } from '@polkadot/extension-dapp'

export async function initializePolkadot(appName: string = 'PolkaPay'): Promise<boolean> {
  if (typeof window === 'undefined') return false

  try {
    const extensions = await web3Enable(appName)
    return extensions.length > 0
  } catch (error) {
    console.error('Error initializing Polkadot extension:', error)
    return false
  }
}
```

#### Get Accounts

```typescript
import { web3Accounts } from '@polkadot/extension-dapp'

export async function getAccounts(): Promise<InjectedAccountWithMeta[]> {
  if (typeof window === 'undefined') return []

  try {
    const accounts = await web3Accounts()
    return accounts
  } catch (error) {
    console.error('Error getting accounts:', error)
    return []
  }
}
```

#### Sign Message

```typescript
import { web3FromAddress } from '@polkadot/extension-dapp'

export async function signMessage(
  address: string,
  message: string
): Promise<string | null> {
  if (typeof window === 'undefined') return null

  try {
    const injector = await web3FromAddress(address)

    if (!injector.signer.signRaw) {
      throw new Error('Signer does not support signRaw')
    }

    const { signature } = await injector.signer.signRaw({
      address,
      data: message,
      type: 'bytes',
    })

    return signature
  } catch (error) {
    console.error('Error signing message:', error)
    return null
  }
}
```

## Connection Flow

### 1. Check Installed Wallets

```typescript
const checkWallets = async () => {
  const wallets = await checkInstalledWallets()
  setInstalledWallets(wallets)
}
```

**Result**:
```typescript
[
  { name: 'subwallet-js', displayName: 'SubWallet', installed: true },
  { name: 'polkadot-js', displayName: 'Polkadot.js', installed: false },
  { name: 'talisman', displayName: 'Talisman', installed: false }
]
```

### 2. Request Connection

```typescript
const connect = async (): Promise<boolean> => {
  setIsConnecting(true)
  setError(null)

  try {
    // Initialize extension
    const initialized = await initializePolkadot('PolkaPay')

    if (!initialized) {
      setError('No Polkadot wallet extension found')
      return false
    }

    // Get accounts
    const allAccounts = await getAccounts()

    if (allAccounts.length === 0) {
      setError('No accounts found in wallet')
      return false
    }

    setAccounts(allAccounts)
    setSelectedAccount(allAccounts[0])
    setIsConnected(true)

    // Persist connection
    localStorage.setItem('walletConnected', 'true')
    localStorage.setItem('selectedWalletAddress', allAccounts[0].address)

    return true
  } catch (err) {
    setError('Failed to connect wallet')
    return false
  } finally {
    setIsConnecting(false)
  }
}
```

### 3. Auto-Reconnect on Page Load

```typescript
useEffect(() => {
  const loadSavedConnection = async () => {
    const walletConnected = localStorage.getItem('walletConnected')
    const savedAddress = localStorage.getItem('selectedWalletAddress')

    if (walletConnected === 'true' && savedAddress) {
      const success = await connect()
      
      if (success) {
        const allAccounts = await getAccounts()
        const account = allAccounts.find(acc => acc.address === savedAddress)
        
        if (account) {
          setSelectedAccount(account)
        }
      }
    }
  }

  loadSavedConnection()
}, [])
```

## Authentication

### Backend Authentication

**Flow**:
1. User connects wallet in frontend
2. Frontend requests challenge from backend
3. User signs challenge with private key
4. Frontend sends signature to backend
5. Backend verifies signature
6. Backend returns JWT token

**Frontend**:
```typescript
async function authenticateWithWallet(address: string) {
  // 1. Get challenge
  const { challenge } = await api.get('/auth/challenge', { params: { address } })

  // 2. Sign challenge
  const signature = await signMessage(address, challenge)

  if (!signature) {
    throw new Error('Failed to sign message')
  }

  // 3. Verify signature and get token
  const { access_token } = await api.post('/auth/wallet', {
    wallet_address: address,
    message: challenge,
    signature
  })

  // 4. Store token
  localStorage.setItem('access_token', access_token)

  return access_token
}
```

**Backend**:
```python
from substrateinterface import Keypair

@router.post("/auth/wallet")
async def wallet_login(credentials: WalletCredentials):
    # Verify signature
    keypair = Keypair(ss58_address=credentials.wallet_address)
    
    is_valid = keypair.verify(
        data=credentials.message,
        signature=credentials.signature
    )
    
    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    # Create or get user
    user = get_or_create_user(credentials.wallet_address)
    
    # Generate JWT token
    token = create_access_token(data={"sub": user.wallet_address})
    
    return {"access_token": token, "token_type": "bearer"}
```

## Transaction Signing

### Sign and Send Transaction

```typescript
async function sendTransaction(
  address: string,
  method: string,
  args: any
) {
  // Get signer
  const injector = await web3FromAddress(address)

  // Create transaction
  const tx = api.tx.contracts.call(
    contractAddress,
    0, // value
    gasLimit,
    method,
    ...args
  )

  // Sign and send
  const unsub = await tx.signAndSend(
    address,
    { signer: injector.signer },
    ({ status, events }) => {
      if (status.isInBlock) {
        console.log(`Transaction included in block ${status.asInBlock}`)
      }

      if (status.isFinalized) {
        console.log(`Transaction finalized in block ${status.asFinalized}`)
        unsub()
      }
    }
  )
}
```

## UI Components

### WalletStatus Component

**File**: `frontend/src/components/features/wallet-status.tsx`

Displays wallet connection status in header.

```typescript
export function WalletStatus() {
  const {
    isConnected,
    selectedAccount,
    accounts,
    connect,
    disconnect,
    selectAccount,
    getFormattedAddress
  } = useWallet()

  if (!isConnected) {
    return (
      <button onClick={connect}>
        Connect Wallet
      </button>
    )
  }

  return (
    <div>
      <span>{getFormattedAddress(8)}</span>
      <button onClick={disconnect}>Disconnect</button>
      
      {/* Account selector */}
      <select onChange={(e) => {
        const account = accounts.find(a => a.address === e.target.value)
        if (account) selectAccount(account)
      }}>
        {accounts.map(account => (
          <option key={account.address} value={account.address}>
            {account.meta.name} ({formatAddress(account.address, 6)})
          </option>
        ))}
      </select>
    </div>
  )
}
```

### Wallet Modal

**File**: `frontend/src/components/features/wallet-modal.tsx`

Full-featured wallet management modal.

**Features**:
- Display wallet address with QR code
- Show balance (DOT and BRL)
- Copy address to clipboard
- Switch between accounts
- Disconnect wallet

## Error Handling

### Common Errors

**1. No Extension Installed**:
```typescript
if (!initialized) {
  return (
    <div>
      <p>No Polkadot wallet found. Please install:</p>
      <ul>
        <li><a href="https://subwallet.app/">SubWallet</a></li>
        <li><a href="https://polkadot.js.org/extension/">Polkadot.js</a></li>
        <li><a href="https://talisman.xyz/">Talisman</a></li>
      </ul>
    </div>
  )
}
```

**2. No Accounts**:
```typescript
if (accounts.length === 0) {
  return (
    <div>
      <p>No accounts found. Please create an account in your wallet extension.</p>
    </div>
  )
}
```

**3. User Rejected**:
```typescript
try {
  const signature = await signMessage(address, message)
} catch (error) {
  if (error.message.includes('Cancelled')) {
    alert('Transaction cancelled by user')
  } else {
    alert('Failed to sign transaction')
  }
}
```

**4. Network Mismatch**:
```typescript
const expectedNetwork = 'rococo'
const currentNetwork = await api.rpc.system.chain()

if (currentNetwork.toLowerCase() !== expectedNetwork) {
  alert(`Please switch to ${expectedNetwork} network in your wallet`)
}
```

## Best Practices

### 1. Check Extension Availability

Always check if extension is available before calling methods:

```typescript
if (typeof window === 'undefined' || !window.injectedWeb3) {
  console.error('Extension not available')
  return
}
```

### 2. Handle Async Operations

All wallet operations are async. Always use try/catch:

```typescript
try {
  const accounts = await getAccounts()
} catch (error) {
  console.error('Failed to get accounts:', error)
}
```

### 3. Provide User Feedback

Show loading states during wallet operations:

```typescript
const [isConnecting, setIsConnecting] = useState(false)

const handleConnect = async () => {
  setIsConnecting(true)
  try {
    await connect()
  } finally {
    setIsConnecting(false)
  }
}
```

### 4. Persist Connection

Save connection state to localStorage:

```typescript
// Save
localStorage.setItem('walletConnected', 'true')
localStorage.setItem('selectedWalletAddress', address)

// Load on mount
useEffect(() => {
  const isConnected = localStorage.getItem('walletConnected') === 'true'
  if (isConnected) {
    reconnect()
  }
}, [])
```

### 5. Format Addresses

Always format long addresses for display:

```typescript
export function formatAddress(address: string, length: number = 8): string {
  if (!address || address.length < length * 2) return address
  return `${address.slice(0, length)}...${address.slice(-length)}`
}

// Usage: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
// Result: 5GrwvaEF...oHGKutQY
```

### 6. Validate Addresses

Validate addresses before using:

```typescript
export function isValidPolkadotAddress(address: string): boolean {
  try {
    return address.length >= 47 && address.length <= 48 && address.startsWith('5')
  } catch (error) {
    return false
  }
}
```

## Testing

### Mock Wallet for Development

```typescript
// test/mocks/wallet.ts
export const mockWallet = {
  accounts: [
    {
      address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      meta: {
        name: 'Test Account',
        source: 'polkadot-js'
      }
    }
  ],
  
  signMessage: async (message: string) => {
    return '0x' + '00'.repeat(64) // Mock signature
  }
}
```

### Unit Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { WalletProvider } from '@/contexts/WalletContext'

describe('Wallet Integration', () => {
  it('should connect wallet', async () => {
    render(
      <WalletProvider>
        <MyComponent />
      </WalletProvider>
    )

    const connectButton = screen.getByText('Connect Wallet')
    fireEvent.click(connectButton)

    await screen.findByText(/Connected/)
  })
})
```

## Troubleshooting

### Extension Not Detected

**Problem**: `web3Enable` returns empty array

**Solutions**:
1. Check extension is installed and enabled
2. Refresh page after installing extension
3. Check browser console for errors
4. Try different browser

### Accounts Not Loading

**Problem**: `web3Accounts` returns empty array

**Solutions**:
1. Create account in wallet extension
2. Grant permission to PolkaPay in extension settings
3. Check extension is unlocked

### Signature Verification Fails

**Problem**: Backend rejects signature

**Solutions**:
1. Verify message format is correct
2. Check address format (SS58)
3. Ensure signature is hex string starting with `0x`
4. Verify network matches (Rococo vs Polkadot)

### Transaction Fails

**Problem**: Transaction rejected or fails

**Solutions**:
1. Check sufficient balance for transaction + fees
2. Verify gas limit is adequate
3. Check contract is not paused
4. Verify user has permission for action

## Security Considerations

### 1. Never Store Private Keys

Private keys stay in wallet extension. Never request or store them.

### 2. Verify Signatures Server-Side

Always verify signatures on backend:

```python
keypair = Keypair(ss58_address=address)
is_valid = keypair.verify(data=message, signature=signature)
```

### 3. Use HTTPS

Always use HTTPS in production to prevent MITM attacks.

### 4. Validate User Input

Validate all addresses and amounts before signing:

```typescript
if (!isValidPolkadotAddress(address)) {
  throw new Error('Invalid address')
}

if (amount <= 0 || amount > balance) {
  throw new Error('Invalid amount')
}
```

### 5. Show Transaction Details

Always show full transaction details before signing:

```typescript
<div>
  <h3>Confirm Transaction</h3>
  <p>Action: Sell DOT</p>
  <p>Amount: {dotAmount} DOT</p>
  <p>Recipient: {formatAddress(recipientAddress)}</p>
  <p>Fee: ~0.01 DOT</p>
  <button onClick={sign}>Confirm</button>
</div>
```

## Resources

- [Polkadot.js Extension Documentation](https://polkadot.js.org/docs/extension/)
- [SubWallet Documentation](https://docs.subwallet.app/)
- [Talisman Documentation](https://docs.talisman.xyz/)
- [Polkadot Address Format](https://wiki.polkadot.network/docs/learn-accounts)
- [Substrate SS58](https://docs.substrate.io/reference/address-formats/)
