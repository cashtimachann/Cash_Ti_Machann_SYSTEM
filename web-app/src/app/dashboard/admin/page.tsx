'use client'

import { useState, useEffect } from 'react'

// Centralized API Base URL
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'

export default function AdminOverview() {
  // Dashboard stats and activity
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState('')
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [recentLoading, setRecentLoading] = useState(false)
  const [recentError, setRecentError] = useState('')
  
  // Pagination states for activities
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalActivities, setTotalActivities] = useState(0)
  const activitiesPerPage = 10

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
  const fetchRecentActivity = async (page = 1) => {
    setRecentLoading(true)
    setRecentError('')
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API_BASE}/api/auth/admin/recent-activity/?page=${page}&per_page=${activitiesPerPage}`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (res.ok) {
        const data = await res.json()
        setRecentActivity(data.activities || [])
        setTotalActivities(data.total || 0)
        setTotalPages(Math.ceil((data.total || 0) / activitiesPerPage))
        setCurrentPage(page)
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

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && !recentLoading) {
      fetchRecentActivity(newPage)
    }
  }

  const handleRefresh = () => {
    fetchRecentActivity(currentPage)
  }

  useEffect(() => {
    fetchDashboardStats()
    fetchRecentActivity()
  }, [])

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Apèsi Jeneral</h2>

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
              <div className="w-6 h-6 text-blue-600">👥</div>
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
              <div className="w-6 h-6 text-green-600">🧑‍💼</div>
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
              <div className="w-6 h-6 text-purple-600">🏪</div>
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
            <div className="p-2 bg-yellow-100 rounded-lg">
              <div className="w-6 h-6 text-yellow-600">💳</div>
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
            <div className="p-2 bg-green-100 rounded-lg">
              <div className="w-6 h-6 text-green-600">💰</div>
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
            <div className="p-2 bg-orange-100 rounded-lg">
              <div className="w-6 h-6 text-orange-600">⏳</div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Apwobasyon an atant</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? '...' : (dashboardStats?.pendingApprovals ?? '—')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Aktivite Resan</h3>
            {totalActivities > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {totalActivities} aktivite total • Paj {currentPage} nan {totalPages}
              </p>
            )}
          </div>
          <button 
            onClick={handleRefresh}
            disabled={recentLoading}
            className="px-3 py-1 text-sm bg-primary-50 text-primary-600 rounded-md hover:bg-primary-100 transition-colors disabled:opacity-50"
          >
            {recentLoading ? 'Chajman...' : 'Aktyalize'}
          </button>
        </div>
        <div className="p-6">
          {recentLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Chajman aktivite yo...</p>
            </div>
          ) : recentError ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-600 mb-4">Echèk chajman aktivite yo</p>
              <button 
                onClick={handleRefresh}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Eseye ankò
              </button>
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={`activity-${index}`} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-b-0">
                  <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-2 ${
                    activity.type === 'transaction' ? 'bg-green-500' :
                    activity.type === 'document' ? 'bg-blue-500' :
                    activity.type === 'client' ? 'bg-purple-500' :
                    activity.type === 'agent' ? 'bg-orange-500' :
                    activity.type === 'enterprise' ? 'bg-indigo-500' :
                    'bg-gray-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-sm text-gray-900 font-medium">{activity.action || 'Aktivite san deskripsyon'}</p>
                      {activity.type && (
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          activity.type === 'transaction' ? 'bg-green-100 text-green-700' :
                          activity.type === 'document' ? 'bg-blue-100 text-blue-700' :
                          activity.type === 'client' ? 'bg-purple-100 text-purple-700' :
                          activity.type === 'agent' ? 'bg-orange-100 text-orange-700' :
                          activity.type === 'enterprise' ? 'bg-indigo-100 text-indigo-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {activity.type === 'transaction' ? 'Tranzaksyon' :
                           activity.type === 'document' ? 'Dokiman' :
                           activity.type === 'client' ? 'Kliyan' :
                           activity.type === 'agent' ? 'Ajan' :
                           activity.type === 'enterprise' ? 'Antrepriz' :
                           activity.type}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.user && (
                        <span>
                          {activity.user}
                          {activity.amount && <span className="ml-2 font-semibold text-green-600">({activity.amount})</span>}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="inline-flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {activity.time || 'Dat pa disponib'}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500 mb-2">Pa gen aktivite resan</p>
              <p className="text-sm text-gray-400">Aktivite yo ap parèt isit la lè gen aksyon nan sistèm lan</p>
            </div>
          )}
        </div>
        
        {/* Pagination Controls */}
        {recentActivity.length > 0 && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Montre aktivite {((currentPage - 1) * activitiesPerPage) + 1} nan {Math.min(currentPage * activitiesPerPage, totalActivities)} nan {totalActivities} total
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || recentLoading}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anvan
                </button>
                
                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        disabled={recentLoading}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                          pageNum === currentPage
                            ? 'bg-primary-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-100 disabled:opacity-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || recentLoading}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Apre
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}