import { useState, useCallback, useEffect, useRef } from 'react'

export interface CoreUserData {
  user: {
    id: string
    email: string
    phone_number: string | null
    first_name: string
    last_name: string
    user_type: string
  }
  wallet?: {
    balance: string
    currency: string
    is_active?: boolean
  }
  profile?: {
    first_name?: string
    last_name?: string
    address?: string
    city?: string
    country?: string
    residence_country_code?: string | null
    residence_country_name?: string | null
    verification_status?: string
    is_email_verified?: boolean
    is_phone_verified?: boolean
    profile_picture_url?: string | null
  }
}

export interface CoreStatsData { [key: string]: any }
export interface CoreTransactionData {
  id: string
  transaction_type: string
  sender_name?: string
  receiver_name?: string
  amount: string
  fee?: string
  status?: string
  description?: string
  created_at: string
  display_type?: string
}

interface UseUserCoreDataOptions {
  role?: 'client' | 'agent' | 'enterprise'
  transactionsLimit?: number
  autoLoad?: boolean
}

interface UseUserCoreDataReturn {
  loading: boolean
  userData: CoreUserData | null
  transactions: CoreTransactionData[]
  stats: CoreStatsData | null
  error: string | null
  refreshAll: () => Promise<void>
  requestVerification: () => Promise<boolean>
}

export function formatTimeAgo(dateString: string) {
  const now = new Date()
  const date = new Date(dateString)
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  if (diffInMinutes < 1) return 'Kounye a'
  if (diffInMinutes < 60) return `${diffInMinutes} minit pase`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} è pase`
  return `${Math.floor(diffInMinutes / 1440)} jou pase`
}

export function useUserCoreData(opts: UseUserCoreDataOptions = {}): UseUserCoreDataReturn {
  const { role, transactionsLimit = 10, autoLoad = true } = opts
  const [loading, setLoading] = useState<boolean>(!!autoLoad)
  const [userData, setUserData] = useState<CoreUserData | null>(null)
  const [transactions, setTransactions] = useState<CoreTransactionData[]>([])
  const [stats, setStats] = useState<CoreStatsData | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Track in-flight refresh to avoid duplicate concurrent calls (especially with StrictMode double invoke of effects)
  const inFlightRef = useRef(false)
  const didInitialLoadRef = useRef(false)

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) throw new Error('No auth token')
    const res = await fetch('http://127.0.0.1:8000/api/auth/profile/', {
      headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' }
    })
    if (!res.ok) {
      if (res.status === 401) throw new Error('Unauthorized')
      throw new Error('Profile fetch failed')
    }
    const data = await res.json()
    // If a role enforced, redirect logic handled externally; here we just store.
    setUserData(data)
    return data
  }, [])

  const fetchTransactions = useCallback(async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) return
    // TODO: role-specific filtering later (e.g., /api/transactions/?scope=agent)
    const res = await fetch(`http://127.0.0.1:8000/api/transactions/?limit=${transactionsLimit}`, {
      headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' }
    })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) setTransactions(data)
    }
  }, [transactionsLimit])

  const fetchStats = useCallback(async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) return
    const res = await fetch('http://127.0.0.1:8000/api/transactions/stats/', {
      headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' }
    })
    if (res.ok) {
      const data = await res.json()
      setStats(data)
    }
  }, [])

  const requestVerification = useCallback(async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) return false
    try {
      const res = await fetch('http://127.0.0.1:8000/api/auth/request-verification/', {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' }
      })
      return res.ok
    } catch (e) {
      return false
    }
  }, [])

  const refreshAll = useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setLoading(true)
    setError(null)
    try {
      const profile = await fetchProfile()
      if (role && profile?.user?.user_type && profile.user.user_type !== role) {
        console.warn('Role mismatch: expected', role, 'got', profile.user.user_type)
      }
      await Promise.all([
        fetchTransactions(),
        fetchStats()
      ])
    } catch (e:any) {
      setError(e.message || 'Unknown error')
    } finally {
      inFlightRef.current = false
      setLoading(false)
    }
  }, [fetchProfile, fetchStats, fetchTransactions, role])

  // Auto-load on mount (effect instead of during render to avoid render-triggered state updates)
  useEffect(() => {
    if (autoLoad && !didInitialLoadRef.current) {
      didInitialLoadRef.current = true
      refreshAll()
    }
  }, [autoLoad, refreshAll])

  return { loading, userData, transactions, stats, error, refreshAll, requestVerification }
}
