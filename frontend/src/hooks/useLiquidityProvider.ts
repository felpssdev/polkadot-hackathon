'use client'

import { useState, useCallback } from 'react'
import { lpApi } from '../lib/api'

export interface LiquidityProvider {
  id: number
  pix_key: string
  pix_key_type: string
  total_orders_processed: number
  total_volume_usd: number
  total_earnings_usd: number
  rating: number
  is_active: boolean
  is_available: boolean
  created_at: string
}

export interface LPEarnings {
  total_orders: number
  total_volume_usd: number
  total_earnings_usd: number
  rating: number
}

export function useLiquidityProvider(token?: string) {
  const [profile, setProfile] = useState<LiquidityProvider | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!token) return

    setLoading(true)
    setError(null)
    try {
      const data = await lpApi.getProfile(token)
      setProfile(data as LiquidityProvider)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch LP profile',
      )
    } finally {
      setLoading(false)
    }
  }, [token])

  const register = useCallback(
    async (pixKey: string, pixKeyType: string) => {
      if (!token) throw new Error('Authentication required')

      setLoading(true)
      setError(null)
      try {
        const data = await lpApi.register(pixKey, pixKeyType, token)
        setProfile(data as LiquidityProvider)
        return data
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to register as LP'
        setError(errorMessage)
        throw new Error(errorMessage)
      } finally {
        setLoading(false)
      }
    },
    [token],
  )

  const updateAvailability = useCallback(
    async (isAvailable: boolean) => {
      if (!token) throw new Error('Authentication required')

      try {
        await lpApi.updateAvailability(isAvailable, token)
        setProfile((prev) =>
          prev ? { ...prev, is_available: isAvailable } : null,
        )
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : 'Failed to update availability',
        )
      }
    },
    [token],
  )

  return {
    profile,
    loading,
    error,
    fetchProfile,
    register,
    updateAvailability,
  }
}

export function useLPEarnings(token?: string) {
  const [earnings, setEarnings] = useState<LPEarnings | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEarnings = useCallback(async () => {
    if (!token) return

    setLoading(true)
    setError(null)
    try {
      const data = await lpApi.getEarnings(token)
      setEarnings(data as LPEarnings)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch earnings')
    } finally {
      setLoading(false)
    }
  }, [token])

  return {
    earnings,
    loading,
    error,
    fetchEarnings,
  }
}
