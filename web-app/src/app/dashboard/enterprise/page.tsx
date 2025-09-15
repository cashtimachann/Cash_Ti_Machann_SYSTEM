'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUserCoreData, formatTimeAgo } from '../../utils/useUserCoreData'

export default function EnterpriseDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [unauthorized, setUnauthorized] = useState(false)
  const router = useRouter()

  const { loading: coreLoading, userData, transactions, stats, refreshAll, requestVerification } = useUserCoreData({ role: 'enterprise' })

  useEffect(() => {
    const checkEnterpriseAccess = async () => {
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        router.push('/login')
        return
      }

      try {
        const response = await fetch('http://127.0.0.1:8000/api/auth/profile/', {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const userData = await response.json()
          
          // Check if user is enterprise
          if (userData.user.user_type === 'enterprise') {
            setAuthorized(true)
          } else {
            // Show unauthorized message for a moment before redirecting
            setUnauthorized(true)
            setTimeout(() => {
              // Redirect to appropriate dashboard based on user type
              switch (userData.user.user_type) {
                case 'admin':
                  router.push('/dashboard/admin')
                  break
                case 'client':
                  router.push('/dashboard/client')
                  break
                case 'agent':
                  router.push('/dashboard/agent')
                  break
                default:
                  router.push('/login')
              }
            }, 3000) // Show message for 3 seconds
          }
        } else {
          localStorage.removeItem('auth_token')
          router.push('/login')
        }
      } catch (error) {
        console.error('Error checking enterprise access:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkEnterpriseAccess()
  }, [router])

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (token) {
        await fetch('http://127.0.0.1:8000/api/auth/logout/', {
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

  const businessStats = {
    monthlyRevenue: 450890,
    totalTransactions: 2847,
    activeEmployees: 12,
    pendingPayments: 8
  }

  const verificationStatus = userData?.profile?.verification_status
  const showRequestVerification = verificationStatus === 'pending'

  // Show loading spinner while checking access
  if (coreLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chajman done machann...</p>
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
                Ou pa gen otorizasyon pou aksè dashboard machann lan. Nou pral redirije w nan dashboard ki kòrèk la.
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

  // Don't render anything if not authorized
  if (!authorized) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-dark-950 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                <span className="hidden sm:inline">Cash Ti </span>
                <span className="text-primary-600">
                  <span className="sm:hidden">CTM</span>
                  <span className="hidden sm:inline">Machann</span>
                </span>
                <span className="hidden md:inline"> - Machann</span>
              </h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden md:block text-sm text-gray-300">
                Byenveni, <span className="font-medium text-white">Kòmèsyal ABC</span>
              </div>
              <div className="block md:hidden text-xs sm:text-sm text-gray-300">
                <span className="font-medium text-white">ABC</span>
              </div>
              <button 
                onClick={handleLogout}
                className="bg-primary-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm hover:bg-primary-700 transition-colors"
              >
                <span className="sm:hidden">Soti</span>
                <span className="hidden sm:inline">Dekonekte</span>
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
                { id: 'payments', label: 'Peman ak Vant', icon: '💰' },
                { id: 'invoices', label: 'Faktè', icon: '📄' },
                { id: 'employees', label: 'Anplwaye', icon: '👥' },
                { id: 'reports', label: 'Rapò Finansyè', icon: '📈' },
                { id: 'pos', label: 'Point de Vente', icon: '🏪' },
                { id: 'transfers', label: 'Vifman Bankè', icon: '🏦' },
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Apèsi Jeneral Machann</h2>
              {verificationStatus && (
                <div className="mb-4 flex items-center gap-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${verificationStatus === 'verified' ? 'bg-green-100 text-green-700' : verificationStatus === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>Verifikasyon: {verificationStatus}</span>
                  {showRequestVerification && (
                    <button
                      onClick={async () => { const ok = await requestVerification(); if (ok) { alert('Demann verifikasyon voye'); refreshAll(); } else { alert('Demann pa pase'); } }}
                      className="text-xs bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700"
                    >Mande Verifikasyon</button>
                  )}
                </div>
              )}
              {userData?.wallet && (
                <div className="mb-6 bg-white p-4 rounded-lg border shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Balans Wallet</p>
                    <p className="text-2xl font-bold text-gray-900">{userData.wallet.balance} {userData.wallet.currency}</p>
                  </div>
                  <button onClick={refreshAll} className="text-xs bg-gray-100 px-3 py-1 rounded hover:bg-gray-200">Refresh</button>
                </div>
              )}
              {/* Business Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Vant mwa sa a</p>
                      <p className="text-2xl font-bold text-gray-900">{businessStats.monthlyRevenue.toLocaleString()} HTG</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Tranzaksyon</p>
                      <p className="text-2xl font-bold text-gray-900">{businessStats.totalTransactions.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Anplwaye Aktif</p>
                      <p className="text-2xl font-bold text-gray-900">{businessStats.activeEmployees}</p>
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
                      <p className="text-sm font-medium text-gray-600">Peman ki Rete</p>
                      <p className="text-2xl font-bold text-gray-900">{businessStats.pendingPayments}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Aksyon Rapid</h3>
                  <div className="space-y-3">
                    <button className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors">
                      Kreye Faktè
                    </button>
                    <button className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
                      Aksepte Peman
                    </button>
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                      Vifman Bank
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Code Peman</h3>
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-4xl">📱</span>
                    </div>
                    <p className="text-sm text-gray-600 text-center">
                      Kliyan yo ka scan QR code la pou peye dirèkteman
                    </p>
                    <button className="mt-3 text-primary-600 text-sm hover:text-primary-700">
                      Jenere QR Code
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Rapò Rapid</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Vant jodi a:</span>
                      <span className="text-sm font-medium">15,670 HTG</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Komision:</span>
                      <span className="text-sm font-medium">234 HTG</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Net:</span>
                      <span className="text-sm font-medium text-green-600">15,436 HTG</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="mt-10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Dènye Tranzaksyon</h3>
                  <button onClick={refreshAll} className="text-xs text-primary-600 hover:underline">Mizajou</button>
                </div>
                {transactions.length === 0 ? (
                  <p className="text-sm text-gray-500">Pa gen tranzaksyon pou kounye a.</p>
                ) : (
                  <ul className="divide-y divide-gray-200 bg-white rounded-lg border">
                    {transactions.slice(0,10).map(t => (
                      <li key={t.id} className="px-4 py-3 flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium text-gray-800">{t.display_type || t.transaction_type}</p>
                          <p className="text-xs text-gray-500">{formatTimeAgo(t.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{t.amount} HTG</p>
                          <p className="text-xs text-gray-500">{t.status}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Peman ak Vant</h2>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600">Fonksyonalite jesyon peman yo ap vini...</p>
              </div>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Jesyon Faktè</h2>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600">Fonksyonalite jesyon faktè yo ap vini...</p>
              </div>
            </div>
          )}

          {activeTab === 'employees' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Jesyon Anplwaye</h2>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600">Fonksyonalite jesyon anplwaye yo ap vini...</p>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Rapò Finansyè</h2>
              <p className="text-sm text-gray-600 mb-2">Fonksyonalite rapò yo ap vin disponib byento.</p>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Tout Tranzaksyon</h2>
              {transactions.length === 0 ? <p className="text-sm text-gray-500">Pa gen tranzaksyon.</p> : (
                <div className="overflow-x-auto bg-white border rounded-lg">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Tip</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Montan</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Eta</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Lè</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transactions.map(t => (
                        <tr key={t.id}>
                          <td className="px-4 py-2">{t.display_type || t.transaction_type}</td>
                          <td className="px-4 py-2">{t.amount} HTG</td>
                          <td className="px-4 py-2">{t.status}</td>
                          <td className="px-4 py-2">{formatTimeAgo(t.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
