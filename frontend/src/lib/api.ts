/**
 * API Client for PolkaPay Backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

interface RequestOptions extends RequestInit {
  token?: string
}

/**
 * Base fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: 'An error occurred',
    }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * Authentication API
 */
export const authApi = {
  /**
   * Login with wallet signature
   */
  loginWithWallet: async (
    walletAddress: string,
    message: string,
    signature: string
  ) => {
    return apiFetch('/auth/wallet', {
      method: 'POST',
      body: JSON.stringify({
        wallet_address: walletAddress,
        message,
        signature,
      }),
    })
  },

  /**
   * Get current user profile
   */
  getProfile: async (token: string) => {
    return apiFetch('/auth/me', {
      method: 'GET',
      token,
    })
  },
}

/**
 * Orders API
 */
export const ordersApi = {
  /**
   * Get exchange rates (DOT/BRL, DOT/USD)
   */
  getExchangeRates: async () => {
    return apiFetch<{
      dot_to_usd: number
      dot_to_brl: number
    }>('/orders/rates/exchange')
  },

  /**
   * Create new order
   */
  createOrder: async (orderData: {
    order_type: 'buy' | 'sell'
    dot_amount: number
    pix_key?: string
  }) => {
    return apiFetch('/orders/', {
      method: 'POST',
      body: JSON.stringify(orderData),
    })
  },

  /**
   * Get all active orders
   */
  getActiveOrders: async (orderType?: 'buy' | 'sell') => {
    const params = orderType ? `?order_type=${orderType}` : ''
    return apiFetch(`/orders/${params}`)
  },

  /**
   * Get my orders
   */
  getMyOrders: async (token?: string) => {
    return apiFetch('/orders/my-orders', {
      method: 'GET',
      token,
    })
  },

  /**
   * Get order by ID
   */
  getOrder: async (orderId: number) => {
    return apiFetch(`/orders/${orderId}`)
  },

  /**
   * Accept order (LP)
   */
  acceptOrder: async (orderId: number, token: string) => {
    return apiFetch(`/orders/${orderId}/accept`, {
      method: 'POST',
      token,
    })
  },

  /**
   * Confirm PIX payment sent
   */
  confirmPayment: async (
    orderId: number,
    pixTxId: string,
    paymentProof?: string
  ) => {
    return apiFetch(`/orders/${orderId}/confirm-payment`, {
      method: 'POST',
      body: JSON.stringify({
        pix_txid: pixTxId,
        payment_proof: paymentProof,
      }),
    })
  },

  /**
   * Complete order
   */
  completeOrder: async (orderId: number, token: string) => {
    return apiFetch(`/orders/${orderId}/complete`, {
      method: 'POST',
      token,
    })
  },
}

/**
 * Liquidity Provider API
 */
export const lpApi = {
  /**
   * Register as Liquidity Provider
   */
  register: async (pixKey: string, pixKeyType: string, token: string) => {
    return apiFetch('/lp/register', {
      method: 'POST',
      body: JSON.stringify({
        pix_key: pixKey,
        pix_key_type: pixKeyType,
      }),
      token,
    })
  },

  /**
   * Get LP profile
   */
  getProfile: async (token: string) => {
    return apiFetch('/lp/profile', {
      method: 'GET',
      token,
    })
  },

  /**
   * Get available orders for LP
   */
  getAvailableOrders: async (token: string) => {
    return apiFetch('/lp/available-orders', {
      method: 'GET',
      token,
    })
  },

  /**
   * Get LP's processed orders
   */
  getMyOrders: async (token: string) => {
    return apiFetch('/lp/my-orders', {
      method: 'GET',
      token,
    })
  },

  /**
   * Update LP availability
   */
  updateAvailability: async (isAvailable: boolean, token: string) => {
    return apiFetch(`/lp/availability?is_available=${isAvailable}`, {
      method: 'PUT',
      token,
    })
  },

  /**
   * Get LP earnings
   */
  getEarnings: async (token: string) => {
    return apiFetch('/lp/earnings', {
      method: 'GET',
      token,
    })
  },
}

export default {
  auth: authApi,
  orders: ordersApi,
  lp: lpApi,
}

