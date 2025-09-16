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
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Aktivite Resan</h3>
        </div>
        <div className="p-6">
          {recentLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Chajman aktivite yo...</p>
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.slice(0, 10).map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex-shrink-0 w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description || 'Aktivite san deskripsyon'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.timestamp ? new Date(activity.timestamp).toLocaleString('fr-HT') : 'Dat pa disponib'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Pa gen aktivite resan</p>
          )}
        </div>
      </div>
    </div>
  )
}