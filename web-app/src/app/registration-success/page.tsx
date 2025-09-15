'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface RegistrationResponse {
  message: string
  user_id: string
  verification_required: boolean
}

export default function RegistrationSuccessPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleResendCode = async () => {
    if (!email) {
      setError('Antre email ou an dabò')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/resend-verification/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Nouvo kòd konfimme voye nan email ou')
      } else {
        setError(data.error || 'Erè nan voye nouvo kòd la')
      }
    } catch (error) {
      setError('Erè nan koneksyon ak sèvè a')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-primary-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Cash Ti <span className="text-primary-600">Machann</span>
          </h1>
          <h2 className="text-xl text-green-400 mb-6">Enskripsyon Reyisi!</h2>
        </div>

        {/* Success Message */}
        <div className="bg-dark-800/50 backdrop-blur-sm p-8 rounded-xl border border-green-600/20">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-white">
              Kont ou kreye ak siksè!
            </h3>
            <p className="text-gray-300">
              Nou voye yon kòd konfimme nan email ou an. Tcheke email ou ak konfime kont la pou aktive li.
            </p>

            {/* Email for resend */}
            <div className="pt-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email ou (pou voye nouvo kòd)
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-dark-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                placeholder="Antre email ou"
              />
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-900/20 border border-red-600/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-900/20 border border-green-600/50 text-green-400 px-4 py-3 rounded-lg text-sm">
                {message}
              </div>
            )}

            {/* Resend Button */}
            <button
              onClick={handleResendCode}
              disabled={loading || !email}
              className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-dark-800"
            >
              {loading ? 'Voye...' : 'Voye Nouvo Kòd Konfimme'}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            href="/verify-email"
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 focus:ring-offset-dark-800 block text-center"
          >
            Konfime Email Kounye a
          </Link>

          <Link
            href="/login"
            className="w-full bg-dark-700 hover:bg-dark-600 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-dark-800 block text-center"
          >
            Ale nan Koneksyon
          </Link>
        </div>

        {/* Instructions */}
        <div className="bg-blue-900/20 border border-blue-600/50 text-blue-400 p-4 rounded-lg text-sm">
          <h4 className="font-semibold mb-2">Kisa pou fè kounye a:</h4>
          <ol className="list-decimal list-inside space-y-1">
            <li>Tcheke email ou (ak spam/junk tou)</li>
            <li>Jwenn email nan ak kòd 6 chif la</li>
            <li>Antre kòd la nan paj konfimme a</li>
            <li>Konte ou ap aktive ak ou ka kòmanse itilize li</li>
          </ol>
        </div>

        {/* Help */}
        <div className="text-center text-gray-400 text-sm">
          Bezwen èd? 
          <a href="mailto:support@cashtimachann.com" className="text-primary-600 hover:text-primary-500 ml-1">
            Kontakte nou
          </a>
        </div>
      </div>
    </div>
  )
}
