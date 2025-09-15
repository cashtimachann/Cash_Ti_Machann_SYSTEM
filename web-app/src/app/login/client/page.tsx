'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ClientLoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem('auth_token', data.token)
        
        // Check if user is client
        if (data.user.user_type === 'client') {
          router.push('/dashboard/client')
        } else {
          setError('Kont sa a pa yon kont kliyèn. Tanpri itilize bon tip koneksyon an.')
        }
      } else {
        setError(data.error || 'Erè nan koneksyon an')
      }
    } catch (error) {
      setError('Erè nan koneksyon ak sèvè a')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-blue-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Cash Ti <span className="text-blue-600">Machann</span>
          </h1>
          <h2 className="text-xl text-gray-300">Koneksyon Kliyèn</h2>
          <p className="text-sm text-gray-400 mt-2">Aksè kont kliyèn ou an</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-dark-800/50 backdrop-blur-sm p-6 rounded-lg border border-blue-600/20">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Email oswa Non Itilizatè
                </label>
                <input
                  id="email"
                  type="text"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-dark-700 text-white focus:outline-none focus:ring-blue-600 focus:border-blue-600"
                  placeholder="Tape email ou oswa non itilizatè ou"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                  Modpas
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-dark-700 text-white focus:outline-none focus:ring-blue-600 focus:border-blue-600"
                  placeholder="Tape modpas ou"
                />
                <div className="text-right mt-2">
                  <Link href="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300">
                    Bliye modpas?
                  </Link>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-600/50 text-red-400 px-4 py-3 rounded-lg text-sm mt-4">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-dark-800 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {loading ? 'Konekte...' : 'Konekte'}
            </button>
          </div>
        </form>

        {/* Register Link */}
        <div className="text-center">
          <p className="text-gray-300">
            Pa gen kont? {' '}
            <Link href="/register" className="text-blue-600 hover:text-blue-500 font-medium">
              Enskri kounye a
            </Link>
          </p>
          <p className="text-xs text-gray-500 mt-3">Bezwen èd? <Link href="/forgot-password" className="text-blue-400 hover:text-blue-300">Reyinisyalize modpas</Link></p>
        </div>

        {/* Back to General Login */}
        <div className="text-center">
          <Link href="/login" className="text-gray-400 hover:text-gray-300 text-sm">
            ← Retounen nan koneksyon jeneral la
          </Link>
        </div>
      </div>
    </div>
  )
}
