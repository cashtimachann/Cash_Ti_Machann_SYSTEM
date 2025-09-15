'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (!email.trim()) { setError('Tanpri antre yon email.'); return }
    setSubmitting(true)
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'
      const resp = await fetch(`${base}/api/auth/forgot-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok && data.error) {
        setError(data.error)
      } else {
        setMessage(data.message || 'Si email egziste, nou voye yon lyen reset.')
      }
    } catch (e:any) {
      setError('Erè rezo. Eseye ankò.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Bliye Modpas</h1>
        <p className="text-sm text-gray-600 mb-6">Antre email kont ou pou nou voye yon lyen pou mete nouvo modpas.</p>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        {message && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="ex: user@domeen.com"
              required
              disabled={submitting}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-2.5 rounded-md text-white text-sm font-medium transition-colors ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}
          >
            {submitting ? 'Ap voye...' : 'Voye Lyen Reset'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => router.push('/login')} className="text-sm text-primary-600 hover:text-primary-700">Retounen nan koneksyon</button>
        </div>
      </div>
    </div>
  )
}
