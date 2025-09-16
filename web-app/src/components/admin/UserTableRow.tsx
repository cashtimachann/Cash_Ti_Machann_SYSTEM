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

interface UserTableRowProps {
  user: User
  density: 'regular' | 'compact'
  onToggleStatus: (userId: number, currentStatus: boolean) => void
  onViewDetails: (userId: number) => void
}

const UserTableRow: React.FC<UserTableRowProps> = React.memo(({ 
  user, 
  density, 
  onToggleStatus, 
  onViewDetails 
}) => {
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
        return { 
          label: '✓ Verifye', 
          className: 'bg-green-100 text-green-800 ring-1 ring-inset ring-green-600/20' 
        }
      case 'rejected':
        return { 
          label: '✗ Rejte', 
          className: 'bg-red-100 text-red-800 ring-1 ring-inset ring-red-600/20' 
        }
      default:
        return { 
          label: '⏳ Ann Tann', 
          className: 'bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-600/20' 
        }
    }
  }

  const kycInfo = getKycStatusInfo(user.profile?.kyc_status)
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim()
  const phone = user.profile?.phone || user.phone_number || 'Pa gen'
  const balance = user.wallet?.balance || '0.00'
  const cellPadding = density === 'compact' ? 'py-2' : 'py-4'
  const formattedDate = user.date_joined 
    ? new Date(user.date_joined).toLocaleDateString('fr-HT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) 
    : 'Pa gen'

  return (
    <tr className="hover:bg-gray-50 transition-colors duration-150">
      <td className={`${cellPadding} pl-4 pr-3 text-sm sm:pl-6`}>
        <div className="flex items-center min-w-0">
          <div className="h-11 w-11 flex-shrink-0">
            <div className="h-11 w-11 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center shadow-sm">
              <span className="text-sm font-semibold text-white">
                {user.first_name?.[0] || user.username[0]}{user.last_name?.[0] || ''}
              </span>
            </div>
          </div>
          <div className="ml-4 min-w-0 flex-1">
            <div className="font-medium text-gray-900 text-sm truncate">
              {fullName || user.username}
            </div>
            <div className="text-gray-500 text-xs truncate">@{user.username}</div>
          </div>
        </div>
      </td>
      
      <td className={`px-3 ${cellPadding} text-sm text-gray-500`}>
        <div className="text-gray-900 truncate max-w-[160px]" title={user.email}>
          {user.email}
        </div>
      </td>
      
      <td className={`px-3 ${cellPadding} text-sm text-gray-500`}>
        <div className="text-gray-900 truncate">{phone}</div>
      </td>
      
      <td className={`px-3 ${cellPadding} text-sm text-gray-500`}>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${kycInfo.className}`}>
          {kycInfo.label}
        </span>
      </td>
      
      <td className={`px-3 ${cellPadding} text-sm text-gray-500`}>
        <div className="text-gray-900 truncate">{formattedDate}</div>
      </td>
      
      <td className={`px-3 ${cellPadding} text-sm text-gray-500`}>
        <div className="text-gray-900 font-medium truncate">{balance} HTG</div>
      </td>
      
      <td className={`px-3 ${cellPadding} text-sm text-gray-500`}>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${
          user.is_active 
            ? 'bg-green-100 text-green-800 ring-1 ring-inset ring-green-600/20' 
            : 'bg-red-100 text-red-800 ring-1 ring-inset ring-red-600/20'
        }`}>
          {user.is_active ? '● Aktif' : '● Inaktif'}
        </span>
      </td>
      
      <td className={`relative ${cellPadding} pl-3 pr-4 text-right text-sm font-medium sm:pr-6`}>
        <div className="flex items-center justify-end space-x-1 flex-wrap gap-1">
          <Link
            href={`/dashboard/admin/client/${user.id}`}
            className="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            Wè Detay
          </Link>
          <button
            onClick={handleViewDetails}
            className="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            Rezime
          </button>
          {user.user_type !== 'admin' && (
            <button
              onClick={handleToggleStatus}
              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold shadow-sm transition-colors whitespace-nowrap ${
                user.is_active 
                  ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10 hover:bg-red-100' 
                  : 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/10 hover:bg-green-100'
              }`}
            >
              {user.is_active ? 'Dezaktive' : 'Aktive'}
            </button>
          )}
        </div>
      </td>
    </tr>
  )
})

UserTableRow.displayName = 'UserTableRow'

export default UserTableRow