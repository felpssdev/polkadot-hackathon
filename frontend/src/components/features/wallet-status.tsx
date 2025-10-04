'use client'

import { useState } from 'react'
import { Wallet, ChevronDown, LogOut, Copy, CheckCircle2 } from 'lucide-react'
import { useWallet } from '@/contexts/WalletContext'
import { getWalletIcon, getWalletDisplayName } from '@/lib/polkadot'

export function WalletStatus() {
  const {
    isConnected,
    selectedAccount,
    accounts,
    selectAccount,
    disconnect,
    getFormattedAddress,
  } = useWallet()

  const [showDropdown, setShowDropdown] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!isConnected || !selectedAccount) {
    return null
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedAccount.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAccountChange = (account: typeof accounts[0]) => {
    selectAccount(account)
    setShowDropdown(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg hover:bg-white/[0.06] transition-all"
      >
        <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-sm">
          {getWalletIcon(selectedAccount.meta.source || '')}
        </div>
        <span className="text-white text-sm font-medium hidden sm:inline">
          {getFormattedAddress(6)}
        </span>
        <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        <div className="w-2 h-2 bg-primary rounded-full pixel-blink" />
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-72 bg-card border-2 border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
            {/* Current Account */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-lg flex-shrink-0">
                  {getWalletIcon(selectedAccount.meta.source || '')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium text-sm mb-1">
                    {selectedAccount.meta.name || 'Account'}
                  </div>
                  <div className="text-muted-foreground text-xs mb-2 truncate">
                    {selectedAccount.address}
                  </div>
                  <div className="text-primary text-xs">
                    {getWalletDisplayName(selectedAccount.meta.source || '')}
                  </div>
                </div>
              </div>

              {/* Copy Address */}
              <button
                onClick={handleCopy}
                className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-lg transition-all"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 text-xs font-pixel">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-white/60" />
                    <span className="text-white/60 text-xs font-pixel">Copy Address</span>
                  </>
                )}
              </button>
            </div>

            {/* Other Accounts */}
            {accounts.length > 1 && (
              <div className="p-2 border-b border-white/10">
                <div className="text-xs text-muted-foreground font-pixel px-2 py-1 mb-1">
                  Switch Account
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {accounts.map((account) => {
                    if (account.address === selectedAccount.address) return null
                    
                    return (
                      <button
                        key={account.address}
                        onClick={() => handleAccountChange(account)}
                        className="w-full flex items-center gap-3 px-2 py-2 hover:bg-white/[0.06] rounded-lg transition-all text-left"
                      >
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm">
                          {getWalletIcon(account.meta.source || '')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm truncate">
                            {account.meta.name || 'Account'}
                          </div>
                          <div className="text-muted-foreground text-xs truncate">
                            {account.address.slice(0, 10)}...{account.address.slice(-8)}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Disconnect */}
            <div className="p-2">
              <button
                onClick={() => {
                  disconnect()
                  setShowDropdown(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-pixel">Disconnect</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

