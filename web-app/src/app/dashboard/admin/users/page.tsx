'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// Centralized API Base URL
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState('')
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
      const response = await fetch(`${API_BASE}/api/auth/admin/create-user/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
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
          phone: ''
        })
        setShowCreateUser(false)
        // Refresh users list
        fetchUsers()
      } else {
        const errorData = await response.json()
        console.error('Failed to create user:', errorData)
      }
    } catch (error) {
      console.error('Error creating user:', error)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

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

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Kreye Nouvo Itilizatè</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
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
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">
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
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
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
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Estati
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    Aksyon
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
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
                  <p><span className="font-medium">Dat enskripsyon:</span> {new Date(selectedUser.date_joined).toLocaleDateString()}</p>
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
                              {transaction.created_at ? new Date(transaction.created_at).toLocaleString() : 'Dat pa disponib'}
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