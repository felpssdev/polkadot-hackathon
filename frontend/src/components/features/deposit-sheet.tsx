'use client'

import { useState } from 'react'
import { X, DollarSign, ArrowLeft, Copy, QrCode } from 'lucide-react'

interface DepositSheetProps {
  isOpen: boolean
  onClose: () => void
}

export function DepositSheet({ isOpen, onClose }: DepositSheetProps) {
  const [showQRCode, setShowQRCode] = useState(false)
  const walletAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress)
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
        {!showQRCode ? (
          /* Deposit Options */
          <>
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-pixel font-bold text-white">
                  Deposit
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
              <p className="text-white/60 text-sm mt-2">
                Receive funds to your P2P.me wallet.
              </p>
            </div>

            {/* Deposit Options */}
            <div className="px-6 pb-6">
              {/* Polkadot/DOT Option */}
              <button
                onClick={() => setShowQRCode(true)}
                className="w-full flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-pixel font-bold">
                    Depositar Polkadot/DOT
                  </p>
                  <p className="text-white/60 text-sm">
                    Deposit DOT to your P2P.me wallet
                  </p>
                </div>
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                  <div className="w-2 h-2 border-r-2 border-b-2 border-white/60 rotate-[-45deg]"></div>
                </div>
              </button>
            </div>
          </>
        ) : (
          /* QR Code Section */
          <>
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowQRCode(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-white/60" />
                </button>
                <h2 className="text-2xl font-pixel font-bold text-white">
                  Deposit DOT
                </h2>
              </div>
            </div>

            {/* Warning Banner */}
            <div className="px-6 pb-4">
              <div className="flex items-center gap-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <p className="text-orange-400 text-sm font-pixel">
                  This address is for receiving DOT on the Polkadot network
                  only.
                </p>
              </div>
            </div>

            {/* QR Code */}
            <div className="px-6 pb-4">
              <div className="w-full max-w-xs mx-auto p-4 bg-white rounded-2xl">
                <div className="w-full aspect-square bg-black rounded-xl flex items-center justify-center">
                  <QrCode className="w-32 h-32 text-white" />
                </div>
              </div>
            </div>

            {/* Wallet Address */}
            <div className="px-6 pb-6">
              <p className="text-white/60 text-sm font-pixel mb-2">
                Your Polkadot Address
              </p>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-white font-pixel text-sm flex-1">
                  {walletAddress.slice(0, 12)}...{walletAddress.slice(-8)}
                </span>
                <button
                  onClick={handleCopyAddress}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4 text-white/60" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Close Button */}
        <div className="px-6 pb-6">
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
