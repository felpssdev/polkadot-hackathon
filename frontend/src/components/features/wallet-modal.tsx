'use client'

import {
  X,
  Copy,
  Send,
  ArrowDownToLine,
  Plus,
  ChevronRight,
  Menu,
  Clock,
  Wallet,
  LogOut,
} from 'lucide-react'

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
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
      <div className="relative w-full max-w-sm bg-card rounded-2xl border-2 border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          {/* Account Info */}
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-white font-pixel text-xl font-bold">
                  P
                </span>
              </div>
              {/* Google Overlay */}
              <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-white rounded-full flex items-center justify-center border-2 border-card">
                <span className="text-blue-500 font-bold text-xs">G</span>
              </div>
            </div>

            {/* Wallet Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-white font-pixel text-sm font-bold">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
                <button
                  onClick={handleCopyAddress}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Copy address"
                >
                  <Copy className="w-4 h-4 text-white/60" />
                </button>
              </div>
              <p className="text-white/60 text-xs font-pixel mt-1">
                Smart Account
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-3 gap-3">
            <button className="flex flex-col items-center gap-2 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/10">
              <Send className="w-5 h-5 text-white" />
              <span className="text-white text-xs font-pixel">Send</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/10">
              <ArrowDownToLine className="w-5 h-5 text-white" />
              <span className="text-white text-xs font-pixel">Receive</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/10">
              <Plus className="w-5 h-5 text-white" />
              <span className="text-white text-xs font-pixel">Buy</span>
            </button>
          </div>
        </div>

        {/* Network/Balance Section */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-3">
              {/* Polkadot Network Icon */}
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                <div className="w-4 h-4 rounded-full bg-primary"></div>
              </div>
              <div>
                <p className="text-white font-pixel text-sm font-bold">
                  Polkadot
                </p>
                <p className="text-white/60 text-xs font-pixel">0 DOT</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/40" />
          </div>
        </div>

        {/* Menu Items */}
        <div className="px-6 pb-4 space-y-1">
          <button className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors">
            <Menu className="w-5 h-5 text-white/60" />
            <span className="text-white font-pixel text-sm">Transactions</span>
          </button>
          <button className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors">
            <Clock className="w-5 h-5 text-white/60" />
            <span className="text-white font-pixel text-sm">View Assets</span>
          </button>
          <button className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors">
            <Wallet className="w-5 h-5 text-white/60" />
            <span className="text-white font-pixel text-sm">Manage Wallet</span>
          </button>
        </div>

        {/* Disconnect Button */}
        <div className="px-6 pb-6">
          <button className="w-full flex items-center gap-3 p-3 hover:bg-red-500/10 rounded-xl transition-colors border-t border-white/10 pt-4">
            <LogOut className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-pixel text-sm">
              Disconnect Wallet
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
