'use client'

import { useState } from 'react'
import { X, DollarSign, ArrowLeft, Copy, Minus } from 'lucide-react'

interface WithdrawModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WithdrawModal({ isOpen, onClose }: WithdrawModalProps) {
  const [showWithdrawForm, setShowWithdrawForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const balance = '0.00'

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(recipientAddress)
  }

  const handlePercentageClick = (percentage: number) => {
    if (percentage === 100) {
      setAmount(balance)
    } else {
      setAmount((parseFloat(balance) * (percentage / 100)).toFixed(2))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card rounded-2xl border-2 border-white/10 shadow-2xl max-h-[80vh] overflow-hidden">
        {!showWithdrawForm ? (
          /* Withdraw Options */
          <>
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-pixel font-bold text-white">
                  Withdraw
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
              <p className="text-white/60 text-sm mt-2">
                Send funds from your P2P.me wallet.
              </p>
            </div>

            {/* Withdraw Options */}
            <div className="px-6 pb-6">
              {/* Polkadot/DOT Option */}
              <button
                onClick={() => setShowWithdrawForm(true)}
                className="w-full flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-pixel font-bold">
                    Sacar Polkadot/DOT
                  </p>
                  <p className="text-white/60 text-sm">
                    Withdraw DOT from your P2P.me wallet
                  </p>
                </div>
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                  <div className="w-2 h-2 border-r-2 border-b-2 border-white/60 rotate-[-45deg]"></div>
                </div>
              </button>
            </div>
          </>
        ) : (
          /* Withdraw Form */
          <>
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowWithdrawForm(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-white/60" />
                </button>
                <h2 className="text-2xl font-pixel font-bold text-white">
                  Withdraw DOT
                </h2>
              </div>
            </div>

            {/* Icon */}
            <div className="flex justify-center pb-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-card">
                  <Minus className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>

            {/* Warning Banner */}
            <div className="px-6 pb-4">
              <div className="flex items-center gap-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <p className="text-orange-400 text-sm font-pixel">
                  Withdraw DOT only to Polkadot addresses.
                </p>
              </div>
            </div>

            {/* Amount Input */}
            <div className="px-6 pb-4">
              <label className="text-white/60 text-sm font-pixel mb-2 block">
                Enter amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-4 pr-32 bg-white/5 rounded-xl border border-white/10 text-white placeholder:text-white/40 focus:border-primary/50 focus:outline-none transition-all"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => handlePercentageClick(50)}
                      className="px-2 py-1 text-xs bg-white/10 rounded text-white/60 hover:text-white transition-colors"
                    >
                      50%
                    </button>
                    <button
                      onClick={() => handlePercentageClick(100)}
                      className="px-2 py-1 text-xs bg-white/10 rounded text-white/60 hover:text-white transition-colors"
                    >
                      Max
                    </button>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded">
                    <DollarSign className="w-3 h-3 text-white/60" />
                    <span className="text-white text-xs font-pixel">DOT</span>
                  </div>
                </div>
              </div>
              <p className="text-white/40 text-xs mt-1">Balance: {balance}</p>
            </div>

            {/* Recipient Address Input */}
            <div className="px-6 pb-6">
              <label className="text-white/60 text-sm font-pixel mb-2 block">
                Enter recipient address
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
                  className="w-full p-4 pr-12 bg-white/5 rounded-xl border border-white/10 text-white placeholder:text-white/40 focus:border-primary/50 focus:outline-none transition-all"
                />
                <button
                  onClick={handleCopyAddress}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4 text-white/60" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="px-6 pb-6 space-y-3">
          {showWithdrawForm && (
            <button className="w-full py-4 bg-white text-black font-pixel font-bold rounded-xl hover:bg-white/90 transition-colors border border-white/30">
              Withdraw DOT
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-4 bg-primary/20 text-white font-pixel font-bold rounded-xl hover:bg-primary/30 transition-colors border border-primary/30"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
