'use client'

import {
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Headphones,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { BalanceCard } from '@/components/features/balance-card'
import { ActionButton } from '@/components/features/action-button'
import { QuickTour } from '@/components/features/quick-tour'
import { TransactionLimits } from '@/components/features/transaction-limits'
import { BottomNavigation } from '@/components/features/bottom-navigation'

export default function Home() {
  return (
    <div className="min-h-screen bg-background pb-28">
      <Header />

      <main className="max-w-md mx-auto space-y-5 py-4 px-5">
        {/* Balance Section */}
        <BalanceCard balance="R$ 0,00" balanceInLocal="≈ $0.00 USD" />

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-2.5">
          <ActionButton
            icon={Wallet}
            label="Carteira"
            onClick={() => console.log('Wallet clicked')}
          />
          <ActionButton
            icon={ArrowDownToLine}
            label="Depositar"
            onClick={() => console.log('Deposit clicked')}
          />
          <ActionButton
            icon={ArrowUpFromLine}
            label="Sacar"
            onClick={() => console.log('Withdraw clicked')}
          />
          <ActionButton
            icon={Headphones}
            label="Suporte"
            onClick={() => console.log('Support clicked')}
          />
        </div>

        {/* Install App */}
        <QuickTour />

        {/* Carousel Indicators */}
        <div className="flex justify-center gap-2 py-1">
          <div className="w-2 h-2 rounded-sm bg-primary shadow-lg shadow-primary/50 pixel-blink" />
          <div className="w-2 h-2 rounded-sm bg-white/20 border border-white/30" />
          <div className="w-2 h-2 rounded-sm bg-white/20 border border-white/30" />
        </div>

        {/* Transaction Limits */}
        <TransactionLimits />
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
