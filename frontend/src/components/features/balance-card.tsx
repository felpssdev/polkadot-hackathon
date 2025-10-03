'use client'

interface BalanceCardProps {
  balance: string
  balanceInLocal: string
}

export function BalanceCard({ balance, balanceInLocal }: BalanceCardProps) {
  return (
    <div className="text-center py-6">
      <p className="text-muted-foreground text-[10px] font-pixel mb-2 tracking-wider uppercase">
        Saldo Total
      </p>
      <h2 className="text-4xl font-pixel font-bold text-white tracking-tight mb-1.5 text-pixel-shadow">
        {balance}
      </h2>
      <p className="text-muted-foreground text-[12px] font-medium">
        ≈ {balanceInLocal}
      </p>
    </div>
  )
}
