// Mock data for realistic application behavior

export interface Transaction {
  id: string
  type: 'buy' | 'sell' | 'deposit' | 'withdraw' | 'transfer'
  amount: number
  currency: 'DOT' | 'BRL'
  status: 'completed' | 'pending' | 'failed'
  timestamp: Date
  description: string
  hash?: string
}

export interface SocialVerification {
  platform: 'twitter' | 'discord' | 'telegram' | 'github'
  verified: boolean
  username?: string
  verificationDate?: Date
}

export interface UserLimits {
  buyLimit: number
  sellLimit: number
  dailyLimit: number
  monthlyLimit: number
  verified: boolean
  verificationLevel: 'basic' | 'enhanced' | 'premium'
}

export interface WalletBalance {
  dot: number
  brl: number
  usd: number
  lastUpdated: Date
}

// Mock transaction history
export const mockTransactions: Transaction[] = [
  {
    id: 'tx_001',
    type: 'deposit',
    amount: 50.0,
    currency: 'DOT',
    status: 'completed',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    description: 'Deposit from external wallet',
    hash: '0x1234...abcd',
  },
  {
    id: 'tx_002',
    type: 'buy',
    amount: 25.0,
    currency: 'DOT',
    status: 'completed',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    description: 'Buy DOT with BRL',
    hash: '0x5678...efgh',
  },
  {
    id: 'tx_003',
    type: 'sell',
    amount: 10.0,
    currency: 'DOT',
    status: 'completed',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    description: 'Sell DOT for BRL',
    hash: '0x9abc...ijkl',
  },
  {
    id: 'tx_004',
    type: 'transfer',
    amount: 5.0,
    currency: 'DOT',
    status: 'pending',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    description: 'Transfer to friend',
    hash: '0xdef0...mnop',
  },
  {
    id: 'tx_005',
    type: 'withdraw',
    amount: 15.0,
    currency: 'DOT',
    status: 'failed',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    description: 'Withdraw to external wallet',
    hash: '0x1234...qrst',
  },
]

// Mock social verifications
export const mockSocialVerifications: SocialVerification[] = [
  {
    platform: 'twitter',
    verified: true,
    username: '@p2puser',
    verificationDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    platform: 'discord',
    verified: true,
    username: 'p2puser#1234',
    verificationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    platform: 'telegram',
    verified: false,
    username: '@p2puser',
  },
  {
    platform: 'github',
    verified: false,
  },
]

// Mock user limits based on verification status
export const mockUserLimits: UserLimits = {
  buyLimit: 100, // DOT
  sellLimit: 500, // DOT
  dailyLimit: 1000, // DOT
  monthlyLimit: 10000, // DOT
  verified: true,
  verificationLevel: 'enhanced',
}

// Mock wallet balance
export const mockWalletBalance: WalletBalance = {
  dot: 75.5,
  brl: 402.15,
  usd: 78.3,
  lastUpdated: new Date(),
}

// Mock DOT to BRL exchange rate
export const mockExchangeRate = 5.33

// Helper functions
export const getTransactionHistory = (limit?: number): Transaction[] => {
  return limit ? mockTransactions.slice(0, limit) : mockTransactions
}

export const getVerifiedSocials = (): SocialVerification[] => {
  return mockSocialVerifications.filter((social) => social.verified)
}

export const getUnverifiedSocials = (): SocialVerification[] => {
  return mockSocialVerifications.filter((social) => !social.verified)
}

export const getVerificationProgress = (): number => {
  const verified = mockSocialVerifications.filter(
    (social) => social.verified,
  ).length
  return (verified / mockSocialVerifications.length) * 100
}

export const formatCurrency = (
  amount: number,
  currency: 'DOT' | 'BRL' | 'USD',
): string => {
  switch (currency) {
    case 'BRL':
      return `R$ ${amount.toFixed(2)}`
    case 'USD':
      return `$${amount.toFixed(2)}`
    case 'DOT':
      return `${amount.toFixed(2)} DOT`
    default:
      return amount.toString()
  }
}

export const formatTransactionDate = (date: Date): string => {
  const now = new Date()
  const diffInHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60),
  )

  if (diffInHours < 1) {
    return 'Just now'
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`
  } else {
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }
}
