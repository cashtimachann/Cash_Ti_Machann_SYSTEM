'use client'

import { useState, useEffect } from 'react'

// Centralized API Base URL
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'

export default function AdminAgents() {
  const [agents, setAgents] = useState<any[]>([])
  const [agentsLoading, setAgentsLoading] = useState(false)
  const [agentsError, setAgentsError] = useState('')

  // Fetch agents & merchants (filtering from admin/users)
  const fetchAgents = async () => {
    setAgentsLoading(true)
    setAgentsError('')
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API_BASE}/api/auth/admin/users/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (res.ok) {
        const users = await res.json()
        setAgents(users.filter((u: any) => u.user_type === 'agent'))
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

  useEffect(() => {
    fetchAgents()
  }, [])

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Jesyon Ajan</h2>
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
  )
}