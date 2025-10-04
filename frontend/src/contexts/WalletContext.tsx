'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'
import {
  initializePolkadot,
  getAccounts,
  signMessage,
  formatAddress,
  checkInstalledWallets,
  type WalletExtension,
} from '@/lib/polkadot'

interface WalletContextType {
  // State
  isConnected: boolean
  isConnecting: boolean
  accounts: InjectedAccountWithMeta[]
  selectedAccount: InjectedAccountWithMeta | null
  installedWallets: WalletExtension[]
  error: string | null

  // Actions
  connect: () => Promise<boolean>
  disconnect: () => void
  selectAccount: (account: InjectedAccountWithMeta) => void
  sign: (message: string) => Promise<string | null>
  
  // Utils
  getFormattedAddress: (length?: number) => string
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([])
  const [selectedAccount, setSelectedAccount] = useState<InjectedAccountWithMeta | null>(null)
  const [installedWallets, setInstalledWallets] = useState<WalletExtension[]>([])
  const [error, setError] = useState<string | null>(null)

  // Check installed wallets on mount
  useEffect(() => {
    const checkWallets = async () => {
      const wallets = await checkInstalledWallets()
      setInstalledWallets(wallets)
    }
    
    checkWallets()
  }, [])

  // Load saved connection on mount
  useEffect(() => {
    const loadSavedConnection = async () => {
      if (typeof window === 'undefined') return

      const savedAddress = localStorage.getItem('selectedWalletAddress')
      const walletConnected = localStorage.getItem('walletConnected')

      if (walletConnected === 'true' && savedAddress) {
        // Try to reconnect
        const success = await connect()
        if (success && savedAddress) {
          const allAccounts = await getAccounts()
          const account = allAccounts.find(acc => acc.address === savedAddress)
          if (account) {
            setSelectedAccount(account)
          }
        }
      }
    }

    loadSavedConnection()
  }, [])

  const connect = useCallback(async (): Promise<boolean> => {
    setIsConnecting(true)
    setError(null)

    try {
      // Initialize Polkadot extension
      const initialized = await initializePolkadot('PolkaPay')
      
      if (!initialized) {
        setError('No Polkadot wallet extension found. Please install SubWallet, Polkadot.js, or Talisman.')
        setIsConnecting(false)
        return false
      }

      // Get accounts
      const allAccounts = await getAccounts()
      
      if (allAccounts.length === 0) {
        setError('No accounts found. Please create an account in your wallet extension.')
        setIsConnecting(false)
        return false
      }

      setAccounts(allAccounts)
      
      // Auto-select first account if none selected
      if (!selectedAccount) {
        setSelectedAccount(allAccounts[0])
        localStorage.setItem('selectedWalletAddress', allAccounts[0].address)
      }

      setIsConnected(true)
      localStorage.setItem('walletConnected', 'true')
      setIsConnecting(false)
      
      return true
    } catch (err) {
      console.error('Error connecting wallet:', err)
      setError('Failed to connect wallet. Please try again.')
      setIsConnecting(false)
      return false
    }
  }, [selectedAccount])

  const disconnect = useCallback(() => {
    setIsConnected(false)
    setSelectedAccount(null)
    setAccounts([])
    localStorage.removeItem('walletConnected')
    localStorage.removeItem('selectedWalletAddress')
    localStorage.removeItem('userEmail')
  }, [])

  const selectAccount = useCallback((account: InjectedAccountWithMeta) => {
    setSelectedAccount(account)
    localStorage.setItem('selectedWalletAddress', account.address)
  }, [])

  const sign = useCallback(async (message: string): Promise<string | null> => {
    if (!selectedAccount) {
      setError('No account selected')
      return null
    }

    try {
      const signature = await signMessage(selectedAccount.address, message)
      return signature
    } catch (err) {
      console.error('Error signing message:', err)
      setError('Failed to sign message')
      return null
    }
  }, [selectedAccount])

  const getFormattedAddress = useCallback((length: number = 8): string => {
    if (!selectedAccount) return ''
    return formatAddress(selectedAccount.address, length)
  }, [selectedAccount])

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        isConnecting,
        accounts,
        selectedAccount,
        installedWallets,
        error,
        connect,
        disconnect,
        selectAccount,
        sign,
        getFormattedAddress,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

