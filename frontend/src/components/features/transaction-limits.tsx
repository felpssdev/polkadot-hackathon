'use client'

import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react'

interface TransactionLimit {
  type: 'Buy' | 'Sell/Pay'
  amount: string
  icon: typeof TrendingUp
}

const limits: TransactionLimit[] = [
  { type: 'Buy', amount: 'R$ 0', icon: TrendingUp },
  { type: 'Sell/Pay', amount: 'R$ 500', icon: TrendingDown },
]

export function TransactionLimits() {
  return (
    <div className="relative rounded-xl bg-white/[0.02] backdrop-blur-sm p-5 space-y-4 border-2 border-white/[0.08] scanlines">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[11px] font-pixel font-bold text-white mb-1.5">
            Transaction Limits
          </h3>
          <p className="text-[9px] text-muted-foreground font-medium">
            Maximum per operation
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {limits.map((limit) => (
          <div
            key={limit.type}
            className="space-y-2 p-3 rounded-lg bg-background/40 border border-white/5"
          >
            <div className="flex items-center gap-1.5">
              <limit.icon
                className="h-3.5 w-3.5 text-primary"
                strokeWidth={2.5}
              />
              <span className="text-[8px] font-pixel text-muted-foreground uppercase">
                {limit.type}
              </span>
            </div>
            <p className="text-lg font-pixel font-bold text-primary tracking-tight">
              {limit.amount}
            </p>
          </div>
        ))}
      </div>
      <a href="/limites">
        <button className="w-full py-2.5 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/30 text-[10px] font-pixel font-bold text-white hover:from-primary/15 hover:to-secondary/15 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group btn-8bit">
          Increase Limits
          <ChevronRight
            className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform"
            strokeWidth={3}
          />
        </button>
      </a>
    </div>
  )
}
