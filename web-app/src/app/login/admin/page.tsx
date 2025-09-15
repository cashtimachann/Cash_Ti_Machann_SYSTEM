'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    twoFactorCode: ''
  })
  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!showTwoFactor) {
      // First step: validate email and password
      setLoading(true)
      
      try {
        const response = await fetch('http://127.0.0.1:8000/api/auth/login/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          }),
        })

        const data = await response.json()

        if (response.ok) {
          // Check if user is admin
          if (data.user.user_type === 'admin') {
            // Store token temporarily (will be finalized after 2FA)
            sessionStorage.setItem('temp_admin_token', data.token)
            setShowTwoFactor(true)
          } else {
            setError('Aksè refize: Ou pa gen otorizasyon admin')
          }
        } else {
          setError(data.error || 'Erè nan koneksyon an')
        }
      } catch (error) {
        setError('Erè nan koneksyon ak sèvè a')
      } finally {
        setLoading(false)
      }
    } else {
      // Second step: validate 2FA code (mock validation for now)
      if (formData.twoFactorCode && formData.twoFactorCode.length === 6) {
        // For now, accept any 6-digit code as valid 2FA
        // In production, this would validate against a real 2FA system
        const tempToken = sessionStorage.getItem('temp_admin_token')
        if (tempToken) {
          localStorage.setItem('auth_token', tempToken)
          sessionStorage.removeItem('temp_admin_token')
          router.push('/dashboard/admin')
        }
      } else {
        setError('Kòd 2FA dwe gen 6 chif')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-primary-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Cash Ti <span className="text-primary-600">Machann</span>
          </h1>
          <h2 className="text-xl text-gray-300">Aksè Administratè</h2>
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-600/20 text-primary-400 border border-primary-600/30">
            🔒 Sekirite Segondè Obligatwa
          </div>
        </div>

        {/* Admin Login Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="bg-dark-800/50 backdrop-blur-sm p-8 rounded-xl border border-primary-600/20">
            {error && (
              <div className="mb-4 p-3 bg-red-600/20 border border-red-600/30 rounded-md">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {!showTwoFactor ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                    Email Admin
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    disabled={loading}
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent disabled:opacity-50"
                    placeholder="admin@cashtimachann.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                    Mo de Pas Admin
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    disabled={loading}
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent disabled:opacity-50"
                    placeholder="••••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 focus:ring-offset-dark-800 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Verifikasyon...
                    </>
                  ) : (
                    'Kontinye ak 2FA'
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">📱</span>
                  </div>
                  <h3 className="text-lg font-medium text-white">Otentifikasyon 2 Faktè</h3>
                  <p className="text-sm text-gray-400 mt-2">
                    Antre kòd 6 chif ki nan aplikasyon otentifikatè ou an
                  </p>
                </div>

                <div>
                  <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-300 mb-1">
                    Kòd 2FA
                  </label>
                  <input
                    id="twoFactorCode"
                    name="twoFactorCode"
                    type="text"
                    maxLength={6}
                    required
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent text-center text-2xl tracking-widest"
                    placeholder="000000"
                    value={formData.twoFactorCode}
                    onChange={(e) => setFormData({ ...formData, twoFactorCode: e.target.value.replace(/\D/g, '') })}
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowTwoFactor(false)}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Retounen
                  </button>
                  <button
                    type="submit"
                    disabled={formData.twoFactorCode.length !== 6}
                    className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                  >
                    Konekte
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Security Notice */}
        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-yellow-400 mr-2">⚠️</span>
            <div>
              <h4 className="text-sm font-medium text-yellow-400">Avètisman Sekirite</h4>
              <p className="text-xs text-yellow-200 mt-1">
                Aksè admin yo gen otorizasyon total nan sistèm nan. Pa pataje enfòmasyon konekte ou yo ak okenn moun.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Regular Login */}
        <div className="text-center">
          <Link href="/login" className="text-gray-400 hover:text-gray-300 text-sm">
            ← Retounen nan koneksyon regilye a
          </Link>
        </div>
      </div>
    </div>
  )
}
