import React from 'react'

interface FilterChipsProps {
  filterStatus: string
  filterKYCStatus: string
  onStatusChange: (status: string) => void
  onKYCStatusChange: (status: string) => void
  onResetFilters: () => void
}

const FilterChips: React.FC<FilterChipsProps> = React.memo(({
  filterStatus,
  filterKYCStatus,
  onStatusChange,
  onKYCStatusChange,
  onResetFilters
}) => {
  const handleActiveClick = () => {
    onStatusChange(filterStatus === 'active' && filterKYCStatus === 'all' ? 'all' : 'active')
  }

  const handleInactiveClick = () => {
    onStatusChange(filterStatus === 'inactive' && filterKYCStatus === 'all' ? 'all' : 'inactive')
  }

  const handleVerifiedClick = () => {
    onKYCStatusChange(filterKYCStatus === 'verified' ? 'all' : 'verified')
  }

  const handlePendingClick = () => {
    onKYCStatusChange(filterKYCStatus === 'pending' ? 'all' : 'pending')
  }

  const handleAllClick = () => {
    onResetFilters()
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={handleActiveClick}
        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
          filterStatus === 'active' 
            ? 'bg-green-50 text-green-700 border-green-200' 
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
      >
        Aktif
      </button>
      <button
        onClick={handleInactiveClick}
        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
          filterStatus === 'inactive' 
            ? 'bg-red-50 text-red-700 border-red-200' 
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
      >
        Inaktif
      </button>
      <button
        onClick={handleVerifiedClick}
        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
          filterKYCStatus === 'verified' 
            ? 'bg-green-50 text-green-700 border-green-200' 
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
      >
        KYC Verifye
      </button>
      <button
        onClick={handlePendingClick}
        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
          filterKYCStatus === 'pending' 
            ? 'bg-yellow-50 text-yellow-700 border-yellow-200' 
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
      >
        KYC Ann Tann
      </button>
      <button
        onClick={handleAllClick}
        className="px-3 py-1.5 rounded-full text-xs font-medium border bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
      >
        Tout
      </button>
    </div>
  )
})

FilterChips.displayName = 'FilterChips'

export default FilterChips