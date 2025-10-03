'use client'

import { CreditCard } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/8bit/card'
import { Button } from '@/components/ui/8bit/button'

interface TransactionLimit {
  type: 'Buy' | 'Sell/Pay'
  amount: string
  icon: typeof CreditCard
}

const limits: TransactionLimit[] = [
  { type: 'Buy', amount: '$0', icon: CreditCard },
  { type: 'Sell/Pay', amount: '$100', icon: CreditCard },
]

export function TransactionLimits() {
  return (
    <Card className="pixelated mx-6 bg-card/50">
      <CardHeader className="space-y-3">
        <CardTitle className="text-2xl tracking-wide">
          Per Transaction Limits
        </CardTitle>
        <CardDescription className="text-base leading-relaxed">
          This is the maximum USDC you can buy, sell, or pay in one order.
          Increase it to do larger transactions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          {limits.map((limit) => (
            <div key={limit.type} className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <limit.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{limit.type}</span>
              </div>
              <p className="text-4xl font-bold text-primary tracking-tight">
                {limit.amount}
              </p>
            </div>
          ))}
        </div>
        <Button variant="outline" className="w-full pixelated text-base py-6">
          Increase Transaction Limits
        </Button>
      </CardContent>
    </Card>
  )
}
