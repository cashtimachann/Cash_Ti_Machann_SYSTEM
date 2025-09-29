'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import BackButton from '@/app/components/BackButton'
import { COUNTRY_CODES, ALLOWED_REGISTRATION_COUNTRIES } from '../../../../../utils/countryCodes'
import { formatDateTimeLocal } from '@/utils/datetime'

interface User {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  user_type: string
  is_active: boolean
  date_joined: string
  last_login: string
  profile?: {
    phone: string
    date_of_birth: string
    address: string
    verification_status: string
    kyc_status: string
    email_verified: boolean
    phone_verified: boolean
    is_email_verified?: boolean
    is_phone_verified?: boolean
    city?: string
    country?: string
    residence_country_code?: string
    residence_country_name?: string
    residence_country_display?: string
    country_display?: string
  }
  wallet?: {
    balance: string
    currency: string
    is_active: boolean
    created_at: string
  }
  recent_transactions?: Array<{
    id: string
    type: string
    amount: number
    description: string
    status: string
    created_at: string
    reference_number: string
  }>
  activity_history?: Array<{
    type: string
    timestamp: string
    ip_address?: string
    user_agent?: string
    meta?: any
  }>
  identity_documents?: Array<{
    id: string
    document_type: string
    document_number: string
    issue_date: string
    expiry_date: string
    issuing_authority: string
    status: 'pending' | 'verified' | 'rejected'
    uploaded_at: string
    verified_at?: string
    rejection_reason?: string
    front_image_url?: string
    back_image_url?: string
  }>
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  // Filters for transactions tab + CSV export
  const [txFilter, setTxFilter] = useState<{ type: string; startDate: string; endDate: string; minAmount: string; maxAmount: string }>({
    type: 'all',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: ''
  })
  const activityTypeLabels: Record<string,string> = {
    login_success: 'Login Reyisi',
    login_fail: 'Login Echwe',
    password_change: 'Chanjman Modpas',
    password_reset: 'Reset Modpas',
    two_factor_enabled: '2FA Aktive',
    two_factor_disabled: '2FA Dezaktive',
    email_change: 'Chanjman Imèl',
    phone_change: 'Chanjman Telefòn',
  }
  const formatRelative = (iso?: string | null) => {
    if (!iso) return null
    try {
      const dt = new Date(iso)
      const diffMs = Date.now() - dt.getTime()
      const mins = Math.floor(diffMs / 60000)
      if (mins < 1) return 'Kounye a'
      if (mins < 60) return `${mins} min pase`
      const hours = Math.floor(mins / 60)
      if (hours < 24) return `${hours} è pase`
      const days = Math.floor(hours / 24)
      if (days < 30) return `${days} jou pase`
      const months = Math.floor(days / 30)
      if (months < 12) return `${months} mwa pase`
      const years = Math.floor(months / 12)
      return `${years} ane pase`
    } catch {
      return null
    }
  }
  const [showEditModal, setShowEditModal] = useState(false)
  const [showEditDocumentModal, setShowEditDocumentModal] = useState(false)
  const [editDocumentData, setEditDocumentData] = useState<any>(null)
  const [frontImageFile, setFrontImageFile] = useState<File | null>(null)
  const [backImageFile, setBackImageFile] = useState<File | null>(null)
  const [frontPreview, setFrontPreview] = useState<string | null>(null)
  const [backPreview, setBackPreview] = useState<string | null>(null)
  const [docImageError, setDocImageError] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    address: '',
    city: '',
    residence_country_code: '',
    is_active: true
  })
  const [saving, setSaving] = useState(false)
  const [processingDocument, setProcessingDocument] = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectingDocumentId, setRejectingDocumentId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  // Basic UUID v4-ish pattern (allows flexibility; backend uses UUID primary key)
  const uuidRegex = /^[0-9a-fA-F-]{6,}$/

  useEffect(() => {
    if (!params.id) return
    // Early validate ID format to avoid unnecessary backend roundtrip
    if (!uuidRegex.test(String(params.id))) {
      setError('ID itilizatè a pa nan fòma valab')
      setLoading(false)
      return
    }
    fetchUserDetails()
  }, [params.id])

  const fetchUserDetails = async () => {
    if (!params.id) {
      console.error('No user ID provided')
      setError('Pa gen ID itilizatè ki bay')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        console.error('No authentication token found')
        setError('Pa gen otorizasyon. Konekte ankò.')
        router.push('/login')
        return
      }

  console.log('[ClientDetail] Fetching user details', { id: String(params.id) })
      const response = await fetch(`http://127.0.0.1:8000/api/auth/admin/user-details/${params.id}/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      })

  console.log('[ClientDetail] Response status', response.status)

      if (response.ok) {
        let userData: any = null
        try {
          userData = await response.json()
        } catch (e) {
          console.error('[ClientDetail] JSON parse error', e)
          setError('Erè nan entèprete repons sèvè a')
          setLoading(false)
          return
        }
        console.log('[ClientDetail] User data received')
        setUser(userData)
        setError(null)
      } else {
        let errorText: string | null = null
        try { errorText = await response.text() } catch { /* ignore */ }
  console.error('[ClientDetail] Failed to fetch user details', { status: response.status, body: errorText })
        if (response.status === 401) {
          setError('Otorizasyon an ekspire. Konekte ankò.')
          setTimeout(() => router.push('/login'), 2000)
        } else if (response.status === 404) {
          setError('Itilizatè a pa jwenn oswa li te efase.')
        } else {
          setError(`Erè nan chajman detay itilizatè a (${response.status})`)
        }
      }
    } catch (error) {
      console.error('[ClientDetail] Network or runtime error fetching user details', error)
      setError('Erè nan koneksyon ak sèvè a. Verifye koneksyon entènèt ou.')
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async () => {
    if (!user) return
    
    const action = user.is_active ? 'dezaktive' : 'aktive'
    if (!confirm(`Èske ou sèten ou vle ${action} kont ${user.first_name} ${user.last_name}?`)) return

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://127.0.0.1:8000/api/auth/admin/toggle-user-status/${user.id}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        await fetchUserDetails()
        alert(`Kont la ${action} ak siksè`)
      } else {
        alert(`Erè nan ${action} kont la`)
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
      alert(`Erè nan ${action} kont la`)
    }
  }

  const initiatePasswordReset = async () => {
    if (!user) return
    if (!confirm('Ou vle voye yon imèl reset modpas pou itilizatè sa a?')) return
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) { alert('Sesyon ekspire. Rekonekte.'); return }
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'
      const resp = await fetch(`${base}/api/auth/admin/reset-password/${user.id}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
      })
      let data: any = {}
      try { data = await resp.json() } catch { /* ignore */ }
      if (!resp.ok) {
        alert(data.error || 'Echèk pandan lansman reset la')
        return
      }
      alert('Imèl reset modpas la voye.')
    } catch (e:any) {
      console.error(e)
      alert('Erè rezo pandan reset la')
    }
  }

  // Approve document
  const approveDocument = async (documentId: string) => {
    if (!user || !confirm('Èske ou sèten ou vle aksepte dokiman sa a?')) return

    const isLegacy = documentId.startsWith('doc_profile_')
    if (!isLegacy) {
      // Optimistic UI only for real IdentityDocument records
      setUser(prev => {
        if (!prev) return prev
        return {
          ...prev,
            identity_documents: (prev.identity_documents || []).map(doc =>
              doc.id === documentId ? { ...doc, status: 'verified', rejection_reason: null, verified_at: new Date().toISOString() } : doc
            )
        }
      })
    }

    setProcessingDocument(documentId)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://127.0.0.1:8000/api/auth/admin/approve-document/${user.id}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'approve', document_id: isLegacy ? undefined : documentId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert('Erè nan aksepte dokiman an: ' + (errorData.error || 'Erè enkoni'))
        // Revert optimistic change on failure
        await fetchUserDetails()
      } else {
        // Optionally refetch to ensure server truth (kept for consistency)
        await fetchUserDetails()
      }
    } catch (error) {
      console.error('Error approving document:', error)
      alert('Erè nan aksepte dokiman an')
      // Revert by refetching
      await fetchUserDetails()
    } finally {
      setProcessingDocument(null)
    }
  }

  // Reject document
  const rejectDocument = async () => {
    if (!user || !rejectingDocumentId || !rejectionReason.trim()) {
      alert('Tanpri bay yon rezon pou rejte dokiman an')
      return
    }

    const docId = rejectingDocumentId
    const isLegacy = docId.startsWith('doc_profile_')
    const reason = rejectionReason
    if (!isLegacy) {
      setUser(prev => {
        if (!prev) return prev
        return {
          ...prev,
          identity_documents: (prev.identity_documents || []).map(doc =>
            doc.id === docId ? { ...doc, status: 'rejected', rejection_reason: reason } : doc
          )
        }
      })
    }

    setProcessingDocument(docId)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://127.0.0.1:8000/api/auth/admin/reject-document/${user.id}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason, document_id: isLegacy ? undefined : docId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert('Erè nan rejte dokiman an: ' + (errorData.error || 'Erè enkoni'))
        await fetchUserDetails() // revert to server state
      } else {
        // Success: clean modal state & sync
        setShowRejectModal(false)
        setRejectionReason('')
        setRejectingDocumentId(null)
        await fetchUserDetails()
      }
    } catch (error) {
      console.error('Error rejecting document:', error)
      alert('Erè nan rejte dokiman an')
      await fetchUserDetails()
    } finally {
      setProcessingDocument(null)
    }
  }

  // (Removed downloadDocument function and related UI buttons as per request)

  // Open edit document modal
  const openEditDocumentModal = (document: any) => {
    setEditDocumentData({ ...document })
    setShowEditDocumentModal(true)
  }

  // Handle edit document input change
  const handleEditDocumentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditDocumentData((prev: any) => ({ ...prev, [name]: value }))
  }

  // Save document changes
  const saveDocumentChanges = async () => {
    if (!user || !editDocumentData) return
    setSaving(true)
    try {
      const token = localStorage.getItem('auth_token')
      let response: Response
      // If any image changed, use multipart
      if (frontImageFile || backImageFile) {
        const formData = new FormData()
        formData.append('document_type', editDocumentData.document_type || '')
        formData.append('document_number', editDocumentData.document_number || '')
        if (editDocumentData.issuing_authority) formData.append('issuing_authority', editDocumentData.issuing_authority)
        if (editDocumentData.issue_date) formData.append('issue_date', editDocumentData.issue_date)
        if (editDocumentData.expiry_date) formData.append('expiry_date', editDocumentData.expiry_date)
        if (frontImageFile) formData.append('front_image', frontImageFile)
        if (backImageFile) formData.append('back_image', backImageFile)
        response = await fetch(`http://127.0.0.1:8000/api/auth/admin/update-document/${user.id}/${editDocumentData.id}/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Token ${token}`,
          },
          body: formData
        })
      } else {
        response = await fetch(`http://127.0.0.1:8000/api/auth/admin/update-document/${user.id}/${editDocumentData.id}/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editDocumentData)
        })
      }
      if (response.ok) {
        await fetchUserDetails()
        setShowEditDocumentModal(false)
        // Clean previews
        if (frontPreview) URL.revokeObjectURL(frontPreview)
        if (backPreview) URL.revokeObjectURL(backPreview)
        setFrontPreview(null)
        setBackPreview(null)
        setFrontImageFile(null)
        setBackImageFile(null)
        alert('Dokiman modifye ak siksè')
      } else {
        let errorText = ''
        try { const err = await response.json(); errorText = err.message || JSON.stringify(err) } catch { errorText = response.statusText }
        alert(`Erè nan chanjman dokiman an: ${errorText || 'Erè enkoni'}`)
      }
    } catch (error) {
      console.error('Error updating document:', error)
      alert('Erè nan chanjman dokiman yo')
    } finally {
      setSaving(false)
    }
  }

  // Open reject modal
  const openRejectModal = (documentId: string) => {
    setRejectingDocumentId(documentId)
    setShowRejectModal(true)
  }

  const openEditModal = () => {
    if (!user) return
    
    setEditFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.profile?.phone || '',
      date_of_birth: user.profile?.date_of_birth || '',
      address: user.profile?.address || '',
      city: user.profile?.city || '',
      residence_country_code: user.profile?.residence_country_code || '',
      is_active: user.is_active
    })
    setShowEditModal(true)
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const saveUserChanges = async () => {
    if (!user) return
    
    setSaving(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://127.0.0.1:8000/api/auth/admin/update-user/${user.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData)
      })

      if (response.ok) {
        await fetchUserDetails()
        setShowEditModal(false)
        alert('Enfòmasyon kliyan an chanje ak siksè')
      } else {
        const errorData = await response.json()
        alert(`Erè nan chanjman an: ${errorData.message || 'Erè enkoni'}`)
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Erè nan chanjman enfòmasyon yo')
    } finally {
      setSaving(false)
    }
  }

  // Helpers for transaction filtering and export
  const getFilteredTransactions = () => {
    const list = user?.recent_transactions || []
    const type = (txFilter.type || 'all').toLowerCase()
    const hasType = type !== 'all'
    const start = txFilter.startDate ? new Date(txFilter.startDate) : null
    const end = txFilter.endDate ? new Date(txFilter.endDate) : null
    if (end) end.setHours(23,59,59,999)
    const minAmt = txFilter.minAmount !== '' ? parseFloat(txFilter.minAmount) : null
    const maxAmt = txFilter.maxAmount !== '' ? parseFloat(txFilter.maxAmount) : null
    return list.filter((t) => {
      try {
        const created = t.created_at ? new Date(t.created_at) : null
        const amt = typeof t.amount === 'number' ? t.amount : parseFloat(String(t.amount || '0'))
        const typeOk = !hasType || String(t.type || '').toLowerCase() === type
        const startOk = !start || (created && created >= start)
        const endOk = !end || (created && created <= end)
        const minOk = minAmt === null || (!isNaN(amt) && amt >= minAmt)
        const maxOk = maxAmt === null || (!isNaN(amt) && amt <= maxAmt)
        return typeOk && startOk && endOk && minOk && maxOk
      } catch {
        return false
      }
    })
  }

  const exportFilteredTransactionsCSV = () => {
    const rows = getFilteredTransactions().map((t) => [
      t.created_at || '',
      t.type || '',
      t.description || '',
      t.amount ?? '' ,
      t.status || '',
      t.reference_number || ''
    ])
    const header = ['Date', 'Type', 'Description', 'Amount', 'Status', 'Reference']
    const csv = [header, ...rows]
      .map(r => r.map(v => {
        const s = String(v).replaceAll('"', '""')
        return /[",\n]/.test(s) ? `"${s}"` : s
      }).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `client_${user?.username || 'user'}_transactions.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Credit or debit the wallet (admin action)
  const adjustWallet = async (operation: 'credit' | 'debit') => {
    if (!user) return
    const label = operation === 'credit' ? 'mete' : 'retire'
    const raw = prompt(`Antre montan pou ${label} nan pòtmonnè a (HTG)`) || ''
    if (!raw.trim()) return
    const amount = parseFloat(raw.replace(',', '.'))
    if (isNaN(amount) || amount <= 0) {
      alert('Montan pa valid')
      return
    }
    if (operation === 'debit' && user.wallet && parseFloat(user.wallet.balance) < amount) {
      alert('Balance pa sifi')
      return
    }

    // Optimistic balance update
    const prevUser = user
    if (user.wallet) {
      setUser(prev => prev ? ({
        ...prev,
        wallet: {
          ...prev.wallet!,
          balance: (operation === 'credit'
            ? (parseFloat(prev.wallet!.balance) + amount)
            : (parseFloat(prev.wallet!.balance) - amount)
          ).toFixed(2)
        }
      }) : prev)
    }

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://127.0.0.1:8000/api/auth/admin/wallet-adjust/${user.id}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ operation, amount: amount.toFixed(2) })
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        alert('Erè nan operasyon pòtmonnè a: ' + (err.error || 'Erè enkoni'))
        setUser(prevUser)
      } else {
        // Always refetch full user details to sync derived info
        await fetchUserDetails()
        alert('Operasyon fèt ak siksè')
      }
    } catch (e) {
      console.error('Wallet adjust error', e)
      alert('Erè koneksyon')
      setUser(prevUser)
    }
  }

  // Helper to render activity rows
  const renderActivityHistory = () => {
    if (!user) return null
    const list = user.activity_history || []
    if (!list.length) {
      return <div className="text-sm text-gray-500">Pa gen aktivite anrejistre pou kounye a.</div>
    }
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Lè</th>
              <th className="py-2 pr-4">Tip</th>
              <th className="py-2 pr-4">IP</th>
              <th className="py-2 pr-4">Rezilta</th>
            </tr>
          </thead>
          <tbody>
            {list.slice(0, 40).map((a, idx) => {
              const label = activityTypeLabels[a.type] || a.type
              let result: string | null = null
              if (a.type === 'login_success') result = 'Siksè'
              else if (a.type === 'login_fail') result = 'Echwe'
              else if (a.type.startsWith('password')) result = 'Ranpli'
              return (
                <tr key={idx} className="border-b last:border-none hover:bg-gray-50">
                  <td className="py-2 pr-4 whitespace-nowrap">{formatDateTimeLocal(a.timestamp)}</td>
                  <td className="py-2 pr-4">{label}</td>
                  <td className="py-2 pr-4">{a.ip_address || '-'}</td>
                  <td className="py-2 pr-4">{result || '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  

  // Toggle wallet active status
  const toggleWallet = async () => {
    if (!user || !user.wallet) return
    const action = user.wallet.is_active ? 'bloke' : 'debloke'
    if (!confirm(`Èske ou sèten ou vle ${action} pòtmonnè sa a?`)) return
    const prevUser = user
    setUser(prev => prev ? ({ ...prev, wallet: { ...prev.wallet!, is_active: !prev.wallet!.is_active } }) : prev)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://127.0.0.1:8000/api/auth/admin/wallet-toggle/${user.id}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        alert('Erè nan chanjman estati pòtmonnè a: ' + (err.error || 'Erè enkoni'))
        setUser(prevUser)
      } else {
        const data = await response.json()
        setUser(prev => prev ? ({ ...prev, wallet: data.wallet }) : prev)
        alert(data.message || 'Estati pòtmonnè a chanje')
      }
    } catch (e) {
      console.error('Wallet toggle error', e)
      alert('Erè koneksyon')
      setUser(prevUser)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chajman detay kliyan an...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-100 rounded-full p-3 mx-auto w-16 h-16 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Erè nan chajman</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          {error.includes('pa jwenn') && (
            <div className="bg-yellow-50 text-left text-sm text-yellow-800 border border-yellow-200 rounded-md p-3 mb-4">
              <p className="font-medium mb-1">Kisa pou w fè?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Verifye si itilizatè a toujou egziste nan lis kliyan yo.</li>
                <li>Aktualize paj lis kliyan yo epi eseye ankò.</li>
                <li>Si itilizatè a te efase dènyèman, retire nenpòt ti fich oswa lyen sove.</li>
              </ul>
            </div>
          )}
          <div className="space-y-3">
            <button
              onClick={() => fetchUserDetails()}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Eseye ankò
            </button>
            <Link 
              href="/dashboard/admin"
              className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Retounen nan jesyon kliyan yo
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Kliyan pa jwenn</h2>
          <Link href="/dashboard/admin" className="text-primary-600 hover:text-primary-700">
            Retounen nan jesyon kliyan yo
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm w-full">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 sm:py-6 gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <BackButton className="text-gray-400 hover:text-gray-600 transition-colors text-sm sm:text-base" />
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm sm:text-lg font-medium text-primary-600">
                    {user.first_name?.[0]}{user.last_name?.[0]}
                  </span>
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                    {user.first_name} {user.last_name}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500">@{user.username}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-start sm:justify-end gap-2 sm:gap-3 overflow-x-auto">
              <span className={`inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap ${
                user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {user.is_active ? 'Aktif' : 'Inaktif'}
              </span>
              <span className={`inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap ${
                user.user_type === 'client' ? 'bg-blue-100 text-blue-800' :
                user.user_type === 'agent' ? 'bg-green-100 text-green-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {user.user_type === 'client' ? 'Kliyan' :
                user.user_type === 'agent' ? 'Ajan' : 'Machann'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white border-b w-full">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={openEditModal}
              className="w-full sm:w-auto px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm font-medium transition-colors"
            >
              Modifye Enfòmasyon
            </button>
            
            <button
              onClick={toggleUserStatus}
              className={`w-full sm:w-auto px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                user.is_active 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {user.is_active ? 'Dezaktive Kont' : 'Aktive Kont'}
            </button>
            
            <button
              onClick={initiatePasswordReset}
              className="w-full sm:w-auto px-4 py-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-md text-sm font-medium transition-colors"
            >
              Reset Password
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b w-full">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-2 sm:gap-8 overflow-x-auto scrollbar-hide">
            {[
              { id: 'overview', label: 'Rezime' },
              { id: 'transactions', label: 'Tranzaksyon yo' },
              { id: 'wallet', label: 'Pòtmonnè' },
              { id: 'profile', label: 'Pwofil' },
              { id: 'documents', label: 'Dokiman' },
              { id: 'security', label: 'Sekirite' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 sm:py-4 px-3 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-2 sm:px-4 lg:px-6 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            {/* Overview Cards */}
            <div className="xl:col-span-2 space-y-6">
              {/* Account Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Enfòmasyon Kont</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="mt-1 text-sm text-gray-900 break-words">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Telefòn</label>
                    <p className="mt-1 text-sm text-gray-900">{user.profile?.phone || 'Pa gen'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Dat Kreyasyon</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDateTimeLocal(user.date_joined, { year: 'numeric', month: '2-digit', day: '2-digit' })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Dènye Koneksyon</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {user.last_login ? (
                        <span title={formatDateTimeLocal(user.last_login)}>
                          {formatRelative(user.last_login)}
                        </span>
                      ) : 'Pa janm konekte'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Tranzaksyon Resan yo</h3>
                {user.recent_transactions && user.recent_transactions.length > 0 ? (
                  <div className="space-y-3">
                    {user.recent_transactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b border-gray-100 last:border-b-0 space-y-2 sm:space-y-0">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{transaction.type}</p>
                          <p className="text-xs text-gray-500">{transaction.description}</p>
                          <p className="text-xs text-gray-400">
                            {formatDateTimeLocal(transaction.created_at, { year: 'numeric', month: '2-digit', day: '2-digit' })}
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className={`text-sm font-medium ${
                            transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount} HTG
                          </p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status === 'completed' ? 'Konplè' :
                             transaction.status === 'pending' ? 'An atant' : 'Echwe'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Pa gen tranzaksyon yo</p>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Wallet Summary */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Pòtmonnè</h3>
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {user.wallet?.balance || '0.00'} HTG
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Balans Total</p>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Estati:</span>
                      <span className={`font-medium ${
                        user.wallet?.is_active ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {user.wallet?.is_active ? 'Aktif' : 'Inaktif'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-gray-500">Monè:</span>
                      <span className="font-medium">{user.wallet?.currency || 'HTG'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification Status */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Estati Verifikasyon</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Email</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      (user.profile?.email_verified ?? user.profile?.is_email_verified) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {(user.profile?.email_verified ?? user.profile?.is_email_verified) ? 'Verifye' : 'Pa verifye'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Telefòn</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      (user.profile?.phone_verified ?? user.profile?.is_phone_verified) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {(user.profile?.phone_verified ?? user.profile?.is_phone_verified) ? 'Verifye' : 'Pa verifye'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">KYC</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.profile?.kyc_status === 'verified' ? 'bg-green-100 text-green-800' :
                      user.profile?.kyc_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {user.profile?.kyc_status === 'verified' ? 'Verifye' :
                       user.profile?.kyc_status === 'pending' ? 'An atant' : 'Pa kòmanse'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other tab contents */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Tout Tranzaksyon yo</h3>
            </div>
            <div className="p-4 sm:p-6">
              {/* Filters + Export */}
              <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Dat kòmansman</label>
                    <input type="date" value={txFilter.startDate} onChange={(e)=>setTxFilter({...txFilter, startDate: e.target.value})}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Dat fen</label>
                    <input type="date" value={txFilter.endDate} onChange={(e)=>setTxFilter({...txFilter, endDate: e.target.value})}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tip</label>
                    <select value={txFilter.type} onChange={(e)=>setTxFilter({...txFilter, type: e.target.value})}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-600">
                      <option value="all">Tout</option>
                      <option value="send">Voye</option>
                      <option value="receive">Resevwa</option>
                      <option value="deposit">Depo</option>
                      <option value="withdraw">Retire</option>
                      <option value="topup">Top-up</option>
                      <option value="bill">Peman Bòdwo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Montan min</label>
                    <input type="number" inputMode="decimal" value={txFilter.minAmount} onChange={(e)=>setTxFilter({...txFilter, minAmount: e.target.value})}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Montan max</label>
                    <input type="number" inputMode="decimal" value={txFilter.maxAmount} onChange={(e)=>setTxFilter({...txFilter, maxAmount: e.target.value})}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-600" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>setTxFilter({ type:'all', startDate:'', endDate:'', minAmount:'', maxAmount:'' })}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm">Reyinisyalize</button>
                    <button onClick={exportFilteredTransactionsCSV}
                      className="px-3 py-1.5 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm whitespace-nowrap">Ekspòte CSV</button>
                  </div>
                </div>
              </div>
              {user.recent_transactions && user.recent_transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dat</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lè</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tip</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deskripsyon</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montan</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estati</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referans</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {getFilteredTransactions().map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDateTimeLocal(transaction.created_at, { year: 'numeric', month: '2-digit', day: '2-digit' })}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDateTimeLocal(transaction.created_at, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.type}
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-sm text-gray-900">
                            <div className="max-w-xs truncate">{transaction.description}</div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <span className={transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                              {transaction.amount > 0 ? '+' : ''}{transaction.amount} HTG
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                              transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {transaction.status === 'completed' ? 'Konplè' :
                               transaction.status === 'pending' ? 'An atant' : 'Echwe'}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="max-w-xs truncate">{transaction.reference_number}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Pa gen tranzaksyon yo</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Detay Pòtmonnè</h3>
              <div className="space-y-4">
                <div className="text-center py-6 border border-gray-200 rounded-lg bg-gray-50">
                  <p className="text-3xl sm:text-4xl font-bold text-gray-900">
                    {user.wallet?.balance || '0.00'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{user.wallet?.currency || 'HTG'}</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Estati</label>
                    <p className={`mt-1 text-sm font-medium ${
                      user.wallet?.is_active ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {user.wallet?.is_active ? 'Aktif' : 'Inaktif'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Dat Kreyasyon</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {user.wallet?.created_at ? formatDateTimeLocal(user.wallet.created_at, { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'Pa gen'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Aksyon Pòtmonnè</h3>
              <div className="space-y-3">
                <button onClick={() => adjustWallet('credit')} className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  Ajoute Lajan
                </button>
                <button onClick={() => adjustWallet('debit')} className="w-full bg-red-50 text-red-700 hover:bg-red-100 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  Retire Lajan
                </button>
                <button onClick={toggleWallet} className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  user.wallet?.is_active 
                    ? 'bg-red-50 text-red-700 hover:bg-red-100' 
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}>
                  {user.wallet?.is_active ? 'Bloke Pòtmonnè' : 'Debloke Pòtmonnè'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Enfòmasyon Pwofil</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">Non Konplè</label>
                <p className="mt-1 text-sm text-gray-900">{user.first_name} {user.last_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <p className="mt-1 text-sm text-gray-900 break-words">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Telefòn</label>
                <p className="mt-1 text-sm text-gray-900">{user.profile?.phone || 'Pa gen'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Dat Nesans</label>
                <p className="mt-1 text-sm text-gray-900">
                  {user.profile?.date_of_birth ? formatDateTimeLocal(user.profile.date_of_birth, { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'Pa gen'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Peyi Rezidans</label>
                <p className="mt-1 text-sm text-gray-900">
                  {user.profile?.residence_country_display || user.profile?.country_display || user.profile?.country || 'Pa gen'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Dènye Koneksyon</label>
                <p className="mt-1 text-sm text-gray-900">
                  {user.last_login
                    ? (
                      <span title={formatDateTimeLocal(user.last_login)}>
                        {formatRelative(user.last_login)}
                      </span>
                    ) : 'Pa janm konekte'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Vil</label>
                <p className="mt-1 text-sm text-gray-900">{user.profile?.city || 'Pa gen'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500">Adrès</label>
                <p className="mt-1 text-sm text-gray-900">{user.profile?.address || 'Pa gen'}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="mb-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Dokiman Idantite</h3>
              </div>
              
              {user.identity_documents && user.identity_documents.length > 0 ? (
                <div className="space-y-4">
                  {user.identity_documents.map((document) => {
                    const isLegacyDoc = (document?.id || '').toString().startsWith('doc_profile_')
                    const canEdit = !isLegacyDoc
                    return (
                    <div key={document.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-sm transition-shadow">
                      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-4 space-y-4 lg:space-y-0">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-2 space-y-2 sm:space-y-0">
                            <h4 className="text-sm sm:text-md font-medium text-gray-900">
                              {document.document_type === 'national_id' ? 'Kat Idantite Nasyonal' :
                               document.document_type === 'passport' ? 'Paspò' :
                               document.document_type === 'driving_license' ? 'Pèmi Kondui' :
                               document.document_type === 'birth_certificate' ? 'Akt Nesans' :
                               document.document_type}
                            </h4>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              document.status === 'verified' ? 'bg-green-100 text-green-800' :
                              document.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {document.status === 'verified' ? 'Verifye' :
                               document.status === 'pending' ? 'An Atant' : 'Rejte'}
                            </span>
                            {isLegacyDoc && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                Eritaj (read-only)
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Nimewo:</span>
                              <span className="ml-2 font-medium text-gray-900 break-words">{document.document_number}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Otòrite:</span>
                              <span className="ml-2 font-medium text-gray-900">{document.issuing_authority}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Dat Emisyon:</span>
                              <span className="ml-2 font-medium text-gray-900">
                                {document.issue_date ? formatDateTimeLocal(document.issue_date, { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'Pa gen enfòmasyon'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Dat Ekspirasyon:</span>
                              <span className="ml-2 font-medium text-gray-900">
                                {document.expiry_date ? formatDateTimeLocal(document.expiry_date, { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'Pa gen enfòmasyon'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Dat Chaje:</span>
                              <span className="ml-2 font-medium text-gray-900">
                                {document.uploaded_at ? formatDateTimeLocal(document.uploaded_at, { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'Pa gen enfòmasyon'}
                              </span>
                            </div>
                            {document.verified_at && (
                              <div>
                                <span className="text-gray-500">Dat Verifikasyon:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                  {formatDateTimeLocal(document.verified_at, { year: 'numeric', month: '2-digit', day: '2-digit' })}
                                </span>
                              </div>
                            )}
                          </div>
                          {document.rejection_reason && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                              <p className="text-sm text-red-700">
                                <span className="font-medium">Rezon Rejte:</span> {document.rejection_reason}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Document Images */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                        {document.front_image_url && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Devan Dokiman</h5>
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                              <img 
                                src={document.front_image_url} 
                                alt="Devan dokiman"
                                className="w-full h-32 sm:h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(document.front_image_url, '_blank')}
                              />
                            </div>
                          </div>
                        )}
                        {document.back_image_url && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Dèyè Dokiman</h5>
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                              <img 
                                src={document.back_image_url} 
                                alt="Dèyè dokiman"
                                className="w-full h-32 sm:h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(document.back_image_url, '_blank')}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 mt-4 pt-4 border-t border-gray-200">
                        {canEdit && (
                          <button 
                            onClick={() => openEditDocumentModal(document)}
                            className="bg-primary-100 text-primary-700 hover:bg-primary-200 px-4 py-2 rounded-md text-sm transition-colors"
                          >
                            Modifye Dokiman
                          </button>
                        )}
                        {document.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => approveDocument(document.id)}
                              disabled={processingDocument === document.id}
                              className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                              {processingDocument === document.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Aksepte...
                                </>
                              ) : (
                                'Aksepte'
                              )}
                            </button>
                            <button 
                              onClick={() => openRejectModal(document.id)}
                              disabled={processingDocument === document.id}
                              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Rejte
                            </button>
                          </>
                        )}
                        {/* Wè Detay & Telechaje buttons removed */}
                        {/* Removed 'Mande Nouvo Verifikasyon' button as requested */}
                      </div>
                    </div>
                  )})}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Pa gen dokiman yo</h3>
                  <p className="text-gray-500 mb-4">Kliyan an poko soumèt okenn dokiman idantite.</p>
                  <button className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-700 transition-colors">
                    Mande Dokiman
                  </button>
                </div>
              )}
            </div>
            
            {/* Document Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {user.identity_documents?.filter(d => d.status === 'verified').length || 0}
                    </p>
                    <p className="text-sm text-gray-500">Dokiman Verifye</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {user.identity_documents?.filter(d => d.status === 'pending').length || 0}
                    </p>
                    <p className="text-sm text-gray-500">An Atant</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {user.identity_documents?.filter(d => d.status === 'rejected').length || 0}
                    </p>
                    <p className="text-sm text-gray-500">Rejte</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Estati Sekirite</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email Verifye</p>
                    <p className="text-xs text-gray-500">Kont email la konfime</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    user.profile?.email_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.profile?.email_verified ? 'Verifye' : 'Pa verifye'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Telefòn Verifye</p>
                    <p className="text-xs text-gray-500">Nimewo telefòn konfime</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    user.profile?.phone_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.profile?.phone_verified ? 'Verifye' : 'Pa verifye'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">KYC (Know Your Customer)</p>
                    <p className="text-xs text-gray-500">Verifikasyon idantite</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    user.profile?.kyc_status === 'verified' ? 'bg-green-100 text-green-800' :
                    user.profile?.kyc_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {user.profile?.kyc_status === 'verified' ? 'Verifye' :
                     user.profile?.kyc_status === 'pending' ? 'An atant' : 'Pa kòmanse'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Istorik Aktivite</h3>
              {renderActivityHistory()}
            </div>
          </div>
        )}

        {activeTab !== 'overview' && activeTab !== 'transactions' && activeTab !== 'wallet' && activeTab !== 'profile' && activeTab !== 'documents' && activeTab !== 'security' && activeTab !== 'activity' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600 text-center">
              Kontni {activeTab} ap vini nan yon veryon pi devan...
            </p>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Modifye Enfòmasyon Kliyan</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); saveUserChanges(); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prenom</label>
                  <input type="text" name="first_name" value={editFormData.first_name} onChange={handleEditInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Non Fanmi</label>
                  <input type="text" name="last_name" value={editFormData.last_name} onChange={handleEditInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input type="email" name="email" value={editFormData.email} onChange={handleEditInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefòn</label>
                  <input type="tel" name="phone" value={editFormData.phone} onChange={handleEditInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dat Nesans</label>
                  <input type="date" name="date_of_birth" value={editFormData.date_of_birth} onChange={handleEditInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vil</label>
                  <input type="text" name="city" value={editFormData.city} onChange={handleEditInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Peyi Rezidans</label>
                  <select
                    name="residence_country_code"
                    value={editFormData.residence_country_code}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">-- Chwazi --</option>
                    {COUNTRY_CODES.filter(c => ALLOWED_REGISTRATION_COUNTRIES.includes(c.code as any)).map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.nameKreol || c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" name="is_active" checked={editFormData.is_active} onChange={handleEditInputChange} className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                    <span className="text-sm font-medium text-gray-700">Kont Aktif</span>
                  </label>
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Adrès</label>
                <textarea name="address" value={editFormData.address} onChange={handleEditInputChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Adrès konplè kliyan an" />
              </div>
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button type="button" onClick={() => setShowEditModal(false)} className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" disabled={saving}>Anile</button>
                <button type="submit" disabled={saving} className={`w-full sm:w-auto px-4 py-2 rounded-md text-sm font-medium text-white transition-colors ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}>{saving ? 'K ap konsèv...' : 'Konsèv Chanjman yo'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Document Modal */}
      {showEditDocumentModal && editDocumentData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Modifye Dokiman Idantite</h3>
              <button onClick={() => { if(frontPreview) URL.revokeObjectURL(frontPreview); if(backPreview) URL.revokeObjectURL(backPreview); setFrontPreview(null); setBackPreview(null); setFrontImageFile(null); setBackImageFile(null); setShowEditDocumentModal(false) }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); saveDocumentChanges(); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tip Dokiman</label>
                  <select name="document_type" value={editDocumentData.document_type} onChange={handleEditDocumentInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" required>
                    <option value="national_id">Kat Idantite Nasyonal</option>
                    <option value="passport">Paspò</option>
                    <option value="driving_license">Pèmi Kondui</option>
                    <option value="birth_certificate">Akt Nesans</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nimewo Dokiman</label>
                  <input type="text" name="document_number" value={editDocumentData.document_number} onChange={handleEditDocumentInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Otòrite</label>
                  <input type="text" name="issuing_authority" value={editDocumentData.issuing_authority} onChange={handleEditDocumentInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dat Emisyon</label>
                  <input type="date" name="issue_date" value={editDocumentData.issue_date?.slice(0,10) || ''} onChange={handleEditDocumentInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dat Ekspirasyon</label>
                  <input type="date" name="expiry_date" value={editDocumentData.expiry_date?.slice(0,10) || ''} onChange={handleEditDocumentInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>

              {/* Image Uploads */}
              <div className="space-y-4 mb-6">
                <h4 className="text-sm font-medium text-gray-700">Imaj Dokiman</h4>
                {docImageError && <p className="text-xs text-red-600">{docImageError}</p>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Devan (Front)</label>
                    {frontPreview || editDocumentData.front_image_url ? (
                      <div className="mb-2 relative group">
                        <img
                          src={frontPreview || editDocumentData.front_image_url}
                          className="w-full h-40 object-cover rounded border"
                          alt="Front preview"
                        />
                        {frontPreview && (
                          <button type="button" onClick={() => { setFrontPreview(null); setFrontImageFile(null); }} className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Retire</button>
                        )}
                      </div>
                    ) : (
                      <div className="mb-2 h-40 flex items-center justify-center border border-dashed rounded text-xs text-gray-400">Pa gen imaj</div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        if (!/^image\//.test(file.type)) { setDocImageError('Fichye dwe yon imaj'); return }
                        if (file.size > 5 * 1024 * 1024) { setDocImageError('Imaj twò gwo (limit 5MB)'); return }
                        setDocImageError(null)
                        setFrontImageFile(file)
                        const url = URL.createObjectURL(file)
                        setFrontPreview(url)
                      }}
                      className="block w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Dyè (Back)</label>
                    {backPreview || editDocumentData.back_image_url ? (
                      <div className="mb-2 relative group">
                        <img
                          src={backPreview || editDocumentData.back_image_url}
                          className="w-full h-40 object-cover rounded border"
                          alt="Back preview"
                        />
                        {backPreview && (
                          <button type="button" onClick={() => { setBackPreview(null); setBackImageFile(null); }} className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Retire</button>
                        )}
                      </div>
                    ) : (
                      <div className="mb-2 h-40 flex items-center justify-center border border-dashed rounded text-xs text-gray-400">Pa gen imaj</div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        if (!/^image\//.test(file.type)) { setDocImageError('Fichye dwe yon imaj'); return }
                        if (file.size > 5 * 1024 * 1024) { setDocImageError('Imaj twò gwo (limit 5MB)'); return }
                        setDocImageError(null)
                        setBackImageFile(file)
                        const url = URL.createObjectURL(file)
                        setBackPreview(url)
                      }}
                      className="block w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { if(frontPreview) URL.revokeObjectURL(frontPreview); if(backPreview) URL.revokeObjectURL(backPreview); setFrontPreview(null); setBackPreview(null); setFrontImageFile(null); setBackImageFile(null); setShowEditDocumentModal(false) }} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Anile</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-50">{saving ? 'Ap sove...' : 'Sove Chanjman'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Document Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Rejte Dokiman</h3>
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectionReason('')
                  setRejectingDocumentId(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Tanpri eksplike rezon ki fè w ap rejte dokiman sa a:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ekri rezon rejte a..."
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectionReason('')
                  setRejectingDocumentId(null)
                }}
                className="w-full sm:flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Anile
              </button>
              <button
                onClick={rejectDocument}
                disabled={!rejectionReason.trim() || processingDocument === rejectingDocumentId}
                className="w-full sm:flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {processingDocument === rejectingDocumentId ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Rejte...
                  </>
                ) : (
                  'Rejte Dokiman'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
