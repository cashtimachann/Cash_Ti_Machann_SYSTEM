'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function ResetPasswordInner() {
  const search = useSearchParams()
  const router = useRouter()
  const uid = search.get('uid') || ''
  const token = search.get('token') || ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [score, setScore] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!uid || !token) {
      setError('Paramèt lyen yo pa konplè. Tanpri verifye imèl ou a ankò.')
    }
  }, [uid, token])

  const computeScore = (pwd: string) => {
    let s = 0
    if (pwd.length >= 8) s++
    if (/[A-Z]/.test(pwd)) s++
    if (/[a-z]/.test(pwd)) s++
    if (/\d/.test(pwd)) s++
    if (/[^A-Za-z0-9]/.test(pwd)) s++
    if (pwd.length >= 12) s++
    return s
  }

  useEffect(() => {
    setScore(computeScore(newPassword))
  }, [newPassword])

  const validate = () => {
    if (!uid || !token) {
      setError('Lyen reset la pa valab (uid/token manke).')
      return false
    }
    const requirements = [
      { test: newPassword.length >= 8, msg: 'Omwen 8 karaktè' },
      { test: /[A-Z]/.test(newPassword), msg: 'Yon lèt majiskil' },
      { test: /[a-z]/.test(newPassword), msg: 'Yon lèt miniskil' },
      { test: /\d/.test(newPassword), msg: 'Yon chif' },
      { test: /[^A-Za-z0-9]/.test(newPassword), msg: 'Yon siy espesyal' }
    ]
    const failed = requirements.filter(r => !r.test)
    if (failed.length) {
      setError('Modpas pa satisfè kondisyon yo.')
      return false
    }
    if (newPassword !== confirmPassword) {
      setError('De modpas yo pa menm.')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validate()) return
    setSubmitting(true)
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'
      const resp = await fetch(`${base}/api/auth/password-reset/confirm/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, token, new_password: newPassword, confirm_password: confirmPassword })
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) {
        setError(data.error || 'Echèk nan mete nouvo modpas la.')
      } else {
        setSuccess(true)
        setTimeout(() => router.push('/login'), 2500)
      }
    } catch (e: any) {
      setError('Erè rezo. Eseye ankò.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reyinisyalize Modpas</h1>
        <p className="text-sm text-gray-600 mb-6">Antre nouvo modpas ou pou kont ou a.</p>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            Modpas mete ajou ak siksè. W ap redirije...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nouvo Modpas</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Antre nouvo modpas"
                disabled={success}
                required
              />
              <button type="button" onClick={() => setShowPw(p => !p)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 text-xs">
                {showPw ? 'Kache' : 'Montre'}
              </button>
            </div>
            <div className="mt-3 space-y-1">
              <div className="h-2 w-full bg-gray-200 rounded">
                <div className={`h-2 rounded transition-all duration-300 ${
                  score <= 2 ? 'bg-red-500 w-1/5' : score === 3 ? 'bg-yellow-500 w-2/5' : score === 4 ? 'bg-yellow-400 w-3/5' : score === 5 ? 'bg-green-500 w-4/5' : 'bg-green-600 w-full'
                }`}></div>
              </div>
              <p className="text-xs text-gray-500">Fòs: {score <= 2 ? 'Fèb' : score === 3 ? 'Mwayen' : score === 4 ? 'Bon' : score === 5 ? 'Fò' : 'Ekselan'}</p>
            </div>
            <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-gray-600">
              <li className={newPassword.length >= 8 ? 'text-green-600' : ''}>• 8+ karaktè</li>
              <li className={/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}>• Majiskil</li>
              <li className={/[a-z]/.test(newPassword) ? 'text-green-600' : ''}>• Miniskil</li>
              <li className={/\d/.test(newPassword) ? 'text-green-600' : ''}>• Chif</li>
              <li className={/[^A-Za-z0-9]/.test(newPassword) ? 'text-green-600' : ''}>• Siy espesyal</li>
              <li className={newPassword.length >= 12 ? 'text-green-600' : ''}>• 12+ opsyonèl</li>
            </ul>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Konfime Nouvo Modpas</label>
            <div className="relative">
              <input
                type={showPw2 ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Repete modpas la"
                disabled={success}
                required
              />
              <button type="button" onClick={() => setShowPw2(p => !p)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 text-xs">
                {showPw2 ? 'Kache' : 'Montre'}
              </button>
            </div>
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="mt-1 text-xs text-red-600">De modpas yo pa koresponn.</p>
            )}
          </div>
          <button
            type="submit"
            disabled={submitting || success}
            className={`w-full py-2.5 rounded-md text-white text-sm font-medium transition-colors ${submitting || success ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}
          >
            {submitting ? 'Ap trete...' : success ? 'Modpas Chanje' : 'Mete Modpas la'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/login')}
            className="text-sm text-primary-600 hover:text-primary-700"
            disabled={submitting}
          >
            Tounen nan koneksyon
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Ap chaje...</div>}>
      <ResetPasswordInner />
    </Suspense>
  )
}
