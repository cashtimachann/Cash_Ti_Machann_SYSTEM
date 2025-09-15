'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-primary-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Cash Ti <span className="text-primary-600">Machann</span>
          </h1>
          <h2 className="text-xl text-gray-300">Konekte nan kont ou</h2>
        </div>

        {/* User Type Selection */}
        <div className="bg-dark-800/50 backdrop-blur-sm p-1 rounded-lg border border-primary-600/20">
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => router.push('/login/client')}
              className="py-2 px-3 rounded-md text-sm font-medium transition-colors text-gray-300 hover:text-white hover:bg-blue-600/20"
            >
              Kliyan
            </button>
            <button
              onClick={() => router.push('/login/agent')}
              className="py-2 px-3 rounded-md text-sm font-medium transition-colors text-gray-300 hover:text-white hover:bg-green-600/20"
            >
              Ajan
            </button>
            <button
              onClick={() => router.push('/login/enterprise')}
              className="py-2 px-3 rounded-md text-sm font-medium transition-colors text-gray-300 hover:text-white hover:bg-yellow-600/20"
            >
              Machann
            </button>
          </div>
        </div>

        {/* Login Instructions */}
        <div className="bg-dark-800/50 backdrop-blur-sm p-8 rounded-xl border border-primary-600/20 text-center">
          <h3 className="text-lg font-medium text-white mb-4">Chwazi tip kont ou</h3>
          <p className="text-gray-300 text-sm">
            Klike sou yon nan tab yo anwo a pou konekte ak kont ou.
          </p>
        </div>

        {/* Register Link - Client Only */}
        <div className="text-center">
          <p className="text-gray-300">
            Pa gen kont kliyèn? {' '}
            <Link href="/register" className="text-primary-600 hover:text-primary-500 font-medium">
              Enskri kounye a
            </Link>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Kont Ajan ak Machann yo kreye sèlman pa Administratè a
          </p>
          <div className="text-center text-xs text-gray-500">
            <Link href="/forgot-password" className="text-blue-400 hover:text-blue-300">Bliye modpas ou?</Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link href="/" className="text-gray-400 hover:text-gray-300 text-sm">
            ← Retounen nan paj akèy la
          </Link>
        </div>
      </div>
    </div>
  )
}
