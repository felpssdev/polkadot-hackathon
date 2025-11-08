# Frontend Documentation

Next.js frontend for PolkaPay with 8-bit themed UI.

## Overview

The frontend provides a retro-styled user interface for the P2P marketplace. Built with Next.js 15, React 19, and featuring an 8-bit gaming aesthetic.

## Technology Stack

- **Next.js 15** - React framework with App Router
- **React 19** - UI library with server components
- **TypeScript** - Static typing
- **Tailwind CSS 4** - Utility-first CSS
- **8bitcn/ui** - 8-bit styled components
- **Polkadot.js** - Wallet integration
- **Press Start 2P** - Pixel art font

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── ui/                 # Base components (8bitcn)
│   │   ├── layout/             # Layout components
│   │   └── features/           # Feature components
│   ├── contexts/
│   │   └── WalletContext.tsx   # Wallet state management
│   ├── lib/
│   │   ├── api.ts              # API client
│   │   ├── polkadot.ts         # Polkadot utilities
│   │   └── utils.ts            # Helper functions
│   └── hooks/
│       └── useOrders.ts        # Custom hooks
├── public/                     # Static assets
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

## Setup

### Using Docker

```bash
# From project root
docker-compose up -d

# Frontend available at http://localhost:3000
```

### Local Development

```bash
cd frontend

# Install dependencies
pnpm install

# Run development server
pnpm run dev

# Build for production
pnpm run build

# Start production server
pnpm start
```

## Component Architecture

### Component Patterns

#### Props Interfaces

All components use TypeScript interfaces:

```typescript
interface BalanceCardProps {
  buyPrice: string
  currency: string
  balance: string
  balanceInLocal: string
}

export function BalanceCard({ buyPrice, currency, balance, balanceInLocal }: BalanceCardProps) {
  // Component logic
}
```

#### Composition

Components compose smaller, reusable components:

```typescript
<Header />
<BalanceCard />
<ActionButton />
<QuickTour />
```

#### Client Components

Interactive components use `'use client'`:

```typescript
'use client'

export function ActionButton({ onClick }: ActionButtonProps) {
  return <Button onClick={onClick}>Click Me</Button>
}
```

### Component Categories

#### Layout Components
- Header - Navigation and wallet status
- Footer - Bottom navigation
- Container - Page wrapper

#### Feature Components
- BalanceCard - Display user balance
- ActionButton - Primary actions
- TransactionLimits - User limits display
- OrdersList - Active orders

#### UI Components (8bitcn)
- Button - Styled buttons
- Card - Content containers
- Badge - Status indicators
- Avatar - User avatars

## Design System

### Theme

8-bit dark theme with vibrant colors:

- **Primary**: Purple (#7C3AED) - Main actions
- **Secondary**: Blue - Highlights
- **Background**: Deep black - Base
- **Muted**: Blue-gray - Secondary text

### Typography

- **Font**: Press Start 2P (pixel art)
- **Letter Spacing**: 0.05em
- **Line Height**: 1.6

### Styling

```css
.pixelated {
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}
```

## API Integration

### API Client

Located in `src/lib/api.ts`:

```typescript
import api from '@/lib/api'

// Authentication
await api.auth.loginWithWallet(address, message, signature)
await api.auth.getProfile(token)

// Orders
await api.orders.getExchangeRates()
await api.orders.createOrder({ order_type: 'sell', dot_amount: 1.5 })
await api.orders.getActiveOrders('sell')

// Liquidity Provider
await api.lp.register('pix@email.com', 'email', token)
await api.lp.getEarnings(token)
```

### Custom Hooks

#### useOrders

```typescript
const { orders, loading, error, fetchOrders } = useOrders()
```

#### useExchangeRates

```typescript
const { rates, loading } = useExchangeRates()
// rates.dot_to_brl, rates.dot_to_usd
```

#### useCreateOrder

```typescript
const { createOrder, loading } = useCreateOrder()
await createOrder({ order_type: 'sell', dot_amount: 2.0 })
```

### Configuration

Set backend URL in `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## Wallet Integration

See [Wallet Integration](wallet-integration.md) for complete documentation.

### Quick Example

```typescript
import { useWallet } from '@/contexts/WalletContext'

function MyComponent() {
  const { isConnected, selectedAccount, connect, disconnect } = useWallet()

  return (
    <div>
      {isConnected ? (
        <div>
          <p>Connected: {selectedAccount?.address}</p>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  )
}
```

### Supported Wallets

- SubWallet
- Polkadot.js Extension
- Talisman

## State Management

### React Context

Global state managed with Context API:

- **WalletContext** - Wallet connection state
- **ThemeContext** - Theme preferences (future)

### Local State

Component-level state with React hooks:

```typescript
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
```

## Routing

File-based routing with Next.js App Router:

```
app/
├── page.tsx           # / (home)
├── wallet/
│   └── page.tsx       # /wallet
├── orders/
│   └── page.tsx       # /orders
└── lp/
    └── page.tsx       # /lp
```

## Development

### Adding Components

```bash
# Using 8bitcn registry
npx shadcn@latest add @8bitcn/button --yes
npx shadcn@latest add @8bitcn/dialog --yes
```

### Code Quality

```bash
# Linting
pnpm run lint

# Type checking
pnpm run type-check

# Format code
pnpm run format
```

### Hot Reload

Development server supports hot reload:

- Edit files in `src/`
- Changes appear instantly
- State preserved when possible

## Testing

### Manual Testing

1. Start development server
2. Open http://localhost:3000
3. Test wallet connection
4. Test order creation
5. Test LP features

### Browser Testing

Tested on:
- Chrome/Brave
- Firefox
- Safari
- Edge

## Build and Deploy

### Production Build

```bash
# Build
pnpm run build

# Start production server
pnpm start
```

### Docker Build

```bash
# Build image
docker build -t polkapay-frontend .

# Run container
docker run -p 3000:3000 polkapay-frontend
```

### Environment Variables

Production environment:

```bash
NEXT_PUBLIC_API_URL=https://api.polkapay.com/api/v1
NODE_ENV=production
```

## Performance

### Optimization

- Server-side rendering
- Image optimization
- Code splitting
- Tree shaking
- Minification

### Metrics

- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Cumulative Layout Shift (CLS)

## Troubleshooting

### Build Errors

```bash
# Clean build
rm -rf .next
pnpm run build
```

### Wallet Connection Issues

Check:
- Wallet extension installed
- Extension enabled
- Correct network selected
- Browser console for errors

### API Connection Issues

Verify:
- Backend is running
- Correct API URL in .env.local
- CORS configured on backend
- Network tab in browser dev tools

## Future Improvements

- WebSocket for real-time updates
- Progressive Web App (PWA)
- Mobile responsiveness
- Accessibility improvements
- Unit and integration tests
- E2E testing with Playwright
- Performance monitoring
- Error tracking (Sentry)

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [8bitcn Components](https://8bitcn.com)
- [Polkadot.js](https://polkadot.js.org)

