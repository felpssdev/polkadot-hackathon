'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import {
  mockUserLimits,
  mockExchangeRate,
  formatCurrency,
} from '@/lib/mock-data'

export function CurrentLimits() {
  return (
    <div className="relative rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 p-5 space-y-4 border-2 border-primary/30 scanlines">
      <h2 className="text-center text-[13px] font-pixel font-bold text-white mb-4">
        Transaction Limits
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Buy Limit */}
        <div className="flex flex-col items-center p-4 rounded-xl bg-background/40 border border-white/10">
          <div className="w-12 h-12 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center mb-3">
            <TrendingUp className="h-6 w-6 text-primary" strokeWidth={2.5} />
          </div>
          <span className="text-[9px] font-pixel text-muted-foreground mb-2">
            BUY
          </span>
          <p className="text-xs font-pixel font-bold text-primary">
            {formatCurrency(mockUserLimits.buyLimit * mockExchangeRate, 'BRL')}
          </p>
        </div>

        {/* Sell/Pay Limit */}
        <div className="flex flex-col items-center p-4 rounded-xl bg-background/40 border border-white/10">
          <div className="w-12 h-12 rounded-lg bg-secondary/20 border border-secondary/30 flex items-center justify-center mb-3">
            <TrendingDown
              className="h-6 w-6 text-secondary"
              strokeWidth={2.5}
            />
          </div>
          <span className="text-[9px] font-pixel text-muted-foreground mb-2">
            SELL/PAY
          </span>
          <p className="text-xs font-pixel font-bold text-secondary">
            {formatCurrency(mockUserLimits.sellLimit * mockExchangeRate, 'BRL')}
          </p>
        </div>
      </div>
    </div>
  )
}
