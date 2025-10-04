'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Wallet,
  Loader2,
  Mail,
  ChevronDown,
  Globe,
  DollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function WalletLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [selectedCurrency, setSelectedCurrency] = useState('BRL')
  const [selectedLanguage, setSelectedLanguage] = useState('English')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isEmailValid, setIsEmailValid] = useState(false)
  const [isWalletSelected, setIsWalletSelected] = useState(false)

  const currencies = ['BRL']
  const languages = ['English', 'Português', 'Español']

  // Check if Polkadot.js extension is available
  // const isPolkadotJsAvailable =
  //   typeof window !== 'undefined' && (window as any).injectedWeb3

  // Simulate Polkadot wallet connection
  const handleConnectWallet = async () => {
    if (!email) {
      setError('Please enter your email')
      return
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email')
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      // Simulate wallet connection delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Generate a mock wallet address for demo
      const mockAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
      setWalletAddress(mockAddress)

      setIsConnecting(false)
      setIsConnected(true)

      // Store connection state in localStorage
      localStorage.setItem('walletConnected', 'true')
      localStorage.setItem('userEmail', email)
      localStorage.setItem('walletAddress', mockAddress)
      localStorage.setItem('selectedCurrency', selectedCurrency)
      localStorage.setItem('selectedLanguage', selectedLanguage)

      // Redirect to main app after successful connection
      setTimeout(() => {
        router.push('/')
      }, 1000)
    } catch {
      setError('Error connecting wallet. Please try again.')
      setIsConnecting(false)
    }
  }

  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Real-time email validation
  useEffect(() => {
    setIsEmailValid(validateEmail(email))
    if (error && email && validateEmail(email)) {
      setError(null)
    }
  }, [email, error])

  // Handle wallet selection
  const handleWalletSelection = () => {
    if (isConnecting || isConnected) return

    setIsWalletSelected(!isWalletSelected)
    setError(null)
  }

  // Check if user is already connected on page load
  useEffect(() => {
    const isAlreadyConnected = localStorage.getItem('walletConnected')
    if (isAlreadyConnected === 'true') {
      // User is already connected, redirect to main app
      router.push('/')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <main className="max-w-md w-full space-y-5 py-4 px-5">
        {/* Title */}
        <div className="text-center py-4">
          <h1 className="text-2xl font-pixel font-bold text-white mb-2">
            Access P2P.ME
          </h1>
          <p className="text-muted-foreground text-sm">
            {isConnected
              ? 'Connection successful!'
              : 'Connect your Polkadot wallet to get started'}
          </p>
        </div>

        {/* Email Input */}
        <div className="space-y-2">
          <label className="text-sm font-pixel font-bold text-white">
            Email
          </label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className={`w-full p-4 pl-12 rounded-xl bg-white/[0.03] border-2 text-white placeholder:text-muted-foreground focus:outline-none transition-all ${
                email && !isEmailValid
                  ? 'border-red-500/50 focus:border-red-500/70'
                  : email && isEmailValid
                    ? 'border-green-500/50 focus:border-green-500/70'
                    : 'border-white/[0.08] focus:border-primary/50'
              }`}
              disabled={isConnecting || isConnected}
            />
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            {email && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                {isEmailValid ? (
                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                ) : (
                  <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            )}
          </div>
          {email && !isEmailValid && (
            <p className="text-red-400 text-xs font-pixel">
              Please enter a valid email
            </p>
          )}
        </div>

        {/* Wallet Selection */}
        <div className="space-y-3">
          <h2 className="text-sm font-pixel font-bold text-white">
            Polkadot Wallet
          </h2>
          <button
            onClick={handleWalletSelection}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 group ${
              isConnected
                ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/30'
                : isWalletSelected
                  ? 'bg-green-500/10 border-green-500/50 hover:bg-green-500/15'
                  : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-primary/30 active:scale-[0.98]'
            }`}
            disabled={isConnecting || isConnected}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all ${
                  isConnected
                    ? 'bg-primary/20 border-primary/40'
                    : isWalletSelected
                      ? 'bg-green-500/20 border-green-500/40'
                      : 'bg-primary/10 border-primary/20 group-hover:bg-primary/15'
                }`}
              >
                <Wallet
                  className={`h-5 w-5 transition-colors ${
                    isConnected
                      ? 'text-primary'
                      : isWalletSelected
                        ? 'text-green-500'
                        : 'text-primary'
                  }`}
                  strokeWidth={2.5}
                />
              </div>
              <div className="flex-1 text-left">
                <div className="text-white font-medium">Polkadot.js</div>
                <div className="text-muted-foreground text-xs">
                  {isConnected && walletAddress
                    ? `Connected: ${walletAddress.slice(0, 10)}...`
                    : isWalletSelected
                      ? 'Wallet selected - Ready to connect'
                      : 'Click to select wallet'}
                </div>
              </div>
              {isConnected && (
                <div className="w-4 h-4 bg-primary rounded-full pixel-blink"></div>
              )}
              {isWalletSelected && !isConnected && (
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Currency and Language Selection */}
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
        <div className="text-center py-4">
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

        {/* Connect Button */}
        <Button
          onClick={handleConnectWallet}
          disabled={
            !isEmailValid || !isWalletSelected || isConnecting || isConnected
          }
          className="w-full h-12 bg-white text-black font-pixel font-bold text-xs rounded-xl shadow-lg hover:bg-white/90 disabled:bg-gray-400 disabled:text-gray-600 disabled:cursor-not-allowed transition-all duration-200 btn-8bit border-2 border-white/30"
        >
          {isConnecting ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Connecting...
            </div>
          ) : isConnected ? (
            'Connected! Redirecting...'
          ) : !email ? (
            'Enter your email'
          ) : !isEmailValid ? (
            'Invalid email'
          ) : !isWalletSelected ? (
            'Select wallet'
          ) : (
            'Connect Polkadot Wallet'
          )}
        </Button>
      </main>
    </div>
  )
}
