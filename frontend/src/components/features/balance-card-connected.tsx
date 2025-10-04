'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useExchangeRates } from '@/hooks/useOrders'
import { useWallet } from '@/contexts/WalletContext'

interface BalanceCardConnectedProps {
  dotBalance?: number // Se tiver integração com saldo real
}

export function BalanceCardConnected({
  dotBalance = 10.5,
}: BalanceCardConnectedProps) {
  const [showBalance, setShowBalance] = useState(true)
  const { rates, loading } = useExchangeRates()
  const { selectedAccount } = useWallet()

  // Calculate BRL and USD values based on DOT balance
  const brlBalance = rates ? dotBalance * rates.dot_to_brl : 0
  const usdBalance = rates ? dotBalance * rates.dot_to_usd : 0

  return (
    <div className="bg-gradient-to-br from-card via-card to-card/80 rounded-2xl p-5 border-2 border-white/[0.08] shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground font-medium mb-1">
            Total Balance
          </p>
          {loading ? (
            <div className="h-8 w-32 bg-white/5 animate-pulse rounded" />
          ) : (
            <div className="flex items-baseline gap-2">
              {showBalance ? (
                <>
                  <h2 className="text-3xl font-bold text-white">
                    R$ {brlBalance.toFixed(2).replace('.', ',')}
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    ≈ ${usdBalance.toFixed(2)} USD
                  </span>
                </>
              ) : (
                <h2 className="text-3xl font-bold text-white">••••••</h2>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => setShowBalance(!showBalance)}
          className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
        >
          {showBalance ? (
            <Eye className="h-4 w-4 text-white/70" />
          ) : (
            <EyeOff className="h-4 w-4 text-white/70" />
          )}
        </button>
      </div>

      {/* DOT Balance */}
      <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg border border-white/[0.05]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
            <span className="text-primary font-bold text-sm">DOT</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Polkadot</p>
            <p className="text-sm font-semibold text-white">
              {showBalance ? `${dotBalance.toFixed(4)} DOT` : '••••••'}
            </p>
          </div>
        </div>
        {rates && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Rate</p>
            <p className="text-sm font-medium text-white">
              R$ {rates.dot_to_brl.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {/* Account Address */}
      {selectedAccount && (
        <div className="mt-3 pt-3 border-t border-white/[0.05]">
          <p className="text-xs text-muted-foreground truncate">
            {selectedAccount.address}
          </p>
        </div>
      )}
    </div>
  )
}
