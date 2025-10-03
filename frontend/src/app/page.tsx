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
    <div className="min-h-screen bg-background pb-32">
      <Header />

      <main className="max-w-lg mx-auto space-y-8 py-4">
        {/* Balance Section */}
        <BalanceCard
          buyPrice="R$ 5,35"
          balance="$0.00"
          balanceInLocal="R$ 0,00"
        />

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-4 px-6">
          <ActionButton
            icon={Wallet}
            label="Wallet"
            onClick={() => console.log('Wallet clicked')}
          />
          <ActionButton
            icon={ArrowDownToLine}
            label="Deposit"
            onClick={() => console.log('Deposit clicked')}
          />
          <ActionButton
            icon={ArrowUpFromLine}
            label="Withdraw"
            onClick={() => console.log('Withdraw clicked')}
          />
          <ActionButton
            icon={Headphones}
            label="Support"
            onClick={() => console.log('Support clicked')}
          />
        </div>

        {/* Quick Tour Section */}
        <QuickTour />

        {/* Carousel Indicators */}
        <div className="flex justify-center gap-2 px-6">
          <div className="w-3 h-3 rounded-full bg-muted pixelated" />
          <div className="w-3 h-3 rounded-full bg-primary pixelated" />
        </div>

        {/* Transaction Limits */}
        <TransactionLimits />
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
