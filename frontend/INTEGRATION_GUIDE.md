# 🔌 Frontend-Backend Integration Guide

Guia completo de integração do frontend Next.js com o backend FastAPI.

## 📦 O que foi criado

### 1. API Client (`src/lib/api.ts`)

Cliente HTTP completo para comunicação com o backend:

```typescript
import api from '@/lib/api'

// Auth
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

### 2. Custom Hooks

**`useOrders()`** - Gerenciar ordens
```typescript
const { orders, loading, error, fetchOrders } = useOrders()
```

**`useExchangeRates()`** - Taxa de câmbio DOT/BRL
```typescript
const { rates, loading } = useExchangeRates()
// rates.dot_to_brl, rates.dot_to_usd
```

**`useCreateOrder()`** - Criar ordem
```typescript
const { createOrder, loading } = useCreateOrder()
await createOrder({ order_type: 'sell', dot_amount: 2.0 })
```

**`useLiquidityProvider()`** - Gerenciar LP
```typescript
const { profile, register } = useLiquidityProvider(token)
await register('pix@email.com', 'email')
```

### 3. Componentes Conectados

**`<BalanceCardConnected />`** - Card de saldo com dados reais
- Busca taxa de câmbio do backend
- Calcula valores em BRL/USD automaticamente
- Atualiza a cada 30 segundos

**`<OrdersList />`** - Lista de ordens ativas
- Busca ordens do backend
- Auto-refresh a cada 10 segundos
- Mostra status, valores, PIX key

## 🚀 Como Usar

### 1. Configurar URL do Backend

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 2. Substituir Componentes Mock

**Antes:**
```tsx
import { BalanceCard } from '@/components/features/balance-card'
import { mockWalletBalance } from '@/lib/mock-data'

<BalanceCard balance={`R$ ${mockWalletBalance.brl}`} />
```

**Depois:**
```tsx
import { BalanceCardConnected } from '@/components/features/balance-card-connected'

<BalanceCardConnected dotBalance={10.5} />
```

### 3. Usar no Componente

```tsx
'use client'

import { useExchangeRates, useOrders } from '@/hooks/useOrders'
import { OrdersList } from '@/components/features/orders-list'

export default function HomePage() {
  const { rates } = useExchangeRates()
  const { orders, fetchOrders } = useOrders()

  return (
    <div>
      {/* Mostra taxa de câmbio */}
      {rates && (
        <p>1 DOT = R$ {rates.dot_to_brl.toFixed(2)}</p>
      )}

      {/* Lista de ordens */}
      <OrdersList />
    </div>
  )
}
```

### 4. Criar Ordem

```tsx
'use client'

import { useCreateOrder } from '@/hooks/useOrders'

export function SellModal() {
  const { createOrder, loading } = useCreateOrder()

  const handleSell = async () => {
    try {
      const order = await createOrder({
        order_type: 'sell',
        dot_amount: 2.0,
        pix_key: 'user@email.com'
      })
      
      console.log('Order created:', order)
      alert(`Order #${order.id} created!`)
    } catch (error) {
      alert('Failed to create order')
    }
  }

  return (
    <button onClick={handleSell} disabled={loading}>
      {loading ? 'Creating...' : 'Sell DOT'}
    </button>
  )
}
```

## 🧪 Testar Integração

### 1. Verificar Backend Rodando

```bash
# Terminal 1 - Backend
cd backend
docker-compose up -d
docker-compose exec backend python scripts/init_db.py

# Verificar
curl http://localhost:8000/health
```

### 2. Verificar Dados Mock

```bash
# Ver ordens mockadas
curl http://localhost:8000/api/v1/orders/

# Ver taxa de câmbio
curl http://localhost:8000/api/v1/orders/rates/exchange
```

### 3. Testar Frontend

```bash
# Terminal 2 - Frontend
cd frontend
npm run dev
```

Abra: http://localhost:3000

**Deve ver:**
- Taxa de câmbio real do backend
- Saldo calculado com taxa real
- Lista de ordens (se houver)

### 4. Testar Console do Browser

```javascript
// Abrir DevTools (F12) -> Console

