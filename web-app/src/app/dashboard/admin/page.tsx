'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Centralized API Base URL
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [unauthorized, setUnauthorized] = useState(false)
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState('')
  // Dashboard stats and activity
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState('')
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [recentLoading, setRecentLoading] = useState(false)
  const [recentError, setRecentError] = useState('')
  // Agents & Merchants
  const [agents, setAgents] = useState<any[]>([])
  const [agentsLoading, setAgentsLoading] = useState(false)
  const [agentsError, setAgentsError] = useState('')
  const [merchants, setMerchants] = useState<any[]>([])
  const [merchantsLoading, setMerchantsLoading] = useState(false)
  const [merchantsError, setMerchantsError] = useState('')
  const [showCreateUser, setShowCreateUser] = useState(false)
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
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    user_type: 'client',
    password: '',
    phone: ''
  })
  const router = useRouter()

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

  useEffect(() => {
    const checkAdminAccess = async () => {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        router.push('/login')
        return
      }
      try {
        const response = await fetch(`${API_BASE}/api/auth/profile/`, {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const userData = await response.json()
          
          // Check if user is admin
          if (userData.user.user_type === 'admin') {
            setAuthorized(true)
          } else {
            // Show unauthorized message for a moment before redirecting
            setUnauthorized(true)
            setTimeout(() => {
              // Redirect to appropriate dashboard based on user type
              switch (userData.user.user_type) {
                case 'client':
                  router.push('/dashboard/client')
                  break
                case 'agent':
                  router.push('/dashboard/agent')
                  break
                case 'enterprise':
                  router.push('/dashboard/enterprise')
                  break
                default:
                  router.push('/login')
              }
            }, 3000) // Show message for 3 seconds
          }
        } else {
          // Invalid token
          localStorage.removeItem('auth_token')
          router.push('/login')
        }
      } catch (error) {
        console.error('Error checking admin access:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAdminAccess()
  }, [router])

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

  // Fetch dashboard stats
  const fetchDashboardStats = async () => {
    setStatsLoading(true)
    setStatsError('')
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API_BASE}/api/auth/admin/dashboard-stats/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (res.ok) {
        const data = await res.json()
        setDashboardStats(data)
      } else {
        const text = await res.text()
        setStatsError(`Echèk chajman estatistik yo (${res.status}). ${text}`)
      }
    } catch (e) {
      setStatsError('Erè rezo pandan chajman estatistik yo.')
    } finally {
      setStatsLoading(false)
    }
  }

  // Fetch recent activity
  const fetchRecentActivity = async () => {
    setRecentLoading(true)
    setRecentError('')
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API_BASE}/api/auth/admin/recent-activity/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (res.ok) {
        const data = await res.json()
        setRecentActivity(data.activities || [])
      } else {
        const text = await res.text()
        setRecentError(`Echèk chajman aktivite yo (${res.status}). ${text}`)
      }
    } catch (e) {
      setRecentError('Erè rezo pandan chajman aktivite yo.')
    } finally {
      setRecentLoading(false)
    }
  }

  // Fetch agents & merchants (filtering from admin/users)
  const fetchAgents = async () => {
    setAgentsLoading(true)
    setAgentsError('')
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API_BASE}/api/auth/admin/users/`, {
        headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        const data = await res.json()
        setAgents((data || []).filter((u: any) => u.user_type === 'agent'))
      } else {
        const text = await res.text()
        setAgentsError(`Echèk chajman ajan yo (${res.status}). ${text}`)
      }
    } catch (e) {
      setAgentsError('Erè rezo pandan chajman ajan yo.')
    } finally {
      setAgentsLoading(false)
    }
  }

  const fetchMerchants = async () => {
    setMerchantsLoading(true)
    setMerchantsError('')
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API_BASE}/api/auth/admin/users/`, {
        headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        const data = await res.json()
        setMerchants((data || []).filter((u: any) => u.user_type === 'enterprise'))
      } else {
        const text = await res.text()
        setMerchantsError(`Echèk chajman ti machann yo (${res.status}). ${text}`)
      }
    } catch (e) {
      setMerchantsError('Erè rezo pandan chajman ti machann yo.')
    } finally {
      setMerchantsLoading(false)
    }
  }

  // Auto-fetch for tabs
  useEffect(() => {
    if (!authorized) return
    if (activeTab === 'overview') {
      fetchDashboardStats()
      fetchRecentActivity()
    } else if (activeTab === 'agents') {
      fetchAgents()
    } else if (activeTab === 'merchants') {
      fetchMerchants()
    }
  }, [activeTab, authorized])

  // Create new user
  const createUser = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_BASE}/api/auth/admin/create-user/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      })

      if (response.ok) {
        await fetchUsers() // Refresh users list
        setShowCreateUser(false)
        setNewUser({
          username: '',
          email: '',
          first_name: '',
          last_name: '',
          user_type: 'client',
          password: '',
          phone: ''
        })
        alert('Itilizatè a kreye ak siksè!')
      } else {
        const errorData = await response.json().catch(async () => ({ raw: await response.text() }))
        alert('Erè nan kreyasyon itilizatè a: ' + (errorData.error || JSON.stringify(errorData)))
      }
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Erè nan kreyasyon itilizatè a')
    }
  }

  // Toggle user active status
  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_BASE}/api/auth/admin/toggle-user-status/${userId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      })

      if (response.ok) {
        await fetchUsers() // Refresh users list
      } else {
        const text = await response.text()
        alert('Erè nan modifikasyon estatut itilizatè a: ' + text)
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
      alert('Erè nan modifikasyon estatut itilizatè a')
    }
  }

  // Load users when users tab is selected
  useEffect(() => {
    if (activeTab === 'users' && authorized) {
      fetchUsers()
    }
  }, [activeTab, authorized])

  // Reset password for user
  const resetUserPassword = async (userId) => {
    if (!confirm('Èske ou sèten ou vle reset modpas itilizatè sa a?')) return
    
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_BASE}/api/auth/admin/reset-password/${userId}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Modpas nouvo: ${data.new_password}`)
        await fetchUsers()
      } else {
        const text = await response.text()
        alert('Erè nan reset modpas la: ' + text)
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      alert('Erè nan reset modpas la')
    }
  }

  // Change user type
  const changeUserType = async (userId, newType) => {
    if (!confirm(`Èske ou sèten ou vle chanje tip kont la nan ${newType}?`)) return
    
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_BASE}/api/auth/admin/change-user-type/${userId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_type: newType }),
      })

      if (response.ok) {
        await fetchUsers()
        alert('Tip kont lan chanje ak siksè')
      } else {
        const text = await response.text()
        alert('Erè nan chanjman tip kont lan: ' + text)
      }
    } catch (error) {
      console.error('Error changing user type:', error)
      alert('Erè nan chanjman tip kont lan')
    }
  }

  // Get user details including transactions
  const getUserDetails = async (userId) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_BASE}/api/auth/admin/user-details/${userId}/`, {
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
        const text = await response.text()
        alert('Erè nan chajman detay itilizatè a: ' + text)
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
      alert('Erè nan chajman detay itilizatè a')
    }
  }

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (token) {
        await fetch(`${API_BASE}/api/auth/logout/`, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('auth_token')
      router.push('/login')
    }
  }

  const stats = {
    totalUsers: 15420,
    totalTransactions: 45678,
    totalVolume: 2456789,
    pendingApprovals: 23
  }

  // Show loading spinner while checking access
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chèk otorizasyon...</p>
        </div>
      </div>
    )
  }

  // Show unauthorized message
  if (unauthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-primary-900 flex items-center justify-center">
        <div className="max-w-md w-full p-8">
          <div className="bg-dark-800/50 backdrop-blur-sm p-8 rounded-xl border border-red-600/20 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Aksè Refize</h2>
              <p className="text-gray-300 mb-4">
                Ou pa gen otorizasyon pou aksè dashboard admin lan. Nou pral redirije w nan dashboard ki kòrèk la.
              </p>
              <div className="flex items-center justify-center space-x-2 text-yellow-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                <span className="text-sm">Redireksyon nan kèk segonn...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Don't render anything if not authorized (user will be redirected)
  if (!authorized) {
    return null
  }

  // Derived Users list for table (Clients only: search + status filters)
  const normalizedQuery = (searchQuery || '').trim().toLowerCase()
  const clientUsers = (users || []).filter((u: any) => u.user_type === 'client')
  const filteredUsers = clientUsers.filter((u: any) => {
    const matchesSearch = !normalizedQuery || [
      u.username,
      u.email,
      u.first_name,
      u.last_name,
      u?.profile?.phone,
      u.phone_number
    ].some((v: any) => (v ?? '').toString().toLowerCase().includes(normalizedQuery))
    // Type is fixed to client on this tab
    const matchesType = true
    const matchesStatus = filterStatus === 'all' ? true : (filterStatus === 'active' ? u.is_active : !u.is_active)
    return matchesSearch && matchesType && matchesStatus
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-dark-950 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">
                Cash Ti <span className="text-primary-600">Machann</span> - Admin
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-300">
                Byenveni, <span className="font-medium text-white">Admin</span>
              </div>
              <button 
                onClick={handleLogout}
                className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-700 transition-colors"
              >
                Dekonekte
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-4">
            <ul className="space-y-2">
              {[
                { id: 'overview', label: 'Apèsi Jeneral', icon: '📊' },
                { id: 'users', label: 'Jesyon Kliyan', icon: '👥' },
                { id: 'transactions', label: 'Tranzaksyon', icon: '💳' },
                { id: 'agents', label: 'Ajan Otorize', icon: '🧑‍💼' },
                { id: 'merchants', label: 'Ti Machann', icon: '🏪' },
                { id: 'finance', label: 'Finans', icon: '💰' },
                { id: 'reports', label: 'Rapò', icon: '📈' },
                { id: 'security', label: 'Sekirite', icon: '🔒' },
                { id: 'settings', label: 'Paramèt', icon: '⚙️' }
              ].map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${
                      activeTab === item.id
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Apèsi Jeneral</h2>

              {/* Errors for overview */}
              {(statsError || recentError) && (
                <div className="mb-4 space-y-2">
                  {statsError && <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{statsError}</div>}
                  {recentError && <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{recentError}</div>}
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Clients Active vs Inactive */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <div className="w-6 h-6 text-blue-600">⬤</div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Kliyan</p>
                      <p className="text-xs text-gray-500">Aktif vs Inaktif</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {statsLoading ? '...' : `${dashboardStats?.clientsActive ?? '—'} / ${dashboardStats?.clientsInactive ?? '—'}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Agents Active vs Inactive */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <div className="w-6 h-6 text-green-600">⬤</div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Ajan</p>
                      <p className="text-xs text-gray-500">Aktif vs Inaktif</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {statsLoading ? '...' : `${dashboardStats?.agentsActive ?? '—'} / ${dashboardStats?.agentsInactive ?? '—'}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Merchants Active vs Inactive */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <div className="w-6 h-6 text-purple-600">⬤</div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Machann</p>
                      <p className="text-xs text-gray-500">Aktif vs Inaktif</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {statsLoading ? '...' : `${dashboardStats?.merchantsActive ?? '—'} / ${dashboardStats?.merchantsInactive ?? '—'}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Total Transactions */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <div className="w-6 h-6 text-green-600">⬤</div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Tranzaksyon</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {statsLoading ? '...' : (dashboardStats?.totalTransactions ?? '—')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Total Volume */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <div className="w-6 h-6 text-yellow-600">⬤</div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Volim Total (HTG)</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {statsLoading ? '...' : (dashboardStats?.totalVolume ?? '—')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pending Approvals */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <div className="w-6 h-6 text-purple-600">⬤</div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Apwobasyon an atant</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {statsLoading ? '...' : (dashboardStats?.pendingApprovals ?? '—')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Volim Total (HTG)</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalVolume.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Aprobasyon ki Rete</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Aktivite Resan</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {recentLoading ? (
                      <div className="text-gray-500 text-sm">Chajman aktivite...</div>
                    ) : (
                      recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'user' ? 'bg-blue-500' :
                          activity.type === 'transaction' ? 'bg-green-500' :
                          activity.type === 'agent' ? 'bg-purple-500' :
                          'bg-gray-500'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            {activity.action}
                            {activity.user && <span className="font-medium"> - {activity.user}</span>}
                            {activity.amount && <span className="font-medium"> - {activity.amount}</span>}
                          </p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    )))
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              {usersError && (
                <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
                  {usersError}
                </div>
              )}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Jesyon Kliyan</h2>
                <button
                  onClick={() => setShowCreateUser(true)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
                >
                  + Kreye Nouvo Itilizatè
                </button>
              </div>

              {/* Search and Filters */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estati</label>
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
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setSearchQuery('')
                        setFilterStatus('all')
                      }}
                      className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Reset Filtè yo
                    </button>
                  </div>
                </div>
              </div>

              {/* User Details Modal */}
              {showUserDetails && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
                  <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 my-8 max-h-full overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900">
                        Detay Itilizatè: {selectedUser.first_name} {selectedUser.last_name}
                      </h3>
                      <button
                        onClick={() => setShowUserDetails(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* User Info */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-3">Enfòmasyon Kont</h4>
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium">Non Itilizatè:</span> {selectedUser.username}</div>
                          <div><span className="font-medium">Email:</span> {selectedUser.email}</div>
                          <div><span className="font-medium">Telefòn:</span> {selectedUser.profile?.phone || 'Pa gen'}</div>
                          <div><span className="font-medium">Tip Kont:</span> {selectedUser.user_type}</div>
                          <div><span className="font-medium">Estati:</span> 
                            <span className={`ml-1 px-2 py-1 rounded text-xs ${selectedUser.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {selectedUser.is_active ? 'Aktif' : 'Inaktif'}
                            </span>
                          </div>
                          <div><span className="font-medium">Dat Kreyasyon:</span> {new Date(selectedUser.date_joined).toLocaleDateString()}</div>
                        </div>
                      </div>

                      {/* Wallet Info */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-3">Enfòmasyon Pòtmonnè</h4>
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium">Balans:</span> {selectedUser.wallet?.balance || '0.00'} HTG</div>
                          <div><span className="font-medium">Monè:</span> {selectedUser.wallet?.currency || 'HTG'}</div>
                          <div><span className="font-medium">Estati Pòtmonnè:</span> 
                            <span className={`ml-1 px-2 py-1 rounded text-xs ${selectedUser.wallet?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {selectedUser.wallet?.is_active ? 'Aktif' : 'Inaktif'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Recent Transactions with Filters + Export */}
                      <div className="lg:col-span-2 bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-3">Tranzaksyon Resan yo</h4>
                        {/* Filters */}
                        <div className="bg-white p-3 rounded border border-gray-200 mb-3">
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Dat kòmansman</label>
                              <input type="date" value={txFilter.startDate} onChange={(e)=>setTxFilter({...txFilter, startDate: e.target.value})}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Dat fen</label>
                              <input type="date" value={txFilter.endDate} onChange={(e)=>setTxFilter({...txFilter, endDate: e.target.value})}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Tip</label>
                              <select value={txFilter.type} onChange={(e)=>setTxFilter({...txFilter, type: e.target.value})}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600">
                                <option value="all">Tout</option>
                                <option value="send">Voye</option>
                                <option value="receive">Resevwa</option>
                                <option value="deposit">Depo</option>
                                <option value="withdraw">Retire</option>
                                <option value="topup">Top-up</option>
                                <option value="bill">Peman Bòdwo</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Montan min</label>
                              <input type="number" inputMode="decimal" value={txFilter.minAmount} onChange={(e)=>setTxFilter({...txFilter, minAmount: e.target.value})}
                                placeholder="0" className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Montan max</label>
                              <input type="number" inputMode="decimal" value={txFilter.maxAmount} onChange={(e)=>setTxFilter({...txFilter, maxAmount: e.target.value})}
                                placeholder="" className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600" />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <button onClick={()=>setTxFilter({type:'all', startDate:'', endDate:'', minAmount:'', maxAmount:''})}
                              className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm">Reyinisyalize</button>
                            <button onClick={()=>exportFilteredTransactionsCSV(selectedUser)}
                              className="px-3 py-1.5 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm">Ekspòte CSV</button>
                          </div>
                        </div>
                        {selectedUser.recent_transactions && selectedUser.recent_transactions.length > 0 ? (
                          <div className="space-y-2">
                            {getFilteredTransactions(selectedUser).map((transaction, index) => (
                              <div key={index} className="flex justify-between items-center py-2 px-3 bg-white rounded text-sm">
                                <div>
                                  <span className="font-medium">{transaction.type}</span>
                                  <span className="text-gray-500 ml-2">{transaction.description}</span>
                                </div>
                                <div className="text-right">
                                  <div className={`font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {transaction.amount > 0 ? '+' : ''}{transaction.amount} HTG
                                  </div>
                                  <div className="text-xs text-gray-500">{new Date(transaction.created_at).toLocaleDateString()}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">Pa gen tranzaksyon yo jwenn</p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t">
                      {selectedUser.user_type !== 'admin' && (
                        <>
                          <button
                            onClick={() => toggleUserStatus(selectedUser.id, selectedUser.is_active)}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                              selectedUser.is_active 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {selectedUser.is_active ? 'Dezaktive Kont' : 'Aktive Kont'}
                          </button>
                          
                          <button
                            onClick={() => resetUserPassword(selectedUser.id)}
                            className="px-3 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded text-sm font-medium transition-colors"
                          >
                            Reset Modpas
                          </button>

                          {selectedUser.user_type === 'client' && (
                            <button
                              onClick={() => changeUserType(selectedUser.id, 'agent')}
                              className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm font-medium transition-colors"
                            >
                              Chanje nan Ajan
                            </button>
                          )}

                          {selectedUser.user_type === 'agent' && (
                            <button
                              onClick={() => changeUserType(selectedUser.id, 'client')}
                              className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm font-medium transition-colors"
                            >
                              Chanje nan Kliyèn
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Create User Modal */}
              {showCreateUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Kreye Nouvo Itilizatè</h3>
                    <form onSubmit={createUser} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tip Itilizatè</label>
                        <select
                          value={newUser.user_type}
                          onChange={(e) => setNewUser({...newUser, user_type: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
                          required
                        >
                          <option value="client">Kliyèn</option>
                          <option value="agent">Ajan</option>
                          <option value="enterprise">Antrepriz</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Non Itilizatè</label>
                        <input
                          type="text"
                          value={newUser.username}
                          onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Premye Non</label>
                          <input
                            type="text"
                            value={newUser.first_name}
                            onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Dezyèm Non</label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefòn</label>
                        <input
                          type="tel"
                          value={newUser.phone}
                          onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
                          placeholder="+509..."
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Modpas</label>
                        <input
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
                          minLength={8}
                          required
                        />
                      </div>

                      <div className="flex space-x-3 pt-4">
                        <button
                          type="submit"
                          className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors"
                        >
                          Kreye Itilizatè
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCreateUser(false)}
                          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                        >
                          Anile
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Users List */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Lis Kliyan yo ({filteredUsers.length} nan {users.filter((u: any) => u.user_type === 'client').length})
                  </h3>
                </div>
                
                {usersLoading ? (
                  <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Chajman itilizatè yo...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Itilizatè
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tip
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Telefòn
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Balans
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estati
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Aksyon
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                    <span className="text-sm font-medium text-primary-600">
                                      {user.first_name?.[0] || user.username[0]}{user.last_name?.[0] || ''}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.first_name} {user.last_name}
                                  </div>
                                  <div className="text-sm text-gray-500">@{user.username}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.profile?.phone || user.phone_number || 'Pa gen'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.wallet?.balance || '0.00'} HTG
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {user.is_active ? 'Aktif' : 'Inaktif'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Link
                                href={`/dashboard/admin/client/${user.id}`}
                                className="mr-2 px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs font-medium transition-colors"
                              >
                                Wè Detay
                              </Link>
                              <button
                                onClick={() => getUserDetails(user.id)}
                                className="mr-2 px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-xs font-medium transition-colors"
                              >
                                Rezime
                              </button>
                              {user.user_type !== 'admin' && (
                                <button
                                  onClick={() => toggleUserStatus(user.id, user.is_active)}
                                  className={`mr-2 px-3 py-1 rounded text-xs font-medium transition-colors ${
                                    user.is_active 
                                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                                  }`}
                                >
                                  {user.is_active ? 'Dezaktive' : 'Aktive'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {filteredUsers.length === 0 && (
                      <div className="p-6 text-center text-gray-500">
                        {searchQuery || filterStatus !== 'all' 
                          ? 'Pa gen itilizatè ki koresspòn ak rechèch la'
                          : 'Pa gen itilizatè yo jwenn'
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Jesyon Tranzaksyon</h2>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600">Fonksyonalite jesyon tranzaksyon yo ap vini...</p>
              </div>
            </div>
          )}

          {activeTab === 'agents' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Jesyon Ajan</h2>
              {agentsError && <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{agentsError}</div>}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {agentsLoading ? (
                  <p className="text-gray-600">Chajman ajan yo...</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Non</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estati</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {agents.map((a) => (
                          <tr key={a.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{a.username}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 rounded text-xs ${a.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {a.is_active ? 'Aktif' : 'Inaktif'}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {agents.length === 0 && (
                          <tr><td className="px-6 py-4 text-sm text-gray-500" colSpan={3}>Pa gen ajan pou montre</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'merchants' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Jesyon Ti Machann</h2>
              {merchantsError && <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{merchantsError}</div>}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {merchantsLoading ? (
                  <p className="text-gray-600">Chajman ti machann yo...</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Non</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estati</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {merchants.map((m) => (
                          <tr key={m.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{m.username}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 rounded text-xs ${m.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {m.is_active ? 'Aktif' : 'Inaktif'}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {merchants.length === 0 && (
                          <tr><td className="px-6 py-4 text-sm text-gray-500" colSpan={3}>Pa gen ti machann pou montre</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Jesyon Finans</h2>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600">Balans sistèm, rapò komisyon, ekspòtasyon CSV ap vini...</p>
              </div>
            </div>
          )}

          {/* Add other tab content as needed */}
        </main>
      </div>
    </div>
  )
}
