'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface WalletAuthProps {
  children: React.ReactNode
}

export function WalletAuth({ children }: WalletAuthProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is on wallet page - no need to redirect
    if (pathname === '/wallet') {
      setIsLoading(false)
      return
    }

    // Check wallet connection status
    const checkWalletConnection = () => {
      const walletConnected = localStorage.getItem('walletConnected')

      if (walletConnected === 'true') {
        setIsLoading(false)
      } else {
        // User not connected, redirect to wallet login
        router.push('/wallet')
      }
    }

    // Add small delay to prevent flash
    const timer = setTimeout(checkWalletConnection, 100)

    return () => clearTimeout(timer)
  }, [router, pathname])

  // Show children if not loading
  if (!isLoading) {
    return <>{children}</>
  }

  // Show nothing while loading (prevents flash)
  return null
}