// Testar API diretamente
fetch('http://localhost:8000/api/v1/orders/rates/exchange')
  .then(r => r.json())
  .then(console.log)

// Ver erros de CORS (se houver)
```

## 🔧 Atualizar Página Principal

Edite `src/app/page.tsx`:

```tsx
'use client'

import { BalanceCardConnected } from '@/components/features/balance-card-connected'
import { OrdersList } from '@/components/features/orders-list'
import { Header } from '@/components/layout/header'

export default function Home() {
  return (
    <div className="min-h-screen bg-background pb-28">
      <Header />
      
      <main className="max-w-md mx-auto space-y-5 py-4 px-5">
        {/* Balance com dados reais */}
        <BalanceCardConnected dotBalance={10.5} />
        
        {/* Lista de ordens ativas */}
        <div className="space-y-3">
          <h2 className="text-sm font-pixel font-bold text-white">
            Active Orders
          </h2>
          <OrdersList />
        </div>
      </main>
    </div>
  )
}
```

## 🎯 Fluxo Completo: Criar Ordem

```tsx
// 1. Usuário clica em "Sell DOT"
const handleSell = async (dotAmount: number, pixKey: string) => {
  const { createOrder } = useCreateOrder()
  
  // 2. Cria ordem no backend
  const order = await createOrder({
    order_type: 'sell',
    dot_amount: dotAmount,
    pix_key: pixKey
  })
  
  // 3. Backend retorna ordem criada
  console.log('Order ID:', order.id)
  console.log('Status:', order.status)
  
  // 4. Refresh lista de ordens
  await fetchOrders()
}
```

## 🐛 Troubleshooting

### Erro: CORS

**Problema:** `Access to fetch blocked by CORS policy`

**Solução:** Backend já está configurado com CORS. Verifique se está rodando:
```bash
docker-compose logs backend | grep CORS
```

### Erro: Connection Refused

**Problema:** `Failed to fetch`

**Solução:**
```bash
# Verificar se backend está rodando
docker-compose ps

# Verificar logs
docker-compose logs backend
```

### Erro: 404 Not Found

**Problema:** Endpoint não existe

**Solução:** Verificar URL:
```bash
# Verificar se API está acessível
curl http://localhost:8000/api/v1/orders/rates/exchange
```

### Dados não aparecem

**Problema:** Backend retorna dados mas não aparecem

**Solução:**
1. Abrir DevTools (F12)
2. Aba Network
3. Filtrar por "XHR"
4. Ver requisições
5. Ver resposta

## 📊 Estrutura de Dados

### Order

```typescript
{
  id: 1,
  order_type: "sell",
  status: "pending",
  dot_amount: 2.0,
  brl_amount: 75.0,
  usd_amount: 15.0,
  exchange_rate_dot_brl: 37.5,
  lp_fee_amount: 1.5,
  user_id: 1,
  lp_id: null,
  pix_key: "user@email.com",
  pix_qr_code: null,
  created_at: "2024-10-03T10:00:00Z"
}
```

### Exchange Rates

```typescript
{
  dot_to_usd: 7.5,
  dot_to_brl: 37.5
}
```

### LP Profile

```typescript
{
  id: 1,
  pix_key: "lp@email.com",
  pix_key_type: "email",
  total_orders_processed: 10,
  total_volume_usd: 1000.0,
  total_earnings_usd: 20.0,
  rating: 4.9,
  is_available: true
}
```

## 🎨 Próximos Passos

1. **Autenticação completa**
   - Login com wallet signature
   - Salvar JWT token
   - Usar token em requisições

2. **WebSocket para real-time**
   - Notificações de novas ordens
   - Updates de status
   - Chat com LP

3. **Paginação**
   - Lista infinita de ordens
   - Load more
   - Virtual scrolling

4. **Cache e Optimistic Updates**
   - React Query / SWR
   - Optimistic UI
   - Offline support

## 📚 Documentação

- **API Docs (Swagger):** http://localhost:8000/docs
- **Backend README:** `backend/README.md`
- **API Examples:** `backend/API_EXAMPLES.md`

---

**Agora seu frontend está conectado ao backend!** 🎉

Teste criar ordens, ver taxa de câmbio e listar ordens ativas.

