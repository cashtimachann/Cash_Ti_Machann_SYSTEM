'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import BackButton from '@/app/components/BackButton'
import { formatDateTimeLocal } from '@/utils/datetime'

interface Enterprise {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  user_type: string
  is_active: boolean
  date_joined: string
  last_login: string
  profile?: {
    phone: string
    address: string
    verification_status: string
    kyc_status: string
    email_verified: boolean
    phone_verified: boolean
    company_name: string
    business_registration_number: string
    tax_id_number: string
    business_type: string
    website: string
  }
  wallet?: {
    balance: string
    currency: string
    is_active: boolean
    created_at: string
  }
  recent_transactions?: Array<{
    id: string
    type: string
    amount: number
    description: string
    status: string
    created_at: string
    reference_number: string
  }>
  login_history?: Array<{
    timestamp: string
    ip_address: string
    user_agent: string
    success: boolean
  }>
  business_documents?: Array<{
    id: string
    document_type: string
    document_number: string
    file_url: string
    verification_status: string
    uploaded_at: string
  }>
  enterprise_stats?: {
    total_transactions: number
    monthly_volume: number
    total_payments_received: number
    active_services: number
    customer_count: number
  }
}

export default function EnterpriseDetails() {
  const params = useParams()
  const router = useRouter()
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const checkAuthAndFetchEnterprise = async () => {
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        router.push('/login')
        return
      }

      try {
        // Check if user is admin
        const authResponse = await fetch('http://127.0.0.1:8000/api/auth/profile/', {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (authResponse.ok) {
          const userData = await authResponse.json()
          
          if (userData.user.user_type === 'admin') {
            setAuthorized(true)
            await fetchEnterpriseDetails(token)
          } else {
            router.push('/dashboard/' + userData.user.user_type)
          }
        } else {
          localStorage.removeItem('auth_token')
          router.push('/login')
        }
      } catch (error) {
        console.error('Error checking authorization:', error)
        router.push('/login')
      }
    }

    checkAuthAndFetchEnterprise()
  }, [params.id, router])

  const fetchEnterpriseDetails = async (token: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/auth/admin/user-details/${params.id}/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const enterpriseData = await response.json()
        
        // Ensure this is an enterprise
        if (enterpriseData.user_type === 'enterprise') {
          setEnterprise(enterpriseData)
        } else {
          router.push('/dashboard/admin')
        }
      } else {
        console.error('Failed to fetch enterprise details')
        router.push('/dashboard/admin')
      }
    } catch (error) {
      console.error('Error fetching enterprise details:', error)
      router.push('/dashboard/admin')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      try {
        await fetch('http://127.0.0.1:8000/api/auth/logout/', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        })
      } catch (error) {
        console.error('Logout error:', error)
      }
    }
    
    localStorage.removeItem('auth_token')
    router.push('/login')
  }

  const toggleEnterpriseStatus = async () => {
    if (!enterprise) return
    
    const token = localStorage.getItem('auth_token')
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/auth/admin/toggle-user-status/${enterprise.id}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        await fetchEnterpriseDetails(token!)
        alert(`Kont lan ${enterprise.is_active ? 'dezaktive' : 'aktive'} ak siksè!`)
      }
    } catch (error) {
      console.error('Error toggling enterprise status:', error)
      alert('Erè nan chanje estati kont lan')
    }
  }

  const resetEnterprisePassword = async () => {
    if (!enterprise || !confirm('Èske ou sèten ou vle reset modpas antrepriz la?')) return
    
    const token = localStorage.getItem('auth_token')
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/auth/admin/reset-password/${enterprise.id}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Modpas nouvo: ${data.new_password}`)
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      alert('Erè nan reset modpas lan')
    }
  }

  const formatCurrency = (amount: string | number) => {
    return parseFloat(amount.toString()).toLocaleString() + ' HTG'
  }

  const formatDate = (dateString: string) => {
    return formatDateTimeLocal(dateString, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Kounye a'
    if (diffInMinutes < 60) return `${diffInMinutes} minit pase`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} è pase`
    return `${Math.floor(diffInMinutes / 1440)} jou pase`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chaje detay antrepriz la...</p>
        </div>
      </div>
    )
  }

  if (!authorized || !enterprise) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-dark-950 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <BackButton className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base touch-target" iconOnlyMobile />
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                <span className="hidden sm:inline">Cash Ti </span>
                <span className="text-primary-600">
                  <span className="sm:hidden">CTM</span>
                  <span className="hidden sm:inline">Machann</span>
                </span>
                <span className="hidden lg:inline"> - Detay Antrepriz</span>
              </h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden md:block text-sm text-gray-300">
                Byenveni, <span className="font-medium text-white">Admin</span>
              </div>
              <button 
                onClick={handleLogout}
                className="bg-primary-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm hover:bg-primary-700 transition-colors touch-target"
              >
                <span className="sm:hidden">Soti</span>
                <span className="hidden sm:inline">Dekonekte</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enterprise Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">🏢</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {enterprise.profile?.company_name || 'Antrepriz'}
                </h1>
                <p className="text-gray-600">@{enterprise.username}</p>
                <p className="text-sm text-gray-500">
                  Kontak: {enterprise.first_name} {enterprise.last_name}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    enterprise.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {enterprise.is_active ? 'Aktif' : 'Inaktif'}
                  </span>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    Antrepriz
                  </span>
                  {enterprise.profile?.business_type && (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                      {enterprise.profile.business_type}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-6 lg:mt-0 flex flex-col sm:flex-row gap-3">
              <button
                onClick={toggleEnterpriseStatus}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  enterprise.is_active 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {enterprise.is_active ? 'Dezaktive Kont' : 'Aktive Kont'}
              </button>
              <button
                onClick={resetEnterprisePassword}
                className="px-4 py-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-md text-sm font-medium transition-colors"
              >
                Reset Modpas
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'overview', label: 'Apèsi Jeneral', icon: '📊' },
              { id: 'transactions', label: 'Tranzaksyon', icon: '💳' },
              { id: 'documents', label: 'Dokiman', icon: '📄' },
              { id: 'activity', label: 'Aktivite', icon: '📈' },
              { id: 'settings', label: 'Paramèt', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                      <span className="text-green-600 font-semibold">💰</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Balans Disponib</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(enterprise.wallet?.balance || '0')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">📈</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Tranzaksyon</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {enterprise.enterprise_stats?.total_transactions || '0'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                      <span className="text-purple-600 font-semibold">💳</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Kòb Resevwa</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(enterprise.enterprise_stats?.total_payments_received || '0')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                      <span className="text-orange-600 font-semibold">👥</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Kliyan</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {enterprise.enterprise_stats?.customer_count || '0'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Enterprise Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Business Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Enfòmasyon Biznis</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Non Antrepriz</label>
                    <p className="mt-1 text-sm text-gray-900">{enterprise.profile?.company_name || 'Pa gen'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Tip Biznis</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{enterprise.profile?.business_type || 'Pa gen'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Sitwèb</label>
                    {enterprise.profile?.website ? (
                      <a
                        href={enterprise.profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 text-sm text-primary-600 hover:text-primary-900"
                      >
                        {enterprise.profile.website}
                      </a>
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">Pa gen</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Nimewo Enrejistèman</label>
                    <p className="mt-1 text-sm text-gray-900">{enterprise.profile?.business_registration_number || 'Pa gen'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Nimewo Tax (NIF)</label>
                    <p className="mt-1 text-sm text-gray-900">{enterprise.profile?.tax_id_number || 'Pa gen'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Adrès</label>
                    <p className="mt-1 text-sm text-gray-900">{enterprise.profile?.address || 'Pa gen'}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Enfòmasyon Kontak</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Moun Kontak</label>
                    <p className="mt-1 text-sm text-gray-900">{enterprise.first_name} {enterprise.last_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{enterprise.email}</p>
                    {enterprise.profile?.email_verified && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                        ✓ Verifye
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Telefòn</label>
                    <p className="mt-1 text-sm text-gray-900">{enterprise.profile?.phone || 'Pa gen'}</p>
                    {enterprise.profile?.phone_verified && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                        ✓ Verifye
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Non Itilizatè</label>
                    <p className="mt-1 text-sm text-gray-900">@{enterprise.username}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Estati Verifikasyon</label>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      enterprise.profile?.verification_status === 'verified' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {enterprise.profile?.verification_status === 'verified' ? '✓ Verifye' : '⏳ Tann Verifikasyon'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Estati KYC</label>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      enterprise.profile?.kyc_status === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {enterprise.profile?.kyc_status === 'approved' ? '✓ Apwouve' : '⏳ Tann Apwobation'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Dat Kreyasyon</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(enterprise.date_joined)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Dènye Koneksyon</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {enterprise.last_login ? (
                        <span title={formatDateTimeLocal(enterprise.last_login)}>
                          {formatTimeAgo(enterprise.last_login)}
                        </span>
                      ) : 'Jamè konekte'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tranzaksyon Resan yo</h3>
              {enterprise.recent_transactions && enterprise.recent_transactions.length > 0 ? (
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Referans
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tip
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kantite
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estati
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dat
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {enterprise.recent_transactions.slice(0, 10).map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{transaction.reference_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                              transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {transaction.status === 'completed' ? 'Konplè' :
                               transaction.status === 'pending' ? 'Tann' : 'Echwe'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span title={formatDateTimeLocal(transaction.created_at)}>
                              {formatTimeAgo(transaction.created_at)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Pa gen tranzaksyon yo nan istorik la</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tout Tranzaksyon yo</h3>
            <p className="text-gray-600">Fonksyonalite pou jesyon tranzaksyon yo ap vini...</p>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Dokiman Biznis</h3>
            {enterprise.business_documents && enterprise.business_documents.length > 0 ? (
              <div className="space-y-4">
                {enterprise.business_documents.map((doc) => (
                  <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{doc.document_type}</h4>
                        <p className="text-sm text-gray-500">Nimewo: {doc.document_number}</p>
                        <p className="text-sm text-gray-500">Telechaje: {formatDate(doc.uploaded_at)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          doc.verification_status === 'verified' ? 'bg-green-100 text-green-800' :
                          doc.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {doc.verification_status === 'verified' ? 'Verifye' :
                           doc.verification_status === 'pending' ? 'Tann' : 'Rejte'}
                        </span>
                        {doc.file_url && (
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-900 text-sm"
                          >
                            Gade
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Pa gen dokiman yo telechaje</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Istorik Aktivite</h3>
            {enterprise.login_history && enterprise.login_history.length > 0 ? (
              <div className="space-y-4">
                {enterprise.login_history.slice(0, 20).map((login, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {login.success ? 'Koneksyon Siksè' : 'Koneksyon Echwe'}
                      </p>
                      <p className="text-xs text-gray-500">IP: {login.ip_address}</p>
                      <p className="text-xs text-gray-500">{login.user_agent}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">{formatDate(login.timestamp)}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        login.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {login.success ? 'Siksè' : 'Echwe'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Pa gen aktivite nan istorik la</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Paramèt Kont</h3>
            <p className="text-gray-600">Fonksyonalite paramèt yo ap vini...</p>
          </div>
        )}
      </div>
    </div>
  )
}
