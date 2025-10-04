'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Wallet,
  Loader2,
  ChevronDown,
  Globe,
  DollarSign,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWallet } from '@/contexts/WalletContext'
import { getWalletIcon, getWalletDisplayName } from '@/lib/polkadot'

export default function WalletLoginPage() {
  const router = useRouter()
  const {
    connect,
    disconnect,
    isConnected,
    isConnecting,
    selectedAccount,
    accounts,
    selectAccount,
    installedWallets,
    error: walletError,
  } = useWallet()

  const [selectedCurrency, setSelectedCurrency] = useState('BRL')
  const [selectedLanguage, setSelectedLanguage] = useState('English')
  const [error, setError] = useState<string | null>(null)
  const [showAccountSelector, setShowAccountSelector] = useState(false)

  const currencies = ['BRL']
  const languages = ['English', 'Português', 'Español']

  // Show wallet error
  useEffect(() => {
    if (walletError) {
      setError(walletError)
    }
  }, [walletError])

  // Handle wallet connection
  const handleConnectWallet = async () => {
    setError(null)

    // Connect wallet
    const success = await connect()

    if (success) {
      // Store preferences
      localStorage.setItem('selectedCurrency', selectedCurrency)
      localStorage.setItem('selectedLanguage', selectedLanguage)

      // If multiple accounts, show selector
      if (accounts.length > 1) {
        setShowAccountSelector(true)
      } else {
        // Redirect to main app
        setTimeout(() => {
          router.push('/')
        }, 1000)
      }
    }
  }

  // Handle account selection
  const handleAccountSelect = (account: (typeof accounts)[0]) => {
    selectAccount(account)
    setShowAccountSelector(false)

    // Redirect to main app
    setTimeout(() => {
      router.push('/')
    }, 500)
  }

  // Check if user is already connected on page load
  useEffect(() => {
    if (isConnected && !isConnecting && !showAccountSelector) {
      router.push('/')
    }
  }, [isConnected, isConnecting, showAccountSelector, router])

  // Check for installed wallets
  const hasWalletExtension = installedWallets.some((w) => w.installed)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <main className="max-w-md w-full space-y-6">
        {/* Title */}
        <div className="text-center py-4">
          <h1 className="text-3xl font-pixel font-bold text-white mb-3">
            Access PolkaPay
          </h1>
          <p className="text-muted-foreground text-sm">
            {isConnected && selectedAccount
              ? 'Wallet connected successfully!'
              : 'Connect your Polkadot wallet to get started'}
          </p>
        </div>

        {/* No Wallet Warning */}
        {!hasWalletExtension && (
          <div className="p-4 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-yellow-500 text-sm font-pixel font-bold">
                  No Wallet Detected
                </p>
                <p className="text-yellow-500/80 text-xs">
                  Please install a Polkadot wallet extension:
                </p>
                <ul className="space-y-1 text-xs text-yellow-500/80">
                  <li>
                    •{' '}
                    <a
                      href="https://subwallet.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-yellow-500"
                    >
                      SubWallet
                    </a>{' '}
                    (Recommended)
                  </li>
                  <li>
                    •{' '}
                    <a
                      href="https://polkadot.js.org/extension/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-yellow-500"
                    >
                      Polkadot.js
                    </a>
                  </li>
                  <li>
                    •{' '}
                    <a
                      href="https://talisman.xyz/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-yellow-500"
                    >
                      Talisman
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Account Selector Modal */}
        {showAccountSelector && accounts.length > 1 && (
          <div className="p-4 bg-white/[0.03] border-2 border-primary/30 rounded-xl space-y-3">
            <h3 className="text-sm font-pixel font-bold text-white">
              Select Account
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {accounts.map((account) => (
                <button
                  key={account.address}
                  onClick={() => handleAccountSelect(account)}
                  className="w-full p-3 bg-white/[0.03] border border-white/10 rounded-lg hover:bg-white/[0.06] hover:border-primary/30 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-lg">
                      {getWalletIcon(account.meta.source || '')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm truncate">
                        {account.meta.name || 'Account'}
                      </div>
                      <div className="text-muted-foreground text-xs truncate">
                        {account.address.slice(0, 10)}...
                        {account.address.slice(-8)}
                      </div>
                      <div className="text-primary text-xs">
                        {getWalletDisplayName(account.meta.source || '')}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Wallet Connection Box */}
        <div className="space-y-3">
          <h2 className="text-sm font-pixel font-bold text-white">
            Polkadot Wallet
          </h2>
          <button
            onClick={handleConnectWallet}
            disabled={isConnecting || isConnected || !hasWalletExtension}
            className={`w-full p-5 rounded-xl border-2 transition-all duration-200 text-left ${
              isConnected && selectedAccount
                ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/30 cursor-default'
                : hasWalletExtension
                  ? 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-primary/30 active:scale-[0.98] cursor-pointer'
                  : 'bg-white/[0.03] border-white/[0.08] opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center border transition-all ${
                  isConnected
                    ? 'bg-primary/20 border-primary/40'
                    : 'bg-primary/10 border-primary/20'
                }`}
              >
                {isConnected && selectedAccount ? (
                  <span className="text-2xl">
                    {getWalletIcon(selectedAccount.meta.source || '')}
                  </span>
                ) : isConnecting ? (
                  <Loader2
                    className="h-6 w-6 text-primary animate-spin"
                    strokeWidth={2.5}
                  />
                ) : (
                  <Wallet className="h-6 w-6 text-primary" strokeWidth={2.5} />
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="text-white font-medium text-base mb-1">
                  {isConnected && selectedAccount
                    ? selectedAccount.meta.name || 'Connected'
                    : isConnecting
                      ? 'Connecting...'
                      : 'Polkadot Wallet'}
                </div>
                <div className="text-muted-foreground text-sm">
                  {isConnected && selectedAccount
                    ? `${selectedAccount.address.slice(0, 10)}...${selectedAccount.address.slice(-8)}`
                    : isConnecting
                      ? 'Please check your wallet extension'
                      : hasWalletExtension
                        ? 'Click to connect your wallet'
                        : 'No wallet extension detected'}
                </div>
              </div>
              {isConnected && (
                <div className="w-3 h-3 bg-primary rounded-full pixel-blink"></div>
              )}
            </div>
          </button>
        </div>

        {/* Settings */}
        <div className="space-y-3">
          <h2 className="text-sm font-pixel font-bold text-white">Settings</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* Currency Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-pixel text-muted-foreground">
                Currency
              </label>
              <div className="relative">
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="w-full pl-8 pr-8 py-3 bg-white/[0.03] border-2 border-white/[0.08] rounded-lg text-white appearance-none cursor-pointer hover:bg-white/[0.06] focus:border-primary/50 focus:outline-none transition-all"
                  disabled={isConnecting || isConnected}
                >
                  {currencies.map((currency) => (
                    <option
                      key={currency}
                      value={currency}
                      className="bg-card text-white"
                    >
                      {currency}
                    </option>
                  ))}
                </select>
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>
            </div>

            {/* Language Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-pixel text-muted-foreground">
                Language
              </label>
              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full pl-8 pr-8 py-3 bg-white/[0.03] border-2 border-white/[0.08] rounded-lg text-white appearance-none cursor-pointer hover:bg-white/[0.06] focus:border-primary/50 focus:outline-none transition-all"
                  disabled={isConnecting || isConnected}
                >
                  {languages.map((language) => (
                    <option
                      key={language}
                      value={language}
                      className="bg-card text-white"
                    >
                      {language}
                    </option>
                  ))}
                </select>
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm font-pixel">{error}</p>
          </div>
        )}

        {/* Terms */}
        <div className="text-center py-2">
          <p className="text-muted-foreground text-xs">
            By connecting your wallet, you agree to our{' '}
            <a
              href="#"
              className="text-primary hover:text-primary/80 underline"
            >
              Terms & Conditions
            </a>
          </p>
        </div>

        {/* Connect Button - Fallback */}
        {!isConnected && (
          <Button
            onClick={handleConnectWallet}
            disabled={isConnecting || !hasWalletExtension}
            className="w-full h-14 bg-white text-black font-pixel font-bold text-sm rounded-xl shadow-lg hover:bg-white/90 disabled:bg-gray-400 disabled:text-gray-600 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
          >
            {isConnecting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Connecting Wallet...
              </div>
            ) : !hasWalletExtension ? (
              'Install Wallet Extension'
            ) : (
              'Connect Polkadot Wallet'
            )}
          </Button>
        )}

        {/* Success State */}
        {isConnected && selectedAccount && (
          <div className="text-center p-4 bg-primary/10 border-2 border-primary/30 rounded-xl">
            <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-primary font-pixel text-sm">
              Connected! Redirecting...
            </p>
          </div>
        )}

        {/* Disconnect Button (only if connected) */}
        {isConnected && (
          <button
            onClick={disconnect}
            className="w-full text-center text-red-400 hover:text-red-300 text-sm font-pixel transition-colors"
          >
            Disconnect Wallet
          </button>
        )}
      </main>
    </div>
  )
}
