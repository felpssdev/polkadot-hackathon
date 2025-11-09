'use client'

import { useState, useEffect, useCallback } from 'react'
import { ordersApi } from '../lib/api'

export interface Order {
  id: number
  order_type: 'buy' | 'sell'
  status: string
  dot_amount: number
  brl_amount: number
  usd_amount: number
  exchange_rate_dot_brl: number
  lp_fee_amount: number
  user_id: number
  lp_id: number | null
  pix_key: string | null
  pix_qr_code: string | null
  pix_txid: string | null
  blockchain_order_id: number | null
  blockchain_tx_hash: string | null
  created_at: string
  expires_at: string | null
}

export interface ExchangeRates {
  dot_to_usd: number
  dot_to_brl: number
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async (orderType?: 'buy' | 'sell') => {
    setLoading(true)
    setError(null)
    try {
      const data = await ordersApi.getActiveOrders(orderType)
      setOrders(data as Order[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    orders,
    loading,
    error,
    fetchOrders,
    refetch: fetchOrders,
  }
}

export function useExchangeRates() {
  const [rates, setRates] = useState<ExchangeRates | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRates = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await ordersApi.getExchangeRates()
      setRates(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRates()
    // Refresh rates every 30 seconds
    const interval = setInterval(fetchRates, 30000)
    return () => clearInterval(interval)
  }, [fetchRates])

  return {
    rates,
    loading,
    error,
    refetch: fetchRates,
  }
}

export function useCreateOrder() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createOrder = useCallback(
    async (orderData: {
      order_type: 'buy' | 'sell'
      dot_amount: number
      pix_key?: string
    }) => {
      setLoading(true)
      setError(null)
      try {
        const data = await ordersApi.createOrder(orderData)
        return data
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create order'
        setError(errorMessage)
        throw new Error(errorMessage)
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  return {
    createOrder,
    loading,
    error,
  }
}
