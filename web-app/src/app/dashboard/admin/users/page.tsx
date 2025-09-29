'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { COUNTRY_CODES, ALLOWED_REGISTRATION_COUNTRIES, validatePhoneNumber, formatPhoneNumber } from '../../../../utils/countryCodes'
import { formatDateTimeLocal } from '@/utils/datetime'

// Centralized API Base URL
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState('')
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [createUserStep, setCreateUserStep] = useState(1) // Multi-step form
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  
  // Filters for selected user's transactions + export
  const [txFilter, setTxFilter] = useState<any>({
    type: 'all',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: ''
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterKycStatus, setFilterKycStatus] = useState('all')
  const [filterDateRange, setFilterDateRange] = useState({
    startDate: '',
    endDate: ''
  })
  const [sortBy, setSortBy] = useState('newest') // newest, oldest, name_asc, name_desc
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [usersPerPage] = useState(10)
  
  // Selection states for export
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  
  // Username availability check state
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  
  const [newUser, setNewUser] = useState({
    // Personal Information
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    user_type: 'client',
    password: '',
    countryCode: 'HT', // Default to Haiti
    areaCode: '',
    phone: '',
    dateOfBirth: '',
    
    // Address Information
    address: '',
    city: '',
    residenceCountry: 'HT',
    
    // Identity Document
    idType: 'national_id',
    idNumber: '',
    idDocumentFront: null as File | null,
    idDocumentBack: null as File | null
  })

  // Derive limited country list for phone numbers
  const allowedCountries = COUNTRY_CODES.filter(c => ALLOWED_REGISTRATION_COUNTRIES.includes(c.code as any))

  // Helper: filter transactions of selected user based on txFilter
  const getFilteredTransactions = (user: any) => {
    const txs = (user?.recent_transactions || []) as any[]
    const type = (txFilter.type || 'all').toLowerCase()
    const hasType = type !== 'all'
    const start = txFilter.startDate ? new Date(txFilter.startDate) : null
    const end = txFilter.endDate ? new Date(txFilter.endDate) : null
    if (end) {
      // include entire end day
      end.setHours(23,59,59,999)
    }
    const minAmt = txFilter.minAmount !== '' ? parseFloat(txFilter.minAmount) : null
    const maxAmt = txFilter.maxAmount !== '' ? parseFloat(txFilter.maxAmount) : null

    return txs.filter((t: any) => {
      try {
        const created = t.created_at ? new Date(t.created_at) : null
        const amt = typeof t.amount === 'number' ? t.amount : parseFloat(String(t.amount || '0'))
        const typeMatch = !hasType || String(t.type || '').toLowerCase() === type
        const startOk = !start || (created && created >= start)
        const endOk = !end || (created && created <= end)
        const minOk = minAmt === null || (!isNaN(amt) && amt >= minAmt)
        const maxOk = maxAmt === null || (!isNaN(amt) && amt <= maxAmt)
        return typeMatch && startOk && endOk && minOk && maxOk
      } catch {
        return false
      }
    })
  }

  // Helper: export filtered transactions to CSV
  const exportFilteredTransactionsCSV = (user: any) => {
    const list = getFilteredTransactions(user)
    const headers = ['Date', 'Type', 'Description', 'Amount']
    const rows = list.map((t: any) => [
      t.created_at || '',
      t.type || '',
      t.description || '',
      t.amount !== undefined && t.amount !== null ? t.amount : ''
    ])
    const csv = [headers, ...rows]
      .map(r => r.map(v => {
        const s = String(v).replaceAll('"', '""')
        return /[",\n]/.test(s) ? `"${s}"` : s
      }).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const username = user?.username || 'client'
    a.download = `transactions_${username}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Fetch all users
  const fetchUsers = async () => {
    setUsersLoading(true)
    setUsersError('')
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_BASE}/api/auth/admin/users/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        const text = await response.text()
        setUsersError(`Echèk chajman itilizatè yo (${response.status}). Detay: ${text}`)
        console.error('Failed to fetch users', response.status, text)
      }
    } catch (error) {
      setUsersError('Erè rezo pandan chajman itilizatè yo. Asire API a ap kouri.')
      console.error('Error fetching users:', error)
    } finally {
      setUsersLoading(false)
    }
  }

  // Get user details
  const getUserDetails = async (userId: number) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_BASE}/api/auth/admin/users/${userId}/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setSelectedUser(userData)
        setShowUserDetails(true)
      } else {
        console.error('Failed to fetch user details')
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
    }
  }

  // Toggle user status
  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_BASE}/api/auth/admin/users/${userId}/toggle-status/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        // Refresh users list
        fetchUsers()
      } else {
        console.error('Failed to toggle user status')
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
    }
  }

  // Create new user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('auth_token')
      
      // Create FormData for file uploads
      const formData = new FormData()
      
      // Add basic user data
      formData.append('username', newUser.username)
      formData.append('email', newUser.email)
      formData.append('first_name', newUser.first_name)
      formData.append('last_name', newUser.last_name)
      formData.append('user_type', newUser.user_type)
      formData.append('password', newUser.password)
      
      // Construct full phone number
      const selectedCountry = allowedCountries.find(c => c.code === newUser.countryCode)
      let fullPhoneNumber = ''
      
      if (newUser.countryCode === 'HT') {
        // For Haiti, just use the phone number directly
        fullPhoneNumber = newUser.phone
      } else {
        // For other countries, combine area code + phone number if area code exists
        fullPhoneNumber = newUser.areaCode ? `${newUser.areaCode}${newUser.phone}` : newUser.phone
      }
      
      // Validate username if provided
      if (newUser.username && newUser.username.trim()) {
        if (usernameStatus === 'taken') {
          alert('Non itilizatè sa a deja egziste. Tanpri chwazi yon lòt.')
          return
        }
        if (usernameStatus === 'checking') {
          alert('Nap toujou verifye disponiblite non itilizatè a. Tanpri tann.')
          return
        }
      }
      
      // Validate phone number
      if (!validatePhoneNumber(newUser.countryCode, fullPhoneNumber)) {
        let errorMessage = ''
        switch (newUser.countryCode) {
          case 'HT':
            errorMessage = 'Nimewo telefòn Ayiti a pa valid. Li dwe gen 8 chif epi kòmanse ak 2, 3, 4, oswa 5.'
            break
          case 'US':
          case 'CA':
          case 'DO':
          case 'JM':
          case 'PR':
            errorMessage = 'Nimewo telefòn an pa valid. Li dwe gen 10 chif (area code + nimewo).'
            break
          default:
            errorMessage = 'Nimewo telefòn an pa valid pou peyi sa a.'
        }
        alert(errorMessage)
        return
      }
      
      formData.append('phone_number', fullPhoneNumber)
      formData.append('country_code', newUser.countryCode)
      if (newUser.areaCode) {
        formData.append('area_code', newUser.areaCode)
      }
      formData.append('date_of_birth', newUser.dateOfBirth)
      
      // Add address data
      formData.append('address', newUser.address)
      formData.append('city', newUser.city)
      formData.append('residence_country', newUser.residenceCountry)
      
      // Add identity document data
      formData.append('id_type', newUser.idType)
      formData.append('id_number', newUser.idNumber)
      
      // Add document files if present
      if (newUser.idDocumentFront) {
        formData.append('id_document_front', newUser.idDocumentFront)
      }
      if (newUser.idDocumentBack) {
        formData.append('id_document_back', newUser.idDocumentBack)
      }

      const response = await fetch(`${API_BASE}/api/auth/admin/create-user/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          // Don't set Content-Type for FormData, let browser set it with boundary
        },
        body: formData,
      })

      if (response.ok) {
        // Reset form and close modal
        setNewUser({
          username: '',
          email: '',
          first_name: '',
          last_name: '',
          user_type: 'client',
          password: '',
          countryCode: 'HT',
          areaCode: '',
          phone: '',
          dateOfBirth: '',
          address: '',
          city: '',
          residenceCountry: 'HT',
          idType: 'national_id',
          idNumber: '',
          idDocumentFront: null,
          idDocumentBack: null
        })
        setShowCreateUser(false)
        setCreateUserStep(1)
        // Refresh users list
        fetchUsers()
        alert('Kliyan kreye ak siksè!')
      } else {
        const errorData = await response.json()
        console.error('Failed to create user:', errorData)
        alert('Erè nan kreye kliyan an. Tanpri verifye enfòmasyon yo.')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Erè nan kominikasyon ak sèvè a.')
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Live username availability check (debounced)
  useEffect(() => {
    const name = newUser.username?.trim()
    if (!name) {
      setUsernameStatus('idle')
      return
    }
    setUsernameStatus('checking')
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/check-username/?username=${encodeURIComponent(name)}`,
          { signal: controller.signal }
        )
        if (!res.ok) {
          setUsernameStatus('idle')
          return
        }
        const data = await res.json()
        if (data.available) {
          setUsernameStatus('available')
        } else {
          setUsernameStatus('taken')
        }
      } catch (e) {
        setUsernameStatus('idle')
      }
    }, 450)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [newUser.username])

  // Derived Users list for table (Clients only: search + status filters)
  const normalizedQuery = (searchQuery || '').trim().toLowerCase()
  const clientUsers = (users || []).filter((u: any) => u?.user_type === 'client')
  
  // Helper function to safely get balance
  const getUserBalance = (user: any) => {
    try {
      const balance = user?.wallet?.balance
      if (balance === null || balance === undefined) return 0
      const parsed = parseFloat(balance)
      return isNaN(parsed) ? 0 : parsed
    } catch (error) {
      console.warn('Error parsing user balance:', error)
      return 0
    }
  }
  
  // Helper function to check KYC status
  const getKycStatus = (user: any) => {
    const profile = user.profile || {}
    
    // Check for ID documents
    const hasIdFront = profile.id_document_front
    const hasIdBack = profile.id_document_back
    const hasDocuments = hasIdFront && hasIdBack
    
    // Check verification status from profile
    const verificationStatus = profile.verification_status
    const emailVerified = profile.email_verified
    const phoneVerified = profile.phone_verified
    
    // If verification_status exists, use it as primary indicator
    if (verificationStatus === 'verified') {
      return 'verified'
    } else if (verificationStatus === 'pending') {
      return 'pending'
    } else if (verificationStatus === 'rejected') {
      return 'not_submitted' // Treat rejected as not submitted for simplicity
    }
    
    // Fallback logic based on documents and verification
    if (hasDocuments && (emailVerified || phoneVerified)) {
      return 'verified'
    } else if (hasDocuments || hasIdFront || hasIdBack) {
      return 'pending'
    } else {
      return 'not_submitted'
    }
  }
  
  // Export functions
  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const selectedUserData = filteredAndSortedUsers.filter((user: any) => selectedUsers.has(user.id))
    
    switch (format) {
      case 'csv':
        exportToCSV(selectedUserData)
        break
      case 'excel':
        exportToExcel(selectedUserData)
        break
      case 'pdf':
        exportToPDF(selectedUserData)
        break
    }
  }

  const exportToCSV = (users: any[]) => {
    const headers = ['Non', 'Email', 'Tip Itilizatè', 'Telefòn', 'Balans', 'Estati KYC', 'Estati Kont', 'Dat Enskripsyon']
  const csvContent = [
      headers.join(','),
      ...users.map(user => [
        `"${user.first_name} ${user.last_name}"`,
        `"${user.email}"`,
        `"${user.user_type}"`,
        `"${user.profile?.phone || user.phone_number || 'Pa gen'}"`,
        `"${user.wallet?.balance || '0.00'} HTG"`,
        `"${getKycStatusLabel(getKycStatus(user))}"`,
        `"${user.is_active ? 'Aktif' : 'Inaktif'}"`,
        `"${new Date(user.date_joined).toLocaleDateString()}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `kliyan-ekspote-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const exportToExcel = (users: any[]) => {
    // For Excel export, we'll use a simple HTML table approach
    const headers = ['Non', 'Email', 'Tip Itilizatè', 'Telefòn', 'Balans', 'Estati KYC', 'Estati Kont', 'Dat Enskripsyon']
    const tableHTML = `
      <table border="1">
        <thead>
          <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${users.map(user => `
            <tr>
              <td>${user.first_name} ${user.last_name}</td>
              <td>${user.email}</td>
              <td>${user.user_type}</td>
              <td>${user.profile?.phone || user.phone_number || 'Pa gen'}</td>
              <td>${user.wallet?.balance || '0.00'} HTG</td>
              <td>${getKycStatusLabel(getKycStatus(user))}</td>
              <td>${user.is_active ? 'Aktif' : 'Inaktif'}</td>
              <td>${new Date(user.date_joined).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `

  const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `kliyan-ekspote-${new Date().toISOString().split('T')[0]}.xls`
    link.click()
  }

  const exportToPDF = (users: any[]) => {
    // Create a simple HTML document for PDF generation
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Lis Kliyan yo - Cash Ti Machann</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #DC2626; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .date { text-align: center; margin-bottom: 20px; color: #666; }
        </style>
      </head>
      <body>
        <h1>Lis Kliyan yo - Cash Ti Machann</h1>
  <div class="date">Ekspote nan: ${formatDateTimeLocal(new Date(), { year: 'numeric', month: '2-digit', day: '2-digit' })}</div>
        <table>
          <thead>
            <tr>
              <th>Non</th>
              <th>Email</th>
              <th>Tip</th>
              <th>Telefòn</th>
              <th>Balans</th>
              <th>KYC</th>
              <th>Estati</th>
              <th>Dat Enskripsyon</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(user => `
              <tr>
                <td>${user.first_name} ${user.last_name}</td>
                <td>${user.email}</td>
                <td>${user.user_type}</td>
                <td>${user.profile?.phone || user.phone_number || 'Pa gen'}</td>
                <td>${user.wallet?.balance || '0.00'} HTG</td>
                <td>${getKycStatusLabel(getKycStatus(user))}</td>
                <td>${user.is_active ? 'Aktif' : 'Inaktif'}</td>
                <td>${new Date(user.date_joined).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `

    const blob = new Blob([htmlContent], { type: 'text/html' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `kliyan-ekspote-${new Date().toISOString().split('T')[0]}.html`
    link.click()
    
    // Note: Pour vrè PDF, ou ta dwe sèvi ak yon bibliyotèk tankou jsPDF oswa html2pdf
    alert('Fichye HTML kreye. Ou ka ouvè l nan navigateur ou a epi enprime l kòm PDF.')
  }

  const getKycStatusLabel = (status: string) => {
    switch (status) {
      case 'verified': return 'Verifye'
      case 'pending': return 'An Atant'
      case 'not_submitted': return 'Pa Soumèt'
      default: return 'Enkoni'
    }
  }
  
  const filteredAndSortedUsers = clientUsers.filter((u: any) => {
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
    
    // KYC Status filter
    const userKycStatus = getKycStatus(u)
    const matchesKyc = filterKycStatus === 'all' ? true : filterKycStatus === userKycStatus
    
    // Date range filter
    let matchesDateRange = true
    if (filterDateRange.startDate || filterDateRange.endDate) {
      const userDate = new Date(u.date_joined)
      const startDate = filterDateRange.startDate ? new Date(filterDateRange.startDate) : null
      const endDate = filterDateRange.endDate ? new Date(filterDateRange.endDate) : null
      
      if (startDate) {
        matchesDateRange = matchesDateRange && userDate >= startDate
      }
      if (endDate) {
        endDate.setHours(23, 59, 59, 999) // Include entire end day
        matchesDateRange = matchesDateRange && userDate <= endDate
      }
    }
    
    return matchesSearch && matchesStatus && matchesKyc && matchesDateRange
  }).sort((a: any, b: any) => {
    // Sorting logic
    switch (sortBy) {
      case 'oldest':
        return new Date(a.date_joined).getTime() - new Date(b.date_joined).getTime()
      case 'newest':
        return new Date(b.date_joined).getTime() - new Date(a.date_joined).getTime()
      case 'name_asc':
        return (a.first_name || a.username).localeCompare(b.first_name || b.username)
      case 'name_desc':
        return (b.first_name || b.username).localeCompare(a.first_name || a.username)
      default:
        return new Date(b.date_joined).getTime() - new Date(a.date_joined).getTime()
    }
  })

  // Pagination calculations
  const totalUsers = filteredAndSortedUsers.length
  const totalPages = Math.ceil(totalUsers / usersPerPage)
  const startIndex = (currentPage - 1) * usersPerPage
  const endIndex = startIndex + usersPerPage
  const paginatedUsers = filteredAndSortedUsers.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterStatus, filterKycStatus, filterDateRange, sortBy])

  // Selection functions
  const handleSelectUser = (userId: number) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
    setSelectAll(newSelected.size === paginatedUsers.length && paginatedUsers.length > 0)
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers(new Set())
      setSelectAll(false)
    } else {
      const allIds = new Set(paginatedUsers.map((user: any) => user.id))
      setSelectedUsers(allIds)
      setSelectAll(true)
    }
  }

  // Clear selection when pagination changes
  useEffect(() => {
    setSelectedUsers(new Set())
    setSelectAll(false)
  }, [currentPage])

  return (
    <div>
      {usersError && (
        <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
          {usersError}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Jesyon Kliyan</h2>
        <button
          onClick={() => setShowCreateUser(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors text-sm sm:text-base"
        >
          + Kreye Nouvo Kliyan
        </button>
      </div>

      {/* Export Actions Bar - Shows when users are selected */}
      {selectedUsers.size > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-primary-700 font-medium">
                {selectedUsers.size} kliyan seleksyone
              </span>
              <button
                onClick={() => {
                  setSelectedUsers(new Set())
                  setSelectAll(false)
                }}
                className="text-primary-600 hover:text-primary-800 text-sm underline"
              >
                Retire seleksyon an
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => handleExport('csv')}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
              >
                📊 Eksporte CSV
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
              >
                📋 Eksporte Excel
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm flex items-center gap-2"
              >
                📄 Eksporte PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        {/* Total Clients */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-blue-600">👥</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Kliyan</p>
              {usersLoading ? (
                <div className="h-7 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-lg font-bold text-gray-900">{clientUsers.length}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Active Accounts */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-green-600">🟢</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Kont Aktif</p>
              {usersLoading ? (
                <div className="h-7 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-lg font-bold text-gray-900">
                  {clientUsers.filter(u => u.is_active).length}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* KYC Verified */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <span className="text-emerald-600">✓</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">KYC Verifye</p>
              {usersLoading ? (
                <div className="h-7 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-lg font-bold text-gray-900">
                  {clientUsers.filter(u => getKycStatus(u) === 'verified').length}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* KYC Pending */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-yellow-600">⏳</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">KYC An Atant</p>
              <p className="text-lg font-bold text-gray-900">
                {clientUsers.filter(u => getKycStatus(u) === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        
        {/* Total Balance */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-purple-600">�</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Balans</p>
              {usersLoading ? (
                <div className="h-7 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-lg font-bold text-gray-900">
                  {clientUsers.reduce((total, user) => {
                    return total + getUserBalance(user)
                  }, 0).toLocaleString()} HTG
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* New This Month */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <span className="text-indigo-600">📅</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Nouvo Mwa Sa a</p>
              <p className="text-lg font-bold text-gray-900">
                {clientUsers.filter(u => {
                  const userDate = new Date(u.date_joined)
                  const now = new Date()
                  return userDate.getMonth() === now.getMonth() && 
                         userDate.getFullYear() === now.getFullYear()
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Metrics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatistik Detaye</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Activation Rate */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">Kont Aktif</span>
              <span className="text-sm font-bold text-gray-900">
                {usersLoading ? (
                  <div className="h-5 w-12 bg-gray-200 rounded animate-pulse"></div>
                ) : clientUsers.length > 0 ? (
                  Math.round((clientUsers.filter(u => u.is_active).length / clientUsers.length) * 100) + '%'
                ) : '0%'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${clientUsers.length > 0 ? 
                    (clientUsers.filter(u => u.is_active).length / clientUsers.length) * 100 
                    : 0}%`
                }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {usersLoading ? (
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                `${clientUsers.filter(u => u.is_active).length} nan ${clientUsers.length} kont yo`
              )}
            </div>
          </div>

          {/* Account Deactivation Rate */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">Kont Inaktif</span>
              <span className="text-sm font-bold text-gray-900">
                {usersLoading ? (
                  <div className="h-5 w-12 bg-gray-200 rounded animate-pulse"></div>
                ) : clientUsers.length > 0 ? (
                  Math.round((clientUsers.filter(u => !u.is_active).length / clientUsers.length) * 100) + '%'
                ) : '0%'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${clientUsers.length > 0 ? 
                    (clientUsers.filter(u => !u.is_active).length / clientUsers.length) * 100 
                    : 0}%`
                }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {usersLoading ? (
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                `${clientUsers.filter(u => !u.is_active).length} nan ${clientUsers.length} kont yo`
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        {/* First row - Basic filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rechèch</label>
            <input
              type="text"
              placeholder="Non, email, telefòn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estati Kont</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              <option value="all">Tout</option>
              <option value="active">Aktif</option>
              <option value="inactive">Inaktif</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estati KYC</label>
            <select
              value={filterKycStatus}
              onChange={(e) => setFilterKycStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              <option value="all">Tout</option>
              <option value="verified">Verifye</option>
              <option value="pending">An Atant</option>
              <option value="not_submitted">Pa Soumèt</option>
            </select>
          </div>
        </div>

        {/* Second row - Date filters and sorting */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dat Kòmanse</label>
            <input
              type="date"
              value={filterDateRange.startDate}
              onChange={(e) => setFilterDateRange({...filterDateRange, startDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dat Fini</label>
            <input
              type="date"
              value={filterDateRange.endDate}
              onChange={(e) => setFilterDateRange({...filterDateRange, endDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Klase Pa</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              <option value="newest">Pi Nouvo Yo</option>
              <option value="oldest">Pi Ansyen Yo</option>
              <option value="name_asc">Non A-Z</option>
              <option value="name_desc">Non Z-A</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchQuery('')
                setFilterStatus('all')
                setFilterKycStatus('all')
                setFilterDateRange({ startDate: '', endDate: '' })
                setSortBy('newest')
              }}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              Reset Filtè yo
            </button>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Kreye Nouvo Kliyan - Etap {createUserStep} nan 3
              </h3>
              <button
                onClick={() => {
                  setShowCreateUser(false)
                  setCreateUserStep(1)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-primary-600">Pwogrè</span>
                <span className="text-sm text-gray-500">{Math.round((createUserStep / 3) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(createUserStep / 3) * 100}%` }}
                ></div>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              {/* Step 1: Personal Information */}
              {createUserStep === 1 && (
                <>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Enfòmasyon Pèsonèl</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Premye Non *</label>
                      <input
                        type="text"
                        value={newUser.first_name}
                        onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dezyèm Non *</label>
                      <input
                        type="text"
                        value={newUser.last_name}
                        onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Non Itilizatè (opsyonèl)</label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
                      placeholder="egzanp: jan_doe"
                    />
                    {newUser.username && (
                      usernameStatus === 'checking' ? (
                        <p className="text-xs text-gray-500 mt-1">Nap verifye disponiblite...</p>
                      ) : usernameStatus === 'available' ? (
                        <p className="text-xs text-green-600 mt-1">✓ Non itilizatè disponib.</p>
                      ) : usernameStatus === 'taken' ? (
                        <p className="text-xs text-red-600 mt-1">✗ Non itilizatè sa a deja egziste.</p>
                      ) : null
                    )}
                    <p className="text-xs text-gray-500 mt-1">Si ou pa ranpli li, n ap itilize pati avan email a.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dat Nesans *</label>
                    <input
                      type="date"
                      value={newUser.dateOfBirth}
                      onChange={(e) => setNewUser({...newUser, dateOfBirth: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefòn *</label>
                    
                    {/* Country Selection */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Peyi</label>
                      <select
                        value={newUser.countryCode}
                        onChange={(e) => setNewUser({...newUser, countryCode: e.target.value, areaCode: ''})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
                      >
                        {allowedCountries.map(country => (
                          <option key={country.code} value={country.code}>
                            {country.flag} {country.name} ({country.dialCode})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Area Code Selection (for countries that have area codes) */}
                    {(() => {
                      const selectedCountry = allowedCountries.find(c => c.code === newUser.countryCode)
                      const hasAreaCodes = selectedCountry?.areaCodes && newUser.countryCode !== 'HT'
                      
                      if (hasAreaCodes) {
                        return (
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Kòd Rejyon</label>
                            <select
                              value={newUser.areaCode}
                              onChange={(e) => setNewUser({...newUser, areaCode: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
                              required
                            >
                              <option value="">Chwazi kòd rejyon</option>
                              {selectedCountry.areaCodes.map(code => (
                                <option key={code} value={code}>
                                  {code}
                                </option>
                              ))}
                            </select>
                          </div>
                        )
                      }
                      return null
                    })()}

                    {/* Phone Number Input */}
                    <div className="flex">
                      <div className="flex-shrink-0 flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 rounded-l-md">
                        <span className="text-sm text-gray-600">
                          {(() => {
                            const country = allowedCountries.find(c => c.code === newUser.countryCode)
                            return `${country?.dialCode}${newUser.areaCode ? ` ${newUser.areaCode}` : ''}`
                          })()}
                        </span>
                      </div>
                      <input
                        type="tel"
                        value={newUser.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '') // Only numbers
                          setNewUser({...newUser, phone: value})
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-primary-600"
                        placeholder={
                          newUser.countryCode === 'HT' 
                            ? "38901234" 
                            : "1234567"
                        }
                        required
                      />
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-1">
                      {newUser.countryCode === 'HT' 
                        ? "Format: 8 chif, kòmanse ak 2, 3, 4, oswa 5"
                        : `Format: ${allowedCountries.find(c => c.code === newUser.countryCode)?.phoneValidation || "Sèvi ak format peyi a"}`
                      }
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Modpas *</label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
                      minLength={8}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimòm 8 karaktè</p>
                  </div>
                </>
              )}

              {/* Step 2: Address Information */}
              {createUserStep === 2 && (
                <>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Enfòmasyon Adrès</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adrès *</label>
                    <input
                      type="text"
                      value={newUser.address}
                      onChange={(e) => setNewUser({...newUser, address: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
                      placeholder="Egzanp: 123 Ri Delmas, Delmas 31"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vil *</label>
                    <input
                      type="text"
                      value={newUser.city}
                      onChange={(e) => setNewUser({...newUser, city: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
                      placeholder="Egzanp: Pòtoprens"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Peyi Rezidans *</label>
                    <select
                      value={newUser.residenceCountry}
                      onChange={(e) => setNewUser({...newUser, residenceCountry: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
                      required
                    >
                      {COUNTRY_CODES.filter(c => ALLOWED_REGISTRATION_COUNTRIES.includes(c.code as any)).map(country => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Step 3: Identity Documents */}
              {createUserStep === 3 && (
                <>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Dokiman Idantite</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tip Dokiman *</label>
                    <select
                      value={newUser.idType}
                      onChange={(e) => setNewUser({...newUser, idType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
                      required
                    >
                      <option value="national_id">CIN (Kat Idantite Nasyonal)</option>
                      <option value="passport">Paspò</option>
                      <option value="drivers_license">Pèmi Kondwi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nimewo Dokiman *</label>
                    <input
                      type="text"
                      value={newUser.idNumber}
                      onChange={(e) => setNewUser({...newUser, idNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
                      placeholder="Egzanp: 12345678901234"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dokiman Devan {newUser.idType === 'national_id' ? '*' : ''}
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setNewUser({...newUser, idDocumentFront: e.target.files?.[0] || null})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
                        required={newUser.idType === 'national_id'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dokiman Dèyè {newUser.idType === 'national_id' ? '*' : ''}
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setNewUser({...newUser, idDocumentBack: e.target.files?.[0] || null})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
                        required={newUser.idType === 'national_id'}
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Nota:</strong> Pou CIN, nou mande 2 kote dokiman an (devan ak dèyè).
                      Pou lòt dokiman yo, sèlman yon kote ki nesesè.
                    </p>
                  </div>
                </>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <div>
                  {createUserStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setCreateUserStep(createUserStep - 1)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      ← Retounen
                    </button>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateUser(false)
                      setCreateUserStep(1)
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Anile
                  </button>
                  
                  {createUserStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => setCreateUserStep(createUserStep + 1)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                    >
                      Kontinye →
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                    >
                      Kreye Kliyan
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">
            Lis Kliyan yo ({totalUsers} nan {users.filter((u: any) => u.user_type === 'client').length})
            {totalPages > 1 && (
              <span className="text-sm text-gray-500 ml-2">
                - Paj {currentPage} nan {totalPages} ({paginatedUsers.length} yo montre)
              </span>
            )}
          </h3>
        </div>
        
        {usersLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Chajman itilizatè yo...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-0 w-48">
                    Itilizatè
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Tip
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    Email
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Telefòn
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    Balans
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    KYC
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    Dat Enskripsyon
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Estati
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    Aksyon
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 whitespace-nowrap w-12">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap min-w-0 w-48">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary-600">
                              {user.first_name?.[0] || user.username[0]}{user.last_name?.[0] || ''}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3 min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap w-20">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                        user.user_type === 'admin' ? 'bg-red-100 text-red-800' :
                        user.user_type === 'agent' ? 'bg-green-100 text-green-800' :
                        user.user_type === 'enterprise' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {user.user_type === 'admin' ? 'Admin' :
                         user.user_type === 'agent' ? 'Ajan' :
                         user.user_type === 'enterprise' ? 'Antrepriz' :
                         'Kliyan'}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 w-48">
                      <div className="truncate" title={user.email}>
                        {user.email}
                      </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 w-32">
                      <div className="truncate">
                        {user.profile?.phone || user.phone_number || 'Pa gen'}
                      </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 w-28">
                      <span className="font-medium">
                        {user.wallet?.balance || '0.00'} HTG
                      </span>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap w-24">
                      {(() => {
                        const kycStatus = getKycStatus(user)
                        const statusConfig = {
                          verified: { color: 'bg-green-100 text-green-800', text: 'Verifye', icon: '✓' },
                          pending: { color: 'bg-yellow-100 text-yellow-800', text: 'An Atant', icon: '⏳' },
                          not_submitted: { color: 'bg-gray-100 text-gray-800', text: 'Pa Soumèt', icon: '📄' }
                        }
                        const config = statusConfig[kycStatus]
                        return (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                            <span className="mr-1">{config.icon}</span>
                            {config.text}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-xs text-gray-900 w-28">
                      <div className="truncate">
                        {formatDateTimeLocal(user.date_joined, { year: '2-digit', month: '2-digit', day: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap w-20">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Aktif' : 'Inaktif'}
                      </span>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-sm font-medium w-40">
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/dashboard/admin/client/${user.id}`}
                          className="px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs font-medium transition-colors text-center"
                        >
                          Detay
                        </Link>
                        <button
                          onClick={() => getUserDetails(user.id)}
                          className="px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-xs font-medium transition-colors"
                        >
                          Rezime
                        </button>
                        {user.user_type !== 'admin' && (
                          <button
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                              user.is_active 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {user.is_active ? 'Dezaktive' : 'Aktive'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {totalUsers === 0 && (
              <div className="p-6 text-center text-gray-500">
                {searchQuery || filterStatus !== 'all' || filterKycStatus !== 'all' || filterDateRange.startDate || filterDateRange.endDate
                  ? 'Pa gen itilizatè ki koresspòn ak filtè yo'
                  : 'Pa gen itilizatè yo jwenn'
                }
              </div>
            )}
          </div>
        )}
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              {/* Page Info */}
              <div className="text-sm text-gray-700">
                Montre {startIndex + 1} nan {Math.min(endIndex, totalUsers)} nan {totalUsers} rezilta yo
              </div>
              
              {/* Pagination Buttons */}
              <div className="flex items-center space-x-2">
                {/* Previous Button */}
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  ← Anvan
                </button>
                
                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = index + 1
                    } else if (currentPage <= 3) {
                      pageNum = index + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + index
                    } else {
                      pageNum = currentPage - 2 + index
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                          currentPage === pageNum
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                
                {/* Next Button */}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  Apre →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 my-8 max-h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-medium text-gray-900">
                Detay Itilizatè: {selectedUser.first_name} {selectedUser.last_name}
              </h3>
              <button
                onClick={() => setShowUserDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Fèmen</span>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Enfòmasyon Pèsonèl</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Username:</span> {selectedUser.username}</p>
                  <p><span className="font-medium">Email:</span> {selectedUser.email}</p>
                  <p><span className="font-medium">Telefòn:</span> {selectedUser.profile?.phone || 'Pa gen'}</p>
                  <p><span className="font-medium">Tip:</span> {selectedUser.user_type}</p>
                  <p><span className="font-medium">Estati:</span> {selectedUser.is_active ? 'Aktif' : 'Inaktif'}</p>
                  <p><span className="font-medium">Dat enskripsyon:</span> {formatDateTimeLocal(selectedUser.date_joined, { year: 'numeric', month: '2-digit', day: '2-digit' })}</p>
                </div>
              </div>

              {/* KYC Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Estati KYC</h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Dokiman Idantite:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      selectedUser.profile?.id_document_front && selectedUser.profile?.id_document_back
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedUser.profile?.id_document_front && selectedUser.profile?.id_document_back
                        ? 'Soumèt'
                        : 'Pa Soumèt'
                      }
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Veifikasyon:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      selectedUser.profile?.verification_status === 'verified'
                        ? 'bg-green-100 text-green-800'
                        : selectedUser.profile?.verification_status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedUser.profile?.verification_status === 'verified' 
                        ? 'Verifye'
                        : selectedUser.profile?.verification_status === 'pending'
                        ? 'An Atant'
                        : 'Pa Verifye'
                      }
                    </span>
                  </p>
                  {selectedUser.profile?.verification_date && (
                    <p><span className="font-medium">Dat Veifikasyon:</span> {formatDateTimeLocal(selectedUser.profile.verification_date, { year: 'numeric', month: '2-digit', day: '2-digit' })}</p>
                  )}
                </div>
              </div>

              {/* Wallet Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Enfòmasyon Kòb</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Balans:</span> {selectedUser.wallet?.balance || '0.00'} HTG</p>
                  <p><span className="font-medium">Estati Kòb:</span> {selectedUser.wallet?.is_active ? 'Aktif' : 'Inaktif'}</p>
                </div>
              </div>
            </div>

            {/* Transaction Filters */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Filtè Tranzaksyon</h4>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tip</label>
                  <select
                    value={txFilter.type}
                    onChange={(e) => setTxFilter({...txFilter, type: e.target.value})}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600">
                    <option value="all">Tout</option>
                    <option value="deposit">Depo</option>
                    <option value="withdrawal">Retrè</option>
                    <option value="transfer">Transfè</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Depi</label>
                  <input type="date" value={txFilter.startDate}
                    onChange={(e) => setTxFilter({...txFilter, startDate: e.target.value})}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Jiska</label>
                  <input type="date" value={txFilter.endDate}
                    onChange={(e) => setTxFilter({...txFilter, endDate: e.target.value})}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Min</label>
                  <input type="number" value={txFilter.minAmount}
                    onChange={(e) => setTxFilter({...txFilter, minAmount: e.target.value})}
                    placeholder="0" className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Max</label>
                  <input type="number" value={txFilter.maxAmount}
                    onChange={(e) => setTxFilter({...txFilter, maxAmount: e.target.value})}
                    placeholder="" className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600" />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setTxFilter({type: 'all', startDate: '', endDate: '', minAmount: '', maxAmount: ''})}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 transition-colors">
                  Reset
                </button>
                <button
                  onClick={() => exportFilteredTransactionsCSV(selectedUser)}
                  className="px-3 py-1.5 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700 transition-colors">
                  Ekspòte CSV
                </button>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">
                Tranzaksyon yo ({getFilteredTransactions(selectedUser).length})
              </h4>
              <div className="max-h-64 overflow-y-auto">
                {getFilteredTransactions(selectedUser).length > 0 ? (
                  <div className="space-y-2">
                    {getFilteredTransactions(selectedUser).map((transaction, index) => (
                      <div key={index} className="bg-white border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{transaction.description}</p>
                            <p className="text-sm text-gray-500">{transaction.type}</p>
                            <p className="text-xs text-gray-400">
                              {transaction.created_at ? formatDateTimeLocal(transaction.created_at) : 'Dat pa disponib'}
                            </p>
                          </div>
                          <span className={`font-medium ${
                            transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount} HTG
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Pa gen tranzaksyon ki matche filtè yo</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}