'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

// Centralized API Base URL
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'

const navigationItems = [
  { id: 'overview', label: 'Apèsi Jeneral', icon: '📊', href: '/dashboard/admin' },
  { id: 'users', label: 'Jesyon Kliyan', icon: '👥', href: '/dashboard/admin/users' },
  { id: 'transactions', label: 'Tranzaksyon', icon: '💳', href: '/dashboard/admin/transactions' },
  { id: 'agents', label: 'Ajan Otorize', icon: '🧑‍💼', href: '/dashboard/admin/agents' },
  { id: 'merchants', label: 'Ti Machann', icon: '🏪', href: '/dashboard/admin/merchants' },
  { id: 'finance', label: 'Finans', icon: '💰', href: '/dashboard/admin/finance' },
  { id: 'reports', label: 'Rapò', icon: '📈', href: '/dashboard/admin/reports' },
  { id: 'security', label: 'Sekirite', icon: '🔒', href: '/dashboard/admin/security' },
  { id: 'settings', label: 'Paramèt', icon: '⚙️', href: '/dashboard/admin/settings' }
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [unauthorized, setUnauthorized] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    router.push('/login')
  }

  useEffect(() => {
    const checkAdminAccess = async () => {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        router.push('/login')
        return
      }
      try {
        const response = await fetch(`${API_BASE}/api/auth/profile/`, {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const userData = await response.json()
          
          // Check if user is admin
          if (userData.user.user_type === 'admin') {
            setAuthorized(true)
          } else {
            // Show unauthorized message for a moment before redirecting
            setUnauthorized(true)
            setTimeout(() => {
              // Redirect to appropriate dashboard based on user type
              switch (userData.user.user_type) {
                case 'client':
                  router.push('/dashboard/client')
                  break
                case 'agent':
                  router.push('/dashboard/agent')
                  break
                case 'enterprise':
                  router.push('/dashboard/enterprise')
                  break
                default:
                  router.push('/login')
              }
            }, 3000) // Show message for 3 seconds
          }
        } else {
          // Invalid token
          localStorage.removeItem('auth_token')
          router.push('/login')
        }
      } catch (error) {
        console.error('Error checking admin access:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAdminAccess()
  }, [router])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifikasyon otorizasyon...</p>
        </div>
      </div>
    )
  }

  // Unauthorized state
  if (unauthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 text-5xl mb-4">🚫</div>
            <h2 className="text-xl font-bold text-red-800 mb-2">Aksè Entèdi</h2>
            <p className="text-red-700 mb-4">
              Ou pa gen otorizasyon pou aksè paj admin nan. W ap redirije nan dashboard ou an nan kèk segonn.
            </p>
            <div className="text-sm text-red-600">
              Redireksyon nan 3 segonn...
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Not authorized yet - don't render anything
  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chajman...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-dark-950 shadow-sm flex-shrink-0">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden mr-3 p-2 rounded-md text-white hover:bg-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-white">
                Cash Ti <span className="text-primary-600">Machann</span> - Admin
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-300">
                Byenveni, <span className="font-medium text-white">Admin</span>
              </div>
              <button 
                onClick={handleLogout}
                className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-700 transition-colors"
              >
                Dekonekte
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)}></div>
          <nav className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-lg z-50 overflow-y-auto">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Menu</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <ul className="space-y-2">
                {navigationItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${
                        pathname === item.href
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm flex-shrink-0 overflow-y-auto hidden lg:block">
          <div className="p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${
                      pathname === item.href
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}