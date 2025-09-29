'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

interface VerificationData {
  email: string
  code: string
}

function VerifyEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState<VerificationData>({
    email: '',
    code: ''
  })
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Get email from URL parameters
  useEffect(() => {
    const emailFromUrl = searchParams.get('email')
    if (emailFromUrl) {
      setFormData(prev => ({ ...prev, email: emailFromUrl }))
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/verify-email/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Email konfime ak siksè! Kounye a ou ka konekte.')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        setError(data.error || 'Erè nan konfime email la')
      }
    } catch (error) {
      setError('Erè nan koneksyon ak sèvè a')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!formData.email) {
      setError('Antre email ou an dabò')
      return
    }

    setResendLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/resend-verification/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Nouvo kòd voye nan email ou!')
      } else {
        setError(data.error || 'Erè nan voye nouvo kòd la')
      }
    } catch (error) {
      setError('Erè nan koneksyon ak sèvè a')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-primary-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Cash Ti <span className="text-primary-600">Machann</span>
          </h1>
          <h2 className="text-xl text-gray-300 mb-6">Konfime Email ou</h2>
          <p className="text-gray-400 text-sm">
            Nou voye yon kòd nan email ou{formData.email ? ` (${formData.email})` : ''}. 
            Antre kòd la pou konfime kont ou.
          </p>
        </div>

        {/* Verification Form */}
        <div className="bg-dark-800/50 backdrop-blur-sm p-8 rounded-xl border border-primary-600/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!!searchParams.get('email')} // Disable if email comes from URL
                className="w-full px-4 py-3 rounded-lg bg-dark-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent disabled:bg-dark-800 disabled:text-gray-500"
                placeholder="Antre email ou"
              />
            </div>

            {/* Verification Code */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-2">
                Kòd Konfimme (6 chif)
              </label>
              <input
                id="code"
                type="text"
                required
                maxLength={6}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                className="w-full px-4 py-3 rounded-lg bg-dark-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                placeholder="000000"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/20 border border-red-600/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {message && (
              <div className="bg-green-900/20 border border-green-600/50 text-green-400 px-4 py-3 rounded-lg text-sm">
                {message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formData.email || !formData.code || formData.code.length !== 6}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 focus:ring-offset-dark-800"
            >
              {loading ? 'Konfime...' : 'Konfime Email'}
            </button>

            {/* Resend Code */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendLoading || !formData.email}
                className="text-primary-600 hover:text-primary-500 disabled:text-gray-600 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                {resendLoading ? 'Ap voye...' : 'Pa resevwa kòd la? Voye nouvo kòd'}
              </button>
            </div>
          </form>
        </div>

        {/* Back to Login */}
        <div className="text-center">
          <Link href="/login" className="text-gray-400 hover:text-gray-300 text-sm">
            ← Retounen nan koneksyon
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-300">Chajman...</div>}>
      <VerifyEmailForm />
    </Suspense>
  )
}
