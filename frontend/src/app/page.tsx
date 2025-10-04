'use client'

import { useState } from 'react'
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
import { WalletModal } from '@/components/features/wallet-modal'
import { DepositSheet } from '@/components/features/deposit-sheet'
import { WithdrawModal } from '@/components/features/withdraw-modal'
import { BuyModal } from '@/components/features/buy-modal'

export default function Home() {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [isDepositSheetOpen, setIsDepositSheetOpen] = useState(false)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false)

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
            onClick={() => setIsWalletModalOpen(true)}
          />
          <ActionButton
            icon={ArrowDownToLine}
            label="Depositar"
            onClick={() => setIsDepositSheetOpen(true)}
          />
          <ActionButton
            icon={ArrowUpFromLine}
            label="Sacar"
            onClick={() => setIsWithdrawModalOpen(true)}
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
      <BottomNavigation onBuyClick={() => setIsBuyModalOpen(true)} />

      {/* Wallet Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />

      {/* Deposit Sheet */}
      <DepositSheet
        isOpen={isDepositSheetOpen}
        onClose={() => setIsDepositSheetOpen(false)}
      />

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
      />

      {/* Buy Modal */}
      <BuyModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
      />
    </div>
  )
}
