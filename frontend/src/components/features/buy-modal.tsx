'use client'

import { useState } from 'react'
import {
  X,
  ArrowLeft,
  HelpCircle,
  FileText,
  ChevronRight,
  Plus,
} from 'lucide-react'

interface BuyModalProps {
  isOpen: boolean
  onClose: () => void
}

export function BuyModal({ isOpen, onClose }: BuyModalProps) {
  const [amount, setAmount] = useState('')
  const [showKeyboard, setShowKeyboard] = useState(false)

  // Mock data
  const transactionLimit = 100 // USDC
  const currentPrice = 5.33 // BRL per DOT

  const handleNumberPress = (number: string) => {
    if (number === '.') {
      if (!amount.includes('.')) {
        const newAmount = amount + '.'
        if (parseFloat(newAmount) <= transactionLimit) {
          setAmount(newAmount)
        }
      }
    } else if (number === 'backspace') {
      setAmount(amount.slice(0, -1))
    } else {
      const newAmount = amount + number
      if (parseFloat(newAmount) <= transactionLimit) {
        setAmount(newAmount)
      }
    }
  }

  const handleMax = () => {
    setAmount(transactionLimit.toString())
  }

  const handleClear = () => {
    setAmount('')
  }

  const calculateBRL = () => {
    const numAmount = parseFloat(amount) || 0
    return (numAmount * currentPrice).toFixed(2)
  }

  const canContinue = () => {
    const numAmount = parseFloat(amount) || 0
    return numAmount > 0 && numAmount <= transactionLimit
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
      <div className="relative w-full max-w-md bg-card rounded-2xl border-2 border-white/10 shadow-2xl max-h-[85vh] overflow-hidden">
        {!showKeyboard ? (
          /* Buy Options */
          <>
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-pixel font-bold text-white">
                  Buy DOT
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
              <p className="text-white/60 text-sm mt-2">
                Purchase Polkadot tokens with BRL.
              </p>
            </div>

            {/* Buy Options */}
            <div className="px-6 pb-6">
              {/* DOT Purchase Option */}
              <button
                onClick={() => setShowKeyboard(true)}
                className="w-full flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-pixel font-bold">Buy DOT</p>
                  <p className="text-white/60 text-sm">
                    Buy DOT with Brazilian Real
                  </p>
                </div>
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                  <div className="w-2 h-2 border-r-2 border-b-2 border-white/60 rotate-[-45deg]"></div>
                </div>
              </button>
            </div>
          </>
        ) : (
          /* Keyboard Screen */
          <>
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowKeyboard(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-white/60" />
                </button>
                <h2 className="text-lg font-pixel font-bold text-white">
                  Buy DOT
                </h2>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <HelpCircle className="w-5 h-5 text-white/60" />
                </button>
              </div>
            </div>

            {/* Amount Display */}
            <div className="px-6 pb-4 text-center">
              <div
                className={`text-3xl font-pixel font-bold mb-2 transition-colors ${
                  parseFloat(amount) > transactionLimit
                    ? 'text-red-400'
                    : 'text-white'
                }`}
              >
                {amount || '0'} DOT
              </div>
              <div className="flex items-center justify-center gap-2 text-white/60">
                <div className="w-3 h-3 border-t-2 border-b-2 border-white/40"></div>
                <span className="text-xs font-pixel">{calculateBRL()} BRL</span>
              </div>
              {parseFloat(amount) > transactionLimit && (
                <p className="text-red-400 text-xs font-pixel mt-2">
                  Amount exceeds transaction limit
                </p>
              )}
            </div>

            {/* Transaction Limit Warning */}
            <div className="px-6 pb-4">
              <div className="p-3 bg-white/5 rounded-xl border border-primary/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-white font-pixel text-[9px]">
                      Your Transaction Limit: {transactionLimit} DOT
                    </span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-white/40" />
                </div>
                <p className="text-white/60 text-xs mb-3">
                  Increase your transaction limits by ZK-verifying your socials.
                </p>
                <button className="w-full py-2 bg-primary text-white font-pixel font-bold text-xs rounded-lg hover:bg-primary/90 transition-colors">
                  Increase Limit
                </button>
              </div>
            </div>

            {/* Numeric Keyboard */}
            <div className="px-6 pb-4">
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {[
                  '1',
                  '2',
                  '3',
                  '4',
                  '5',
                  '6',
                  '7',
                  '8',
                  '9',
                  '.',
                  '0',
                  'backspace',
                ].map((key) => (
                  <button
                    key={key}
                    onClick={() => handleNumberPress(key)}
                    className="h-12 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center text-white font-pixel text-sm"
                  >
                    {key === 'backspace' ? '⌫' : key}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between mb-3">
                <button
                  onClick={handleMax}
                  className="text-white/60 text-xs font-pixel hover:text-white transition-colors"
                >
                  Max
                </button>
                <button
                  onClick={handleClear}
                  className="text-white/60 text-xs font-pixel hover:text-white transition-colors"
                >
                  Clear
                </button>
              </div>

              {/* Continue Button */}
              <button
                disabled={!canContinue()}
                className="w-full py-3 bg-primary text-white font-pixel font-bold rounded-xl hover:bg-primary/90 disabled:bg-gray-400 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors border border-primary/30 text-sm"
              >
                Continue
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
