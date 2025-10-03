'use client'

import { Badge } from '@/components/ui/8bit/badge'
import { Card, CardContent } from '@/components/ui/8bit/card'

interface BalanceCardProps {
  buyPrice: string
  balance: string
  balanceInLocal: string
}

export function BalanceCard({
  buyPrice,
  balance,
  balanceInLocal,
}: BalanceCardProps) {
  return (
    <div className="space-y-6 px-6">
      <div className="flex justify-center">
        <Badge
          variant="outline"
          className="flex items-center gap-3 px-6 py-3 text-md"
        >
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
          <span className="text-muted-foreground mr-2">Buy Price:</span>
          <span className="font-bold text-lg">{buyPrice}</span>
        </Badge>
      </div>

      <Card className="pixelated">
        <CardContent className="p-2 text-center space-y-2">
          <p className="text-muted-foreground text-sm tracking-wide">
            Available Balance
          </p>
          <p className="text-5xl font-bold tracking-tight">{balance}</p>
          <p className="text-muted-foreground text-sm">≈ {balanceInLocal}</p>
        </CardContent>
      </Card>
    </div>
  )
}
