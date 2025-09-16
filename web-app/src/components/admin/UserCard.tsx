import React from 'react'
import Link from 'next/link'

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  date_joined: string
  user_type: string
  profile?: {
    phone?: string
    kyc_status?: string
  }
  phone_number?: string
  wallet?: {
    balance?: string | number
  }
}

interface UserCardProps {
  user: User
  onToggleStatus: (userId: number, currentStatus: boolean) => void
  onViewDetails: (userId: number) => void
}

const UserCard: React.FC<UserCardProps> = React.memo(({ user, onToggleStatus, onViewDetails }) => {
  const handleToggleStatus = () => {
    onToggleStatus(user.id, user.is_active)
  }

  const handleViewDetails = () => {
    onViewDetails(user.id)
  }

  const getKycStatusInfo = (status?: string) => {
    const kycStatus = status || 'pending'
    switch (kycStatus) {
      case 'verified':
        return { label: 'Verifye', className: 'bg-green-100 text-green-800' }
      case 'rejected':
        return { label: 'Rejte', className: 'bg-red-100 text-red-800' }
      default:
        return { label: 'Ann Tann', className: 'bg-yellow-100 text-yellow-800' }
    }
  }

  const kycInfo = getKycStatusInfo(user.profile?.kyc_status)
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
  const phone = user.profile?.phone || user.phone_number || 'Pa gen'
  const balance = user.wallet?.balance || '0.00'
  const formattedDate = user.date_joined 
    ? new Date(user.date_joined).toLocaleDateString('fr-HT', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }) 
    : 'Pa gen'

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
      <div className="flex items-center mb-3">
        <div className="h-11 w-11 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
          {user.first_name?.[0] || user.username[0]}{user.last_name?.[0] || ''}
        </div>
        <div className="ml-3 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">{fullName}</div>
          <div className="text-xs text-gray-500 truncate">@{user.username}</div>
        </div>
        <div className="ml-auto">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${
            user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {user.is_active ? 'Aktif' : 'Inaktif'}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="text-gray-500">Email</div>
        <div className="text-gray-900 truncate" title={user.email}>{user.email}</div>
        
        <div className="text-gray-500">Telefòn</div>
        <div className="text-gray-900 truncate">{phone}</div>
        
        <div className="text-gray-500">KYC</div>
        <div>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${kycInfo.className}`}>
            {kycInfo.label}
          </span>
        </div>
        
        <div className="text-gray-500">Dat</div>
        <div className="text-gray-900 truncate">{formattedDate}</div>
        
        <div className="text-gray-500">Balans</div>
        <div className="text-gray-900 font-medium">{balance} HTG</div>
      </div>
      
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <Link 
          href={`/dashboard/admin/client/${user.id}`} 
          className="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Wè Detay
        </Link>
        <button 
          onClick={handleViewDetails}
          className="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Rezime
        </button>
        {user.user_type !== 'admin' && (
          <button 
            onClick={handleToggleStatus}
            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold shadow-sm ${
              user.is_active 
                ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10 hover:bg-red-100' 
                : 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/10 hover:bg-green-100'
            }`}
          >
            {user.is_active ? 'Dezaktive' : 'Aktive'}
          </button>
        )}
      </div>
    </div>
  )
})

UserCard.displayName = 'UserCard'

export default UserCard