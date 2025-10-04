import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'

export interface WalletExtension {
  name: string
  displayName: string
  installed: boolean
  icon?: string
}

export const SUPPORTED_WALLETS = [
  {
    name: 'subwallet-js',
    displayName: 'SubWallet',
    icon: '🌊',
  },
  {
    name: 'polkadot-js',
    displayName: 'Polkadot.js',
    icon: '⚙️',
  },
  {
    name: 'talisman',
    displayName: 'Talisman',
    icon: '✨',
  },
]

/**
 * Check which wallet extensions are installed
 */
export async function checkInstalledWallets(): Promise<WalletExtension[]> {
  if (typeof window === 'undefined') return []

  const injectedWeb3 = (window as any).injectedWeb3 || {}
  
  return SUPPORTED_WALLETS.map(wallet => ({
    ...wallet,
    installed: !!injectedWeb3[wallet.name],
  }))
}

/**
 * Initialize connection with Polkadot extension
 */
export async function initializePolkadot(appName: string = 'DOT2PIX'): Promise<boolean> {
  if (typeof window === 'undefined') return false
  
  try {
    const { web3Enable } = await import('@polkadot/extension-dapp')
    const extensions = await web3Enable(appName)
    return extensions.length > 0
  } catch (error) {
    console.error('Error initializing Polkadot extension:', error)
    return false
  }
}

/**
 * Get all accounts from connected wallets
 */
export async function getAccounts(): Promise<InjectedAccountWithMeta[]> {
  if (typeof window === 'undefined') return []
  
  try {
    const { web3Accounts } = await import('@polkadot/extension-dapp')
    const accounts = await web3Accounts()
    return accounts
  } catch (error) {
    console.error('Error getting accounts:', error)
    return []
  }
}

/**
 * Get signer for a specific account
 */
export async function getSigner(address: string) {
  if (typeof window === 'undefined') return null
  
  try {
    const { web3FromAddress } = await import('@polkadot/extension-dapp')
    const injector = await web3FromAddress(address)
    return injector.signer
  } catch (error) {
    console.error('Error getting signer:', error)
    return null
  }
}

/**
 * Sign a message with the account
 */
export async function signMessage(address: string, message: string): Promise<string | null> {
  if (typeof window === 'undefined') return null
  
  try {
    const { web3FromAddress } = await import('@polkadot/extension-dapp')
    const injector = await web3FromAddress(address)
    
    if (!injector.signer.signRaw) {
      throw new Error('Signer does not support signRaw')
    }

    const signRaw = injector.signer.signRaw
    const { signature } = await signRaw({
      address,
      data: message,
      type: 'bytes',
    })

    return signature
  } catch (error) {
    console.error('Error signing message:', error)
    return null
  }
}

/**
 * Format wallet address for display
 */
export function formatAddress(address: string, length: number = 8): string {
  if (!address || address.length < length * 2) return address
  return `${address.slice(0, length)}...${address.slice(-length)}`
}

/**
 * Validate if address is valid Polkadot address
 */
export function isValidPolkadotAddress(address: string): boolean {
  try {
    // Basic validation - Polkadot addresses start with specific characters
    // and have specific length
    return address.length >= 47 && address.length <= 48
  } catch (error) {
    return false
  }
}

/**
 * Get wallet icon/logo based on source
 */
export function getWalletIcon(source: string): string {
  const wallet = SUPPORTED_WALLETS.find(w => 
    source.toLowerCase().includes(w.name.toLowerCase()) ||
    source.toLowerCase().includes(w.displayName.toLowerCase())
  )
  return wallet?.icon || '💼'
}

/**
 * Get wallet display name based on source
 */
export function getWalletDisplayName(source: string): string {
  const wallet = SUPPORTED_WALLETS.find(w => 
    source.toLowerCase().includes(w.name.toLowerCase())
  )
  return wallet?.displayName || source
}

