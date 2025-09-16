import { useState, useEffect, useMemo } from 'react'

interface UseDebounceProps<T> {
  value: T
  delay: number
}

export function useDebounce<T>({ value, delay }: UseDebounceProps<T>): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  date_joined: string
  user_type: string
  profile?: {
    phone?: string
    kyc_status?: string
  }
  phone_number?: string
  wallet?: {
    balance?: string | number
  }
}

interface UseFilteredUsersProps {
  users: User[]
  searchQuery: string
  filterStatus: string
  filterDateCreated: string
  filterKYCStatus: string
  dateCreatedStart: string
  dateCreatedEnd: string
  sortBy: string
  sortDir: string
}

export function useFilteredUsers({
  users,
  searchQuery,
  filterStatus,
  filterDateCreated,
  filterKYCStatus,
  dateCreatedStart,
  dateCreatedEnd,
  sortBy,
  sortDir
}: UseFilteredUsersProps) {
  // Debounce search query to avoid excessive filtering
  const debouncedSearchQuery = useDebounce({ value: searchQuery, delay: 300 })

  const filteredAndSortedUsers = useMemo(() => {
    const normalizedQuery = (debouncedSearchQuery || '').trim().toLowerCase()
    const clientUsers = (users || []).filter((u: User) => u.user_type === 'client')
    
    // Filter users
    const filteredUsers = clientUsers.filter((u: User) => {
      // Search filter
      const matchesSearch = !normalizedQuery || [
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u?.profile?.phone,
        u.phone_number
      ].some((v: any) => (v ?? '').toString().toLowerCase().includes(normalizedQuery))
      
      // Status filter
      const matchesStatus = filterStatus === 'all' ? true : (filterStatus === 'active' ? u.is_active : !u.is_active)
      
      // Date created filter
      let matchesDateCreated = true
      if (filterDateCreated !== 'all') {
        const userCreatedDate = u.date_joined ? new Date(u.date_joined) : null
        const now = new Date()
        
        if (userCreatedDate) {
          switch (filterDateCreated) {
            case 'today':
              matchesDateCreated = userCreatedDate.toDateString() === now.toDateString()
              break
            case 'week':
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
              matchesDateCreated = userCreatedDate >= weekAgo
              break
            case 'month':
              const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
              matchesDateCreated = userCreatedDate >= monthAgo
              break
            case 'year':
              const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
              matchesDateCreated = userCreatedDate >= yearAgo
              break
            case 'custom':
              const startDate = dateCreatedStart ? new Date(dateCreatedStart) : null
              const endDate = dateCreatedEnd ? new Date(dateCreatedEnd) : null
              if (endDate) endDate.setHours(23, 59, 59, 999)
              
              matchesDateCreated = (!startDate || userCreatedDate >= startDate) && 
                                 (!endDate || userCreatedDate <= endDate)
              break
          }
        } else {
          matchesDateCreated = false
        }
      }
      
      // KYC Status filter
      let matchesKYC = true
      if (filterKYCStatus !== 'all') {
        const kycStatus = u?.profile?.kyc_status || 'pending'
        matchesKYC = kycStatus === filterKYCStatus
      }
      
      return matchesSearch && matchesStatus && matchesDateCreated && matchesKYC
    })

    // Sort results
    const sortedUsers = [...filteredUsers].sort((a: User, b: User) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const safeStr = (s: any) => (s ?? '').toString().toLowerCase()
      
      if (sortBy === 'name') {
        const an = safeStr(`${a.first_name || ''} ${a.last_name || ''}` || a.username)
        const bn = safeStr(`${b.first_name || ''} ${b.last_name || ''}` || b.username)
        return an < bn ? -1 * dir : an > bn ? 1 * dir : 0
      }
      
      if (sortBy === 'balance') {
        const av = parseFloat(String(a?.wallet?.balance ?? '0'))
        const bv = parseFloat(String(b?.wallet?.balance ?? '0'))
        return (av - bv) * dir
      }
      
      if (sortBy === 'status') {
        const av = a?.is_active ? 1 : 0
        const bv = b?.is_active ? 1 : 0
        return (av - bv) * dir
      }
      
      // default: date
      const ad = a?.date_joined ? new Date(a.date_joined).getTime() : 0
      const bd = b?.date_joined ? new Date(b.date_joined).getTime() : 0
      return (ad - bd) * dir
    })

    return sortedUsers
  }, [
    users,
    debouncedSearchQuery,
    filterStatus,
    filterDateCreated,
    filterKYCStatus,
    dateCreatedStart,
    dateCreatedEnd,
    sortBy,
    sortDir
  ])

  return filteredAndSortedUsers
}