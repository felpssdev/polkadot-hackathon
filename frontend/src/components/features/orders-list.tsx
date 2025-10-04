'use client'

import { useEffect } from 'react'
import { useOrders, type Order } from '@/hooks/useOrders'
import { ArrowUpRight, ArrowDownRight, Clock, Loader2 } from 'lucide-react'

export function OrdersList() {
  const { orders, loading, error, fetchOrders } = useOrders()

  useEffect(() => {
    fetchOrders()
    // Refresh every 10 seconds
    const interval = setInterval(() => fetchOrders(), 10000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-sm">No active orders</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  )
}

function OrderCard({ order }: { order: Order }) {
  const isBuy = order.order_type === 'buy'

  return (
    <div className="p-4 bg-card border border-white/10 rounded-xl hover:bg-white/[0.03] transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isBuy
                ? 'bg-green-500/20 text-green-500'
                : 'bg-red-500/20 text-red-500'
            }`}
          >
            {isBuy ? (
              <ArrowDownRight className="w-4 h-4" />
            ) : (
              <ArrowUpRight className="w-4 h-4" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {isBuy ? 'Buy' : 'Sell'} Order
            </p>
            <p className="text-xs text-muted-foreground">#{order.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
          <Clock className="w-3 h-3 text-yellow-500" />
          <span className="text-xs text-yellow-500 font-medium">
            {order.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Amount</p>
          <p className="text-sm font-semibold text-white">
            {order.dot_amount.toFixed(4)} DOT
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Value</p>
          <p className="text-sm font-semibold text-white">
            R$ {order.brl_amount.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Rate</p>
          <p className="text-sm font-medium text-white">
            R$ {order.exchange_rate_dot_brl.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Fee</p>
          <p className="text-sm font-medium text-white">
            R$ {order.lp_fee_amount.toFixed(2)}
          </p>
        </div>
      </div>

      {order.pix_key && (
        <div className="mt-3 pt-3 border-t border-white/[0.05]">
          <p className="text-xs text-muted-foreground mb-1">PIX Key</p>
          <p className="text-xs text-white font-mono truncate">{order.pix_key}</p>
        </div>
      )}
    </div>
  )
}

