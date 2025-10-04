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
  const transactionLimit = 0 // USDC
  const currentPrice = 5.33 // BRL per DOT
  const maxLimit = 1000 // Max transaction limit

  const handleNumberPress = (number: string) => {
    if (number === '.') {
      if (!amount.includes('.')) {
        setAmount(amount + '.')
      }
    } else if (number === 'backspace') {
      setAmount(amount.slice(0, -1))
    } else {
      setAmount(amount + number)
    }
  }

  const handleMax = () => {
    setAmount(maxLimit.toString())
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
      <div className="relative w-full max-w-md bg-card rounded-2xl border-2 border-white/10 shadow-2xl max-h-[90vh] overflow-hidden">
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
                  <p className="text-white font-pixel font-bold">Comprar DOT</p>
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
            <div className="px-6 pb-6 text-center">
              <div className="text-4xl font-pixel font-bold text-white mb-2">
                {amount || '0'} DOT
              </div>
              <div className="flex items-center justify-center gap-2 text-white/60">
                <div className="w-4 h-4 border-t-2 border-b-2 border-white/40"></div>
                <span className="text-sm font-pixel">{calculateBRL()} BRL</span>
              </div>
            </div>

            {/* Transaction Limit Warning */}
            <div className="px-6 pb-6">
              <div className="p-4 bg-white/5 rounded-xl border border-primary/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="text-white font-pixel text-sm">
                      Your Transaction Limit: {transactionLimit} DOT
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/40" />
                </div>
                <p className="text-white/60 text-xs mb-4">
                  Increase your transaction limits by ZK-verifying your socials.
                </p>
                <button className="w-full py-2 bg-primary text-white font-pixel font-bold text-xs rounded-lg hover:bg-primary/90 transition-colors">
                  Increase Limit
                </button>
              </div>
            </div>

            {/* Numeric Keyboard */}
            <div className="px-6 pb-4">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {/* Row 1 */}
                <button
                  onClick={() => handleNumberPress('1')}
                  className="aspect-square bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center text-white font-pixel text-xl"
                >
                  1
                </button>
                <button
                  onClick={() => handleNumberPress('2')}
                  className="aspect-square bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center text-white font-pixel text-xl"
                >
                  2
                </button>
                <button
                  onClick={() => handleNumberPress('3')}
                  className="aspect-square bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center text-white font-pixel text-xl"
                >
                  3
                </button>

                {/* Row 2 */}
                <button
                  onClick={() => handleNumberPress('4')}
                  className="aspect-square bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center text-white font-pixel text-xl"
                >
                  4
                </button>
                <button
                  onClick={() => handleNumberPress('5')}
                  className="aspect-square bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center text-white font-pixel text-xl"
                >
                  5
                </button>
                <button
                  onClick={() => handleNumberPress('6')}
                  className="aspect-square bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center text-white font-pixel text-xl"
                >
                  6
                </button>

                {/* Row 3 */}
                <button
                  onClick={() => handleNumberPress('7')}
                  className="aspect-square bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center text-white font-pixel text-xl"
                >
                  7
                </button>
                <button
                  onClick={() => handleNumberPress('8')}
                  className="aspect-square bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center text-white font-pixel text-xl"
                >
                  8
                </button>
                <button
                  onClick={() => handleNumberPress('9')}
                  className="aspect-square bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center text-white font-pixel text-xl"
                >
                  9
                </button>

                {/* Row 4 */}
                <button
                  onClick={() => handleNumberPress('.')}
                  className="aspect-square bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center text-white font-pixel text-xl"
                >
                  .
                </button>
                <button
                  onClick={() => handleNumberPress('0')}
                  className="aspect-square bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center text-white font-pixel text-xl"
                >
                  0
                </button>
                <button
                  onClick={() => handleNumberPress('backspace')}
                  className="aspect-square bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center text-white font-pixel text-xl"
                >
                  ⌫
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between mb-4">
                <button
                  onClick={handleMax}
                  className="text-white/60 text-sm font-pixel hover:text-white transition-colors"
                >
                  Max
                </button>
                <button
                  onClick={handleClear}
                  className="text-white/60 text-sm font-pixel hover:text-white transition-colors"
                >
                  Clear
                </button>
              </div>

              {/* Continue Button */}
              <button
                disabled={!canContinue()}
                className="w-full py-4 bg-primary text-white font-pixel font-bold rounded-xl hover:bg-primary/90 disabled:bg-gray-400 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors border border-primary/30"
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
