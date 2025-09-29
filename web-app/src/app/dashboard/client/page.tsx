'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUserCoreData, formatTimeAgo } from '../../utils/useUserCoreData'
import { formatDateTimeLocal } from '@/utils/datetime'
import { Menu, QrCode, FileText, CreditCard, Receipt, Phone, Wallet, Zap, BarChart3, TrendingUp, DollarSign } from 'lucide-react'

// Function to format date and time (local timezone, single render)
const formatDateTime = (dateString: string): string => {
  try {
    return formatDateTimeLocal(dateString, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch (error) {
    return '—'
  }
}

// Simple translation system inline
type LanguageCode = 'kreyol' | 'french' | 'english' | 'spanish'

const translations = {
  kreyol: {
    'language_settings': 'Paramèt Lang',
    'choose_language': 'Chwazi Lang ou',
    'selected_language': 'Lang ki chwazi a',
    'save_language': 'Anrejistre Lang',
    'error': 'Erè'
  },
  french: {
    'language_settings': 'Paramètres de langue',
    'choose_language': 'Choisissez votre langue',
    'selected_language': 'Langue sélectionnée',
    'save_language': 'Enregistrer langue',
    'error': 'Erreur'
  },
  english: {
    'language_settings': 'Language Settings',
    'choose_language': 'Choose your language',
    'selected_language': 'Selected language',
    'save_language': 'Save Language',
    'error': 'Error'
  },
  spanish: {
    'language_settings': 'Configuración de idioma',
    'choose_language': 'Elige tu idioma',
    'selected_language': 'Idioma seleccionado',
    'save_language': 'Guardar idioma',
    'error': 'Error'
  }
}

const useTranslation = (language: LanguageCode = 'kreyol') => {
  const t = (key: keyof typeof translations.kreyol): string => {
    return translations[language]?.[key] || translations.kreyol[key] || key
  }
  return { t }
}

const getLanguageFlag = (language: LanguageCode): string => {
  const flags = { kreyol: '🇭🇹', french: '🇫🇷', english: '🇺🇸', spanish: '🇪🇸' }
  return flags[language] || '🇭🇹'
}

const getLanguageDisplayName = (language: LanguageCode): string => {
  const names = { kreyol: 'Kreyòl Ayisyen', french: 'Français', english: 'English', spanish: 'Español' }
  return names[language] || 'Kreyòl Ayisyen'
}

export default function ClientDashboard() {
  const INACTIVITY_LIMIT_MS = 10 * 60 * 1000 // 10 min
  const WARNING_DURATION_MS = 30 * 1000 // 30 sec
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showHeaderMenu, setShowHeaderMenu] = useState(false)
  const headerMenuRef = useRef<HTMLDivElement | null>(null)
  const [showInactivityWarning, setShowInactivityWarning] = useState(false)
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null)
  const warningTimer = useRef<NodeJS.Timeout | null>(null)
  const [loadingRedirect, setLoadingRedirect] = useState(true)
  const { loading, userData, transactions, stats, refreshAll, requestVerification } = useUserCoreData({ role: 'client' })
  const [topupForm, setTopupForm] = useState({ recipientNumber: '', carrier: 'digicel', amount: '', message: '' })
  
  // Money transfer states
  const [transferForm, setTransferForm] = useState({ recipientPhone: '', amount: '', description: '', pin: '' })
  const [showPinModal, setShowPinModal] = useState(false)
  const [transferLoading, setTransferLoading] = useState(false)
  
  // Recipient management states
  const [savedRecipients, setSavedRecipients] = useState<any[]>([])
  const [showAddRecipient, setShowAddRecipient] = useState(false)
  const [addRecipientForm, setAddRecipientForm] = useState({ name: '', contact: '', contactType: 'phone', country: 'HT' })
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null)
  const [cleaningRecipients, setCleaningRecipients] = useState(false)
  const [cleanReport, setCleanReport] = useState<{removed:number;updated:number;deduped:number}|null>(null)

  // Country codes and phone formats
  const countries = [
    { code: 'HT', name: 'Haiti', flag: '🇭🇹', dialCode: '+509', format: '+509 XXXX XXXX', digits: 8, example: '+509 1234 5678' },
    { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴', dialCode: '+1', format: '+1 (XXX) XXX-XXXX', digits: 10, example: '+1 (809) 123-4567' },
    { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1', format: '+1 (XXX) XXX-XXXX', digits: 10, example: '+1 (555) 123-4567' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1', format: '+1 (XXX) XXX-XXXX', digits: 10, example: '+1 (416) 123-4567' },
    { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33', format: '+33 X XX XX XX XX', digits: 9, example: '+33 1 23 45 67 89' },
    { code: 'BR', name: 'Brazil', flag: '��', dialCode: '+55', format: '+55 (XX) XXXXX-XXXX', digits: 11, example: '+55 (11) 99999-1234' },
    { code: 'CL', name: 'Chile', flag: '��', dialCode: '+56', format: '+56 X XXXX XXXX', digits: 8, example: '+56 9 1234 5678' },
  ]

  // Phone number formatting function
  const formatPhoneNumber = (value: string, countryCode: string) => {
    const country = countries.find(c => c.code === countryCode)
    if (!country) return value

    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Remove country code if present
    let localNumber = digits
    const dialCodeDigits = country.dialCode.replace(/\D/g, '')
    if (localNumber.startsWith(dialCodeDigits)) {
      localNumber = localNumber.slice(dialCodeDigits.length)
    }

    // Format based on country
    switch (countryCode) {
      case 'HT':
        if (localNumber.length >= 4) {
          return `${country.dialCode} ${localNumber.slice(0, 4)} ${localNumber.slice(4, 8)}`
        } else {
          return `${country.dialCode} ${localNumber}`
        }
      case 'US':
      case 'CA':
      case 'DO':
        if (localNumber.length >= 6) {
          return `${country.dialCode} (${localNumber.slice(0, 3)}) ${localNumber.slice(3, 6)}-${localNumber.slice(6, 10)}`
        } else if (localNumber.length >= 3) {
          return `${country.dialCode} (${localNumber.slice(0, 3)}) ${localNumber.slice(3)}`
        } else {
          return `${country.dialCode} ${localNumber}`
        }
      case 'FR':
        if (localNumber.length >= 2) {
          const formatted = localNumber.match(/.{1,2}/g)?.join(' ') || localNumber
          return `${country.dialCode} ${formatted}`
        } else {
          return `${country.dialCode} ${localNumber}`
        }
      case 'BR':
        if (localNumber.length >= 7) {
          return `${country.dialCode} (${localNumber.slice(0, 2)}) ${localNumber.slice(2, 7)}-${localNumber.slice(7, 11)}`
        } else if (localNumber.length >= 2) {
          return `${country.dialCode} (${localNumber.slice(0, 2)}) ${localNumber.slice(2)}`
        } else {
          return `${country.dialCode} ${localNumber}`
        }
      case 'CL':
        if (localNumber.length >= 5) {
          return `${country.dialCode} ${localNumber.slice(0, 1)} ${localNumber.slice(1, 5)} ${localNumber.slice(5, 9)}`
        } else if (localNumber.length >= 1) {
          return `${country.dialCode} ${localNumber.slice(0, 1)} ${localNumber.slice(1)}`
        } else {
          return `${country.dialCode} ${localNumber}`
        }
      default:
        return `${country.dialCode} ${localNumber}`
    }
  }

  // Normalize helpers to ensure exact matching
  const normalizePhone = (phone: string) => phone.replace(/\D/g, '')
  const normalizeEmail = (email: string) => email.trim().toLowerCase()

  // Detect contact type from input
  const detectContactTypeFromValue = (value: string): 'phone' | 'email' =>
    value.includes('@') ? 'email' : 'phone'

  // Normalize recipient field for backend lookup
  const normalizeRecipient = (value: string) => {
    const trimmed = (value || '').trim()
    if (!trimmed) return ''
    if (trimmed.includes('@')) {
      return trimmed.toLowerCase()
    }
    // strip non-digits, keep country code if present
    const digits = trimmed.replace(/\D/g, '')
    // Ensure starts with country code; if HT and 8 digits, prepend 509
    if (digits.length === 8) {
      return `+509${digits}`
    }
    return `+${digits}`
  }

  // Get best display name from user object
  const getUserDisplayName = (user: any) => {
    const fullName = (user.full_name || user.name || '').toString().trim()
    if (fullName) return fullName
    const first = (user.first_name || '').toString().trim()
    const last = (user.last_name || '').toString().trim()
    const combo = `${first} ${last}`.trim()
    if (combo) return combo
    const username = (user.username || '').toString().trim()
    return username
  }

  // Validate phone number
  const validatePhoneNumber = (phone: string, countryCode: string) => {
    const country = countries.find(c => c.code === countryCode)
    if (!country) return false
    
    const digits = phone.replace(/\D/g, '')
    const dialCodeDigits = country.dialCode.replace(/\D/g, '')
    
    // Check if it has the right number of total digits (country code + local)
    const expectedLength = dialCodeDigits.length + country.digits
    return digits.length === expectedLength
  }

  // Detect country from phone number
  const detectCountryFromPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '')
    
    // Check each country's dial code
    for (const country of countries) {
      const dialCodeDigits = country.dialCode.replace(/\D/g, '')
      if (digits.startsWith(dialCodeDigits)) {
        return country.code
      }
    }
    
    // Default to Haiti
    return 'HT'
  }

  // Transaction filtering functions
  const getFilteredTransactions = () => {
    let filtered = [...transactions]
    
    // Search filter
    if (transactionSearch) {
      const searchTerm = transactionSearch.toLowerCase()
      filtered = filtered.filter(t => 
        (t.display_type || t.transaction_type || '').toLowerCase().includes(searchTerm) ||
        (t.amount || '').toString().includes(searchTerm) ||
        (t.status || '').toLowerCase().includes(searchTerm) ||
        (t.description || '').toLowerCase().includes(searchTerm)
      )
    }
    
    // Type filter
    if (transactionFilter !== 'all') {
      filtered = filtered.filter(t => {
        const type = (t.display_type || t.transaction_type || '').toLowerCase()
        switch (transactionFilter) {
          case 'sent': return type.includes('send') || type.includes('transfer') || type.includes('voye')
          case 'received': return type.includes('receive') || type.includes('deposit') || type.includes('resevwa')
          case 'bills': return type.includes('bill') || type.includes('fakti') || type.includes('payment')
          case 'topup': return type.includes('topup') || type.includes('minit') || type.includes('recharge')
          default: return true
        }
      })
    }
    
    // Date filter
    if (transactionDateFilter !== 'all') {
      const now = new Date()
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.created_at)
        switch (transactionDateFilter) {
          case 'today':
            return transactionDate.toDateString() === now.toDateString()
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            return transactionDate >= weekAgo
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            return transactionDate >= monthAgo
          default: return true
        }
      })
    }
    
    // Status filter
    if (transactionStatusFilter !== 'all') {
      filtered = filtered.filter(t => 
        (t.status || '').toLowerCase().includes(transactionStatusFilter.toLowerCase())
      )
    }
    
    return filtered
  }

  const getPaginatedTransactions = () => {
    const filtered = getFilteredTransactions()
    const startIndex = (currentTransactionPage - 1) * transactionsPerPage
    const endIndex = startIndex + transactionsPerPage
    return {
      transactions: filtered.slice(startIndex, endIndex),
      totalTransactions: filtered.length,
      totalPages: Math.ceil(filtered.length / transactionsPerPage)
    }
  }

  const getTransactionIcon = (transaction: any) => {
    const type = (transaction.display_type || transaction.transaction_type || '').toLowerCase()
    if (type.includes('send') || type.includes('transfer') || type.includes('voye')) {
      return '📤' // Sent
    } else if (type.includes('receive') || type.includes('deposit') || type.includes('resevwa')) {
      return '📥' // Received
    } else if (type.includes('bill') || type.includes('fakti')) {
      return '🧾' // Bill payment
    } else if (type.includes('topup') || type.includes('minit')) {
      return '📱' // Mobile topup
    } else if (type.includes('withdraw') || type.includes('retire')) {
      return '💰' // Withdrawal
    }
    return '💳' // Default
  }

  const getTransactionColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': case 'success': case 'konple': return 'text-green-600 bg-green-50 border-green-200'
      case 'pending': case 'processing': case 'ap tann': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'failed': case 'error': case 'echwe': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }
  
  // PIN management states
  const [pinStatus, setPinStatus] = useState<any>(null)
  const [showPinSetup, setShowPinSetup] = useState(false)
  const [pinSetupForm, setPinSetupForm] = useState({ pin: '', confirmPin: '' })
  const [pinSetupLoading, setPinSetupLoading] = useState(false)
  
  // Bill payment states
  const [billForm, setBillForm] = useState({ 
    billType: 'electricity', 
    serviceProvider: 'EDH', 
    accountNumber: '', 
    amount: '' 
  })
  
  // QR Code states
  const [qrMode, setQrMode] = useState<'generate' | 'scan'>('generate')
  const [qrForm, setQrForm] = useState({ amount: '', description: '' })
  const [qrCode, setQrCode] = useState('')
  const [qrImage, setQrImage] = useState('')
  const [qrDisplayInfo, setQrDisplayInfo] = useState<any>(null)
  const [scannedData, setScannedData] = useState('')
  const [cameraActive, setCameraActive] = useState(false)
  const [scannerError, setScannerError] = useState('')
  
  // Security states
  const [securityOverview, setSecurityOverview] = useState<any>(null)
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [twoFACode, setTwoFACode] = useState('')
  
  // Card deposit states
  const [cardForm, setCardForm] = useState({ 
    cardNumber: '', 
    expiryMonth: '', 
    expiryYear: '', 
    cvv: '', 
    amount: '', 
    cardholderName: '' 
  })
  const [cardLoading, setCardLoading] = useState(false)
  
  // Enhanced merchant payment states
  const [merchantForm, setMerchantForm] = useState({ 
    merchantCode: '', 
    amount: '', 
    description: '',
    paymentType: 'qr' // 'qr' or 'invoice'
  })
  const [merchantLoading, setMerchantLoading] = useState(false)
  const [nearbyMerchants, setNearbyMerchants] = useState<any[]>([])
  
  // Agent withdrawal states
  const [agentForm, setAgentForm] = useState({ 
    agentCode: '', 
    amount: '', 
    pin: '' 
  })
  const [agentLoading, setAgentLoading] = useState(false)
  const [nearbyAgents, setNearbyAgents] = useState<any[]>([])
  
  // Transaction details modal states
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [showTransactionDetails, setShowTransactionDetails] = useState(false)
  const [transactionDetailsLoading, setTransactionDetailsLoading] = useState(false)
  const [showAgentPinModal, setShowAgentPinModal] = useState(false)
  
  // Transaction filtering and search states
  const [transactionSearch, setTransactionSearch] = useState('')
  const [transactionFilter, setTransactionFilter] = useState('all') // all, sent, received, bills, topup
  const [transactionDateFilter, setTransactionDateFilter] = useState('all') // all, today, week, month
  const [transactionStatusFilter, setTransactionStatusFilter] = useState('all') // all, completed, pending, failed
  const [transactionsPerPage, setTransactionsPerPage] = useState(10)
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1)
  
  // Profile management states
  const [profileForm, setProfileForm] = useState({
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null)
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('')
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [showPhoneChange, setShowPhoneChange] = useState(false)
  const [showEmailChange, setShowEmailChange] = useState(false)
  
  // Initialize profile photo from user data when available
  useEffect(() => {
    if (userData && !profilePhotoPreview) {
      const existingPhoto = (userData as any)?.profile?.profile_picture_url ||
                            (userData as any)?.profile?.profile_picture || 
                            (userData as any)?.profile?.photo || 
                            (userData as any)?.profile?.photo_url || 
                            (userData as any)?.user?.profile_picture || 
                            (userData as any)?.user?.photo_url || ''
      
      if (existingPhoto && !profilePhotoPreview) {
        // Don't override if user is currently previewing a new photo
        const photoUrl = existingPhoto.startsWith('http') ? existingPhoto : `http://127.0.0.1:8000${existingPhoto}`
        setProfilePhotoPreview(photoUrl)
      }
    }
  }, [userData, profilePhotoPreview])
  
  // Language settings states
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('kreyol')
  const [languageLoading, setLanguageLoading] = useState(false)
  const { t } = useTranslation(selectedLanguage)
  
  const verificationStatus = userData?.profile?.verification_status
  const showRequestVerification = verificationStatus === 'pending'

  // Redirect logic when role mismatch
  useEffect(() => {
    if (!loading && userData?.user?.user_type && userData.user.user_type !== 'client') {
      switch (userData.user.user_type) {
        case 'admin': router.push('/dashboard/admin'); break
        case 'agent': router.push('/dashboard/agent'); break
        case 'enterprise': router.push('/dashboard/enterprise'); break
        default: router.push('/login');
      }
    }
  }, [loading, userData, router])
  // Inactivity detection
  useEffect(() => {
    const resetTimer = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
      if (warningTimer.current) clearTimeout(warningTimer.current)
      setShowInactivityWarning(false)
      inactivityTimer.current = setTimeout(() => {
        setShowInactivityWarning(true)
        warningTimer.current = setTimeout(() => {
          handleLogout()
        }, WARNING_DURATION_MS)
      }, INACTIVITY_LIMIT_MS)
    }
    // Listen to user events
    const events = ['mousemove','mousedown','keydown','touchstart','scroll']
    events.forEach(e => window.addEventListener(e, resetTimer))
    resetTimer()
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer))
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
      if (warningTimer.current) clearTimeout(warningTimer.current)
    }
  }, [])

  // Close header menu on outside click or Escape
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!showHeaderMenu) return
      const target = e.target as Node
      if (headerMenuRef.current && !headerMenuRef.current.contains(target)) {
        setShowHeaderMenu(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowHeaderMenu(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [showHeaderMenu])

  // Load user language preference
  useEffect(() => {
    const loadUserLanguage = async () => {
      const token = localStorage.getItem('auth_token')
      const savedLangRaw = localStorage.getItem('user_language')
      
      if (savedLangRaw) {
        const savedLanguage = savedLangRaw as LanguageCode
        if (['kreyol','french','english','spanish'].includes(savedLanguage)) {
          setSelectedLanguage(savedLanguage)
        }
      } else if (token) {
        try {
          const response = await fetch('http://127.0.0.1:8000/api/auth/user-language/', {
            headers: { 'Authorization': `Token ${token}` }
          })
          if (response.ok) {
            const data = await response.json()
            setSelectedLanguage(data.language || 'kreyol')
            localStorage.setItem('user_language', data.language || 'kreyol')
          }
        } catch (error) {
          // Error handled silently
        }
      }
    }
    
    loadUserLanguage()
  }, [userData])

  // Load saved recipients when user data is available
  useEffect(() => {
    if (userData?.user?.id) {
      loadSavedRecipients()
    }
  }, [userData?.user?.id])

  const handleLogout = async () => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      try { await fetch('http://127.0.0.1:8000/api/auth/logout/', { method: 'POST', headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json', }, }) } catch {}
    }
    localStorage.removeItem('auth_token')
    router.push('/login')
  }

  const handleTopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('auth_token')
    if (!token) { router.push('/login'); return }
    try {
      const response = await fetch('http://127.0.0.1:8000/api/transactions/topup/', { method: 'POST', headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json', }, body: JSON.stringify({ recipient_phone: topupForm.recipientNumber, carrier: topupForm.carrier, amount: topupForm.amount, message: topupForm.message }) })
      if (response.ok) {
        alert(`✅ Voye ${topupForm.amount} HTG minit ${topupForm.carrier} nan ${topupForm.recipientNumber}`)
        setTopupForm({ recipientNumber: '', carrier: 'digicel', amount: '', message: '' })
        await refreshAll()
      } else {
        let msg = 'Tranzaksyon an echwe'
        try { const err = await response.json(); msg = err.error || err.detail || err.message || JSON.stringify(err) } catch {}
        alert(`❌ Erè: ${msg}`)
      }
    } catch {
      alert('❌ Erè nan koneksyon an')
    }
  }

  // Money transfer functions

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!transferForm.recipientPhone || !transferForm.amount) {
      alert('Tanpri antre destinatè ak montan an')
      return
    }
    
    // Validate recipient contact info
    const detectedType = detectContactTypeFromValue(transferForm.recipientPhone)
    if (detectedType === 'phone') {
      const detectedCountry = detectCountryFromPhone(transferForm.recipientPhone)
      if (!validatePhoneNumber(transferForm.recipientPhone, detectedCountry)) {
        const country = countries.find(c => c.code === detectedCountry)
        alert(`Nimewo telefòn an pa kòrèk. Egzanp: ${country?.example || '+509 1234 5678'}`)
        return
      }
    } else if (detectedType === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(transferForm.recipientPhone)) {
        alert('Adrès email la pa kòrèk')
        return
      }
    } else {
      alert('Tanpri antre yon nimewo telefòn oswa email ki valab')
      return
    }
    
    // Validate amount format and value
    const amount = parseFloat(transferForm.amount)
    if (isNaN(amount) || amount <= 0) {
      alert('Tanpri antre yon montan ki valab ak pi gwo pase 0')
      return
    }
    
    // Check minimum transfer amount (1 HTG)
    if (amount < 1) {
      alert('Montan minimum pou transfer se 1 HTG')
      return
    }
    
    // Check maximum transfer amount (100,000 HTG)
    if (amount > 100000) {
      alert('Montan maksimòm pou transfer se 100,000 HTG')
      return
    }
    
    if (!userData?.wallet || amount > parseFloat(userData.wallet.balance)) {
      alert('Ou pa gen ase lajan nan wallet ou')
      return
    }
    
    // Check if user has PIN
    if (!pinStatus?.has_pin) {
      alert('Ou pa gen PIN. Tanpri konfigire yon PIN nan paramèt yo anvan w voye lajan')
      setActiveTab('settings')
      return
    }
    
    if (pinStatus?.pin_locked) {
      alert('PIN ou bloke akòz twòp esè ki mal. Tanpri tann ak eseye ankò')
      return
    }
    
    setShowPinModal(true)
  }

  const confirmTransfer = async () => {
    if (!transferForm.pin || transferForm.pin.length < 4) {
      alert('Antre PIN ou (minimum 4 chif)')
      return
    }
    
    // Validate PIN is numeric
    if (!/^\d+$/.test(transferForm.pin)) {
      alert('PIN an dwe gen nimewo sèlman')
      return
    }
    
    setTransferLoading(true)
    const token = localStorage.getItem('auth_token')
    try {
      const response = await fetch('http://127.0.0.1:8000/api/transactions/send/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiver_phone: normalizeRecipient(transferForm.recipientPhone),
          amount: transferForm.amount,
          description: transferForm.description,
          pin: transferForm.pin
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`✅ Lajan voye ak siksè! Referans: ${result.reference_number}`)
        setTransferForm({ recipientPhone: '', amount: '', description: '', pin: '' })
        setSelectedRecipient(null)
        setShowPinModal(false)
        await refreshAll()
        
  // Save recipient to local storage after successful transfer
  const token = localStorage.getItem('auth_token')
  let recipientName = transferForm.recipientPhone // Default to contact info
        
        try {
          const response = await fetch(`http://127.0.0.1:8000/api/auth/users/search/?q=${encodeURIComponent(transferForm.recipientPhone)}`, {
            headers: { 'Authorization': `Token ${token}` }
          })
          
          if (response.ok) {
            const users = await response.json()
            
            // Find exact match (normalized)
            const entered = transferForm.recipientPhone
            const matchedUser = users.find((user: any) => {
              const phoneMatch = normalizePhone(user.phone_number || '') === normalizePhone(entered)
              const emailMatch = normalizeEmail(user.email || '') === normalizeEmail(entered)
              return phoneMatch || emailMatch
            })
            
            if (matchedUser) {
              const dbFullName = getUserDisplayName(matchedUser)
              if (dbFullName) {
                recipientName = dbFullName
              }
            }
          }
        } catch (error) {
          // Error handled silently
        }
        
        saveRecipient({
          name: recipientName,
          phone: transferForm.recipientPhone.includes('@') ? '' : transferForm.recipientPhone,
          email: transferForm.recipientPhone.includes('@') ? transferForm.recipientPhone : ''
        })
        
      } else {
        const error = await response.json().catch(() => ({ error: 'Erè nan sistèm nan' }))
        
        // Provide specific error messages based on common issues
        let errorMessage = error.error || 'Tranzaksyon an echwe'
        
        if (error.error && error.error.includes('insufficient')) {
          errorMessage = 'Ou pa gen ase lajan nan kont ou'
        } else if (error.error && error.error.includes('recipient')) {
          errorMessage = 'Destinatè a pa jwenn oswa pa aktif'
        } else if (error.error && error.error.includes('PIN')) {
          errorMessage = 'PIN an pa kòrèk'
        } else if (error.error && error.error.includes('limit')) {
          errorMessage = 'Ou depase limit yo pou jodi a'
        }
        
        alert(`❌ Erè: ${errorMessage}`)
      }
    } catch (error) {
      alert('❌ Erè nan koneksyon an. Tanpri verifye koneksyon entènèt ou ak eseye ankò.')
    } finally {
      setTransferLoading(false)
      setTransferForm({...transferForm, pin: ''}) // Clear PIN for security
    }
  }

  // Recipient management functions
  const loadSavedRecipients = () => {
    try {
      if (!userData?.user?.id) {
        return
      }

      const key = `savedRecipients_${userData.user.id}`
      const saved = localStorage.getItem(key)
      
      if (saved) {
        const recipients = JSON.parse(saved)
        setSavedRecipients(recipients)
      } else {
        setSavedRecipients([])
      }
    } catch (error) {
      setSavedRecipients([])
    }
  }

  const saveRecipient = (recipient: { name: string; phone: string; email: string }) => {
    try {
      if (!userData?.user?.id) {
        return
      }

      const currentRecipients = savedRecipients || []
      
      // Check if recipient already exists (only check non-empty fields)
      const exists = currentRecipients.some(r => {
        if (recipient.phone && r.phone) {
          return normalizePhone(r.phone) === normalizePhone(recipient.phone)
        }
        if (recipient.email && r.email) {
          return normalizeEmail(r.email) === normalizeEmail(recipient.email)
        }
        return false
      })
      
      if (!exists) {
        const updatedRecipients = [...currentRecipients, { 
          ...recipient, 
          id: Date.now(),
          lastUsed: new Date().toISOString()
        }]
        
        // Keep only last 20 recipients
        const limitedRecipients = updatedRecipients.slice(-20)
        
        const storageKey = `savedRecipients_${userData.user.id}`
        localStorage.setItem(storageKey, JSON.stringify(limitedRecipients))
        setSavedRecipients(limitedRecipients)
      } else {
        // Update existing entry name if the new name is better (non-empty and not equal to contact)
        const updated = currentRecipients.map(r => {
          const samePhone = recipient.phone && r.phone && normalizePhone(r.phone) === normalizePhone(recipient.phone)
          const sameEmail = recipient.email && r.email && normalizeEmail(r.email) === normalizeEmail(recipient.email)
          if (samePhone || sameEmail) {
            const incoming = (recipient.name || '').trim()
            const existing = (r.name || '').trim()
            const contact = (r.phone || r.email || '').toString().trim()
            const existingIsContact = (
              (existing && normalizePhone(existing) === normalizePhone(contact)) ||
              (existing && normalizeEmail(existing) === normalizeEmail(contact))
            )
            const incomingIsContact = (
              (incoming && normalizePhone(incoming) === normalizePhone(contact)) ||
              (incoming && normalizeEmail(incoming) === normalizeEmail(contact))
            )
            // Prefer non-contact, longer, and different names; never replace a good non-contact name with contact-like junk
            const shouldUpdate = !!incoming && !incomingIsContact && (
              !existing || existingIsContact || incoming.length > existing.length
            ) && existing.toLowerCase() !== incoming.toLowerCase()
            return shouldUpdate ? { ...r, name: incoming, lastUsed: new Date().toISOString() } : { ...r, lastUsed: new Date().toISOString() }
          }
          return r
        })
        const storageKey = `savedRecipients_${userData.user.id}`
        localStorage.setItem(storageKey, JSON.stringify(updated))
        setSavedRecipients(updated)
      }
    } catch (error) {
      // Error handled silently
    }
  }

  // Heuristic: decide if recipient name likely incomplete (e.g., equals contact, empty, placeholder, one token)
  const shouldHydrateName = (recipient: any) => {
    const name = (recipient?.name || '').toString().trim()
    const contact = (recipient?.phone || recipient?.email || '').toString().trim()
    if (!name) return true
    if (name.toLowerCase() === 'destinatè') return true
    if (normalizeEmail(name) === normalizeEmail(contact)) return true
    if (normalizePhone(name) && normalizePhone(name) === normalizePhone(contact)) return true
    // Single short token (e.g., only first or last name of 2-3 chars)
    if (!name.includes(' ') && name.length <= 3) return true
    return false
  }

  // Fetch best DB name for a given contact
  const fetchDbNameForContact = async (contact: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!contact || !token) return ''
      const resp = await fetch(`http://127.0.0.1:8000/api/auth/users/search/?q=${encodeURIComponent(contact)}`, {
        headers: { 'Authorization': `Token ${token}` }
      })
      if (!resp.ok) return ''
      const users = await resp.json()
      const matched = users.find((u: any) => {
        const phoneMatch = normalizePhone(u.phone_number || '') === normalizePhone(contact)
        const emailMatch = normalizeEmail(u.email || '') === normalizeEmail(contact)
        return phoneMatch || emailMatch
      })
      return matched ? (getUserDisplayName(matched) || '') : ''
    } catch (e) {
      return ''
    }
  }

  // Background: hydrate saved recipients with full DB names if missing/incomplete
  const [hasHydratedRecipients, setHasHydratedRecipients] = useState(false)
  const hydrateRecipientNames = async () => {
    if (!userData?.user?.id || !savedRecipients?.length) return
    try {
      const toHydrate = savedRecipients.filter(r => shouldHydrateName(r)).slice(0, 10) // limit per pass
      if (!toHydrate.length) return
      const updates: any[] = []
      for (const r of toHydrate) {
        const contact = r.phone || r.email
        if (!contact) continue
        const dbName = await fetchDbNameForContact(contact)
        if (dbName && dbName !== r.name) {
          updates.push({ id: r.id, name: dbName })
        }
      }
      if (updates.length) {
        const updated = savedRecipients.map(r => {
          const u = updates.find(x => x.id === r.id)
          return u ? { ...r, name: u.name, hydratedNameAt: new Date().toISOString() } : r
        })
        setSavedRecipients(updated)
        localStorage.setItem(`savedRecipients_${userData.user.id}`, JSON.stringify(updated))
      }
    } catch (e) {
      // Error handled silently
    } finally {
      setHasHydratedRecipients(true)
    }
  }

  // Trigger hydration once after loading recipients
  useEffect(() => {
    if (!loading && userData && savedRecipients.length && !hasHydratedRecipients) {
      hydrateRecipientNames()
    }
  }, [loading, userData, savedRecipients, hasHydratedRecipients])

  // One-click cleanup: fix names, dedupe, and remove invalids
  const cleanupSavedRecipients = async () => {
    if (!userData?.user?.id) return
    setCleaningRecipients(true)
    setCleanReport(null)
    try {
      const nowIso = new Date().toISOString()
      let removed = 0
      let updated = 0
      let deduped = 0

      // 1) Normalize entries and hydrate names when needed
      const normalized = [] as any[]
      for (const r of savedRecipients) {
        const phone = (r.phone || '').toString().trim()
        const email = (r.email || '').toString().trim()
        if (!phone && !email) { removed++; continue }
        const contact = phone || email

        let name = (r.name || '').toString().trim()
        let newName = name
        const needsHydration = shouldHydrateName({ name, phone, email })
        if (needsHydration) {
          const dbName = await fetchDbNameForContact(contact)
          if (dbName && dbName !== name) {
            newName = dbName
            updated++
          }
        }
        normalized.push({
          ...r,
          name: newName || contact, // never empty
          phone,
          email,
          lastUsed: r.lastUsed || nowIso,
          id: r.id || Date.now(),
        })
      }

      // 2) Deduplicate by contact key (prefer best name and most recent use)
      const byKey: Record<string, any> = {}
      const makeKey = (rec: any) => rec.phone ? `p:${normalizePhone(rec.phone)}` : `e:${normalizeEmail(rec.email)}`
      const isContactLike = (nm: string, rec: any) => {
        const contact = (rec.phone || rec.email || '').toString().trim()
        return (
          (!!normalizePhone(nm) && normalizePhone(nm) === normalizePhone(contact)) ||
          (!!normalizeEmail(nm) && normalizeEmail(nm) === normalizeEmail(contact))
        )
      }
      const prefer = (a: any, b: any) => {
        // Prefer non-contact-like names
        const aGood = a.name && !isContactLike(a.name, a)
        const bGood = b.name && !isContactLike(b.name, b)
        if (aGood !== bGood) return aGood ? a : b
        // Prefer longer name
        if ((a.name || '').length !== (b.name || '').length) return (a.name || '').length > (b.name || '').length ? a : b
        // Prefer most recent lastUsed
        const at = new Date(a.lastUsed || 0).getTime()
        const bt = new Date(b.lastUsed || 0).getTime()
        return at >= bt ? a : b
      }

      for (const rec of normalized) {
        const key = makeKey(rec)
        if (!byKey[key]) {
          byKey[key] = rec
        } else {
          const chosen = prefer(byKey[key], rec)
          if (chosen !== byKey[key]) {
            byKey[key] = chosen
          }
          deduped++
        }
      }

      const cleaned = Object.values(byKey)
        .filter((r: any) => (r.phone || r.email))
        .sort((a: any, b: any) => new Date(b.lastUsed || 0).getTime() - new Date(a.lastUsed || 0).getTime())

      const storageKey = `savedRecipients_${userData.user.id}`
      localStorage.setItem(storageKey, JSON.stringify(cleaned))
      setSavedRecipients(cleaned as any[])
      setCleanReport({ removed, updated, deduped })
      alert(`✅ Lis destinatè a netwaye\nRetire: ${removed}\nMizajou non: ${updated}\nElimine doublon: ${deduped}`)
    } catch (e) {
      alert('❌ Echèk pandan netwayaj la. Tanpri eseye ankò.')
    } finally {
      setCleaningRecipients(false)
    }
  }

  const addNewRecipient = async () => {
    if (!addRecipientForm.contact) {
      alert('Tanpri antre nimewo telefòn oswa email')
      return
    }

    // Detect contact type automatically
    const detectedType = detectContactTypeFromValue(addRecipientForm.contact)

    // Validate phone number if detected as phone
    if (detectedType === 'phone' && !validatePhoneNumber(addRecipientForm.contact, addRecipientForm.country)) {
      const country = countries.find(c => c.code === addRecipientForm.country)
      alert(`Nimewo telefòn an pa kòrèk. Egzanp: ${country?.example}`)
      return
    }
    
    // Search for user by contact info to get the real name
  const token = localStorage.getItem('auth_token')
  // Default to entered name, or fall back to contact if name is empty
  let finalName = addRecipientForm.name || addRecipientForm.contact
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/auth/users/search/?q=${encodeURIComponent(addRecipientForm.contact)}`, {
        headers: { 'Authorization': `Token ${token}` }
      })
      
      if (response.ok) {
        const users = await response.json()
        
        // Find user that exactly matches the contact info
        const matchedUser = users.find((user: any) => {
          if (detectedType === 'phone') {
            return normalizePhone(user.phone_number || '') === normalizePhone(addRecipientForm.contact)
          } else {
            return normalizeEmail(user.email || '') === normalizeEmail(addRecipientForm.contact)
          }
        })
        
        if (matchedUser) {
          // Use the best available display name from database
          const bestName = getUserDisplayName(matchedUser)
          if (bestName) {
            finalName = bestName
          }
        }
      }
    } catch (error) {
      // Error handled silently
    }
    
    const recipient = {
      name: finalName,
      phone: detectedType === 'phone' ? addRecipientForm.contact : '',
      email: detectedType === 'email' ? addRecipientForm.contact : ''
    }
    
    console.log('Final recipient to save:', recipient)
    
    saveRecipient(recipient)
    setAddRecipientForm({ name: '', contact: '', contactType: 'phone', country: 'HT' })
    setShowAddRecipient(false)
    
    // Force refresh the recipients list
    setTimeout(() => {
      loadSavedRecipients()
    }, 100)
    
    alert('✅ Destinatè ajoute ak siksè!')
  }

  const selectRecipient = (recipient: any) => {
    setSelectedRecipient(recipient)
    setTransferForm({
      ...transferForm, 
      recipientPhone: recipient.phone || recipient.email
    })
    
    // Update last used timestamp
    const updatedRecipients = savedRecipients.map(r => 
      r.id === recipient.id ? { ...r, lastUsed: new Date().toISOString() } : r
    )
    setSavedRecipients(updatedRecipients)
    localStorage.setItem(`savedRecipients_${userData?.user?.id}`, JSON.stringify(updatedRecipients))
    
    // Show success feedback
    const successMsg = document.createElement('div')
    successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50'
    successMsg.textContent = `✓ ${recipient.name} seleksyone`
    document.body.appendChild(successMsg)
    setTimeout(() => document.body.removeChild(successMsg), 2000)
  }

  const removeRecipient = (recipientId: number) => {
    const updated = savedRecipients.filter(r => r.id !== recipientId)
    setSavedRecipients(updated)
    localStorage.setItem(`savedRecipients_${userData?.user?.id}`, JSON.stringify(updated))
    alert('✅ Destinatè efase')
  }

  // PIN management functions
  const fetchPinStatus = async () => {
    const token = localStorage.getItem('auth_token')
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/pin/status/', {
        headers: { 'Authorization': `Token ${token}` }
      })
      if (response.ok) {
        const status = await response.json()
        setPinStatus(status)
      }
    } catch (error) {
      console.error('Error fetching PIN status:', error)
    }
  }

  const handlePinSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pinSetupForm.pin !== pinSetupForm.confirmPin) {
      alert('PIN yo pa menm')
      return
    }
    if (pinSetupForm.pin.length < 4 || pinSetupForm.pin.length > 6) {
      alert('PIN dwe gen 4-6 chif')
      return
    }

    setPinSetupLoading(true)
    const token = localStorage.getItem('auth_token')
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/pin/set/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin: pinSetupForm.pin })
      })

      if (response.ok) {
        alert('✅ PIN konfigire ak siksè!')
        setPinSetupForm({ pin: '', confirmPin: '' })
        setShowPinSetup(false)
        await fetchPinStatus()
      } else {
        const error = await response.json()
        alert(`❌ Erè: ${error.error || 'PIN pa konfigire'}`)
      }
    } catch (error) {
      alert('❌ Erè nan koneksyon an')
    } finally {
      setPinSetupLoading(false)
    }
  }

  // Load PIN status on component mount
  useEffect(() => {
    if (!loading && userData) {
      fetchPinStatus()
      fetchSecurityOverview()
    }
  }, [loading, userData])

  // Cleanup camera when component unmounts or tab changes
  useEffect(() => {
    return () => {
      if (cameraActive) {
        stopCamera()
      }
    }
  }, [])

  // Cleanup camera when switching away from QR scan mode
  useEffect(() => {
    if (activeTab !== 'qr' || qrMode !== 'scan') {
      if (cameraActive) {
        stopCamera()
      }
    }
  }, [activeTab, qrMode])

  // Security functions
  const fetchSecurityOverview = async () => {
    const token = localStorage.getItem('auth_token')
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/security/overview/', {
        headers: { 'Authorization': `Token ${token}` }
      })
      if (response.ok) {
        const overview = await response.json()
        setSecurityOverview(overview)
      }
    } catch (error) {
      console.error('Error fetching security overview:', error)
    }
  }

  const enable2FA = async () => {
    const token = localStorage.getItem('auth_token')
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/security/enable-2fa/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const result = await response.json()
        alert(`📱 ${result.message}`)
        setShow2FASetup(true)
        setTwoFACode(result.code) // For demo only
      } else {
        const error = await response.json()
        alert(`❌ Erè: ${error.error || '2FA pa konfigire'}`)
      }
    } catch (error) {
      alert('❌ Erè nan koneksyon an')
    }
  }

  const verify2FA = async () => {
    if (!twoFACode) {
      alert('Antre kòd 2FA')
      return
    }

    const token = localStorage.getItem('auth_token')
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/security/verify-2fa/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: twoFACode })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`✅ ${result.message}`)
        setShow2FASetup(false)
        setTwoFACode('')
        await fetchSecurityOverview()
      } else {
        const error = await response.json()
        alert(`❌ Erè: ${error.error || 'Kòd 2FA pa bon'}`)
      }
    } catch (error) {
      alert('❌ Erè nan koneksyon an')
    }
  }

  // Transaction details function
  const fetchTransactionDetails = async (transactionId: string) => {
    setTransactionDetailsLoading(true)
    const token = localStorage.getItem('auth_token')
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/transactions/details/${transactionId}/`, {
        headers: { 'Authorization': `Token ${token}` }
      })
      
      if (response.ok) {
        const details = await response.json()
        setSelectedTransaction(details)
        setShowTransactionDetails(true)
      } else {
        alert('❌ Pa ka jwenn detay tranzaksyon an')
      }
    } catch (error) {
      alert('❌ Erè nan koneksyon an')
    } finally {
      setTransactionDetailsLoading(false)
    }
  }

  const openTransactionDetails = (transaction: any) => {
    // For now, we'll use the transaction data we already have
    // In a real implementation, you might want to fetch more detailed data
    const amt = parseFloat(String(transaction.amount)) || 0
    setSelectedTransaction({
      ...transaction,
      amount: amt,
      // Add some mock detailed data for demonstration
      fees: {
        service_fee: amt * 0.02, // 2% service fee
        tax: amt * 0.005, // 0.5% tax
        total_fees: amt * 0.025 // 2.5% total fees
      },
      sender_details: {
        name: (userData?.user?.first_name || '') + ' ' + (userData?.user?.last_name || ''),
        phone: userData?.user?.phone_number || 'N/A',
        account: userData?.user?.email
      },
      receiver_details: {
        name: transaction.receiver_name || 'N/A',
        phone: transaction.receiver_phone || transaction.receiver?.phone_number || 'N/A',
        email: transaction.receiver_email || transaction.receiver?.email || 'N/A',
        account: transaction.receiver_account || transaction.receiver?.email || 'N/A'
      },
      transaction_reference: transaction.id,
      confirmation_code: transaction.id?.slice(-8)?.toUpperCase() || 'N/A'
    })
    setShowTransactionDetails(true)
  }

  // Bill payment function
  const handleBillPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!billForm.accountNumber || !billForm.amount) {
      alert('Tanpri antre nimewo kont ak montan an')
      return
    }
    
    if (parseFloat(billForm.amount) <= 0) {
      alert('Montan an dwe pi gwo pase 0')
      return
    }
    
    // Check if user has PIN
    if (!pinStatus?.has_pin) {
      alert('Ou pa gen PIN. Tanpri konfigire yon PIN nan paramèt yo anvan w peye faktè')
      setActiveTab('settings')
      return
    }
    
    if (pinStatus?.pin_locked) {
      alert('PIN ou bloke akòz twòp esè ki mal. Tanpri tann ak eseye ankò')
      return
    }
    
    const pin = prompt('Antre PIN ou pou konfime peman an:')
    if (!pin) return
    
    const token = localStorage.getItem('auth_token')
    try {
      const response = await fetch('http://127.0.0.1:8000/api/transactions/bills/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bill_type: billForm.billType,
          service_provider: billForm.serviceProvider,
          account_number: billForm.accountNumber,
          amount: billForm.amount,
          pin: pin
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`✅ Faktè peye ak siksè! Referans: ${result.transaction?.reference_number}`)
        setBillForm({ billType: 'electricity', serviceProvider: 'EDH', accountNumber: '', amount: '' })
        await refreshAll()
      } else {
        const error = await response.json()
        alert(`❌ Erè: ${error.error || 'Peman an echwe'}`)
      }
    } catch (error) {
      alert('❌ Erè nan koneksyon an')
    }
  }

  // QR Code functions
  const generateQRCode = async () => {
    if (!qrForm.amount) {
      alert('Tanpri antre yon montan')
      return
    }

    const token = localStorage.getItem('auth_token')
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/qr/generate/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: qrForm.amount,
          description: qrForm.description
        })
      })

      if (response.ok) {
        const result = await response.json()
        setQrCode(result.qr_data)
        setQrImage(result.qr_image)
        setQrDisplayInfo(result.display_info)
        alert('✅ Kòd QR kreye!')
      } else {
        const error = await response.json()
        alert(`❌ Erè: ${error.error || 'Kòd QR pa kreye'}`)
      }
    } catch (error) {
      alert('❌ Erè nan koneksyon an')
    }
  }

  // Camera QR Scanner functions
  const startCamera = async () => {
    setScannerError('')
    try {
      setCameraActive(true)
      
      // Demander permission pour la caméra
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Utiliser la caméra arrière si disponible
        } 
      })
      
      // Obtenir l'élément vidéo
      const video = document.getElementById('qr-video') as HTMLVideoElement
      if (video) {
        video.srcObject = stream
        video.play()
      }
      
    } catch (error) {
      setScannerError('Pa ka aksè kamera a. Verifye otorizasyon yo.')
      setCameraActive(false)
      console.error('Camera error:', error)
    }
  }

  const stopCamera = () => {
    const video = document.getElementById('qr-video') as HTMLVideoElement
    if (video && video.srcObject) {
      const stream = video.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      video.srcObject = null
    }
    setCameraActive(false)
  }

  const scanQRFromCamera = () => {
    const video = document.getElementById('qr-video') as HTMLVideoElement
    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement
    const context = canvas.getContext('2d')
    
    if (video && canvas && context) {
      // Capturer l'image de la vidéo
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0)
      
      // Pour un vrai scanner QR, vous utiliseriez une bibliothèque comme jsQR
      // Pour le moment, on simule avec un placeholder
      alert('🔍 Fonksyon eskane QR ap vini pwochennman. Pou kounye a, sèvi ak done manual yo.')
      
      // Exemple de données QR pour test
      const testQRData = `{
        "type": "payment_request",
        "user_id": "2",
        "phone": "+509 8765 4321",
        "name": "Test Receiver",
        "amount": "250",
        "description": "Test payment from QR scan",
        "timestamp": "${new Date().toISOString()}"
      }`
      
      setScannedData(testQRData)
      stopCamera()
    }
  }

  const processQRPayment = async () => {
    if (!scannedData) {
      alert('Tanpri antre done kòd QR')
      return
    }

    if (!pinStatus?.has_pin) {
      alert('Ou pa gen PIN. Tanpri konfigire yon PIN nan paramèt yo')
      setActiveTab('settings')
      return
    }

    const pin = prompt('Antre PIN ou pou konfime peman QR:')
    if (!pin) return

    const token = localStorage.getItem('auth_token')
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/qr/process/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qr_data: scannedData,
          pin: pin
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`✅ Peman QR reisi! Referans: ${result.reference_number}`)
        setScannedData('')
        await refreshAll()
      } else {
        const error = await response.json()
        alert(`❌ Erè: ${error.error || 'Peman QR echwe'}`)
      }
    } catch (error) {
      alert('❌ Erè nan koneksyon an')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-primary-600 mx-auto"/>
          <p className="mt-4 text-gray-600">Chajman done...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showInactivityWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm mx-auto text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Inaktivite Detekte</h2>
            <p className="text-gray-700 mb-4">Ou pa fè okenn aksyon sou kont ou depi 10 minit. Ou pral dekonekte otomatikman nan 30 segond si ou pa fè okenn aksyon.</p>
            <button className="bg-primary-600 text-white px-4 py-2 rounded" onClick={() => { setShowInactivityWarning(false); if (warningTimer.current) clearTimeout(warningTimer.current); }}>Mwen la!</button>
          </div>
        </div>
      )}
      {/* Professional Header with Enhanced Design */}
      <div className="bg-black text-white shadow-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 lg:h-18 flex items-center gap-6 min-w-0">
            {/* Left group - Brand and Navigation */}
            <div className="flex items-center space-x-4 min-w-0">
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                aria-label="Toggle menu"
              >
                <Menu size={22} />
              </button>
              <div className="bg-gradient-to-br from-red-600 to-red-700 p-3 rounded-xl shadow-lg">
                <span className="text-white font-bold text-lg">₹</span>
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-xl lg:text-2xl truncate" title="Cash Ti Machann">
                  Cash Ti Machann
                </h1>
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right group - User Info */}
            <div className="flex items-center gap-6">
              <div className="hidden sm:block text-right min-w-0 leading-tight">
                <p className="text-sm text-gray-200 truncate max-w-[40vw] lg:max-w-xs font-medium" 
                   title={`Byenveni, ${userData?.user?.first_name || 'Itilizatè'}`}>
                  Byenveni, <span className="text-white font-semibold">{userData?.user?.first_name || 'Itilizatè'}</span>
                </p>
              </div>
              {/* Professional Profile Avatar */}
              {(() => {
                const displayName = getUserDisplayName(userData?.user || '') || 'Kliyan'
                const profilePhotoUrl = profilePhotoPreview 
                  || (userData as any)?.profile?.profile_picture_url 
                  || (userData as any)?.profile?.profile_picture 
                  || (userData as any)?.profile?.photo 
                  || (userData as any)?.profile?.photo_url 
                  || (userData as any)?.user?.profile_picture 
                  || (userData as any)?.user?.photo_url 
                  || ''
                const initials = displayName.split(' ').filter(Boolean).map((s:string)=>s[0]).slice(0,2).join('').toUpperCase() || 'K'
                return (
                  <div className="relative" ref={headerMenuRef}>
                    <button
                      type="button"
                      onClick={() => setShowHeaderMenu(v => !v)}
                      className="w-10 h-10 lg:w-12 lg:h-12 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ring-2 ring-gray-500/30 hover:ring-red-400/60 transition-all duration-200 shadow-lg hover:shadow-xl"
                      aria-haspopup="menu"
                      aria-expanded={showHeaderMenu}
                      aria-label="Ouvri meni pwofil"
                      title="Pwofil ak Opsyon"
                    >
                      {profilePhotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={String(profilePhotoUrl)} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-700 text-sm lg:text-base font-bold">{initials}</span>
                      )}
                    </button>
                    {showHeaderMenu && (
                      <div role="menu" className="absolute right-0 mt-3 w-56 bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-200/50 overflow-hidden z-50 backdrop-blur-sm">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                          <p className="text-xs text-gray-500 truncate">{userData?.user?.email}</p>
                        </div>
                        <button
                          role="menuitem"
                          onClick={() => { setActiveTab('settings'); setShowHeaderMenu(false) }}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors flex items-center gap-3"
                        >
                          <span className="text-base">⚙️</span>
                          <span className="font-medium">Paramèt ak Sekirite</span>
                        </button>
                        <button
                          role="menuitem"
                          onClick={() => { setShowHeaderMenu(false); handleLogout() }}
                          className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                        >
                          <span className="text-base">🚪</span>
                          <span className="font-medium">Dekonekte</span>
                        </button>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      </div>

      <div className="flex relative">
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Enhanced Professional Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-r border-gray-200 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        >
          <nav className="p-6 h-full overflow-y-auto">
            {/* Mobile Balance Display */}
            <div className="block sm:hidden mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200">
              <p className="text-xs text-red-600 uppercase tracking-wide font-medium">Balans Disponib</p>
              <p className="font-bold text-xl text-red-700">
                {userData?.wallet?.balance ?? '—'} {userData?.wallet?.currency ?? 'HTG'}
              </p>
            </div>

            <div className="space-y-3">
              {/* Overview - Primary Action */}
              <button
                onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false) }}
                className={`w-full text-left p-4 rounded-xl flex items-center space-x-4 transition-all duration-200 font-medium ${
                  activeTab==='overview' 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg transform scale-[1.02]' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-red-600 border border-gray-200 hover:border-red-200'
                }`}
              >
                <div className={`p-2 rounded-lg ${activeTab==='overview' ? 'bg-white/20' : 'bg-red-100'}`}>
                  <BarChart3 size={20} className={activeTab==='overview' ? 'text-white' : 'text-red-600'} />
                </div>
                <span className="text-base">Apèsi Jeneral</span>
                {activeTab==='overview' && <div className="ml-auto w-2 h-2 bg-green-300 rounded-full animate-pulse" />}
              </button>

              {/* Financial Operations */}
              <div className="pt-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-3">
                  Operasyon Finansyè
                </p>
                
                <div className="space-y-2">
                  <button 
                    onClick={() => { setActiveTab('transfer'); setIsSidebarOpen(false) }} 
                    className={`w-full text-left p-3 rounded-lg flex items-center space-x-3 transition-all duration-200 ${
                      activeTab==='transfer' 
                        ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-red-600'
                    }`}
                  >
                    <TrendingUp size={18} className={activeTab==='transfer' ? 'text-red-600' : ''} />
                    <span className="font-medium">Voye Lajan</span>
                  </button>

                  <button 
                    onClick={() => { setActiveTab('qr'); setIsSidebarOpen(false) }} 
                    className={`w-full text-left p-3 rounded-lg flex items-center space-x-3 transition-all duration-200 ${
                      activeTab==='qr' 
                        ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-red-600'
                    }`}
                  >
                    <QrCode size={18} className={activeTab==='qr' ? 'text-red-600' : ''} />
                    <span className="font-medium">Kòd QR</span>
                  </button>

                  <button 
                    onClick={() => { setActiveTab('wallet'); setIsSidebarOpen(false) }} 
                    className={`w-full text-left p-3 rounded-lg flex items-center space-x-3 transition-all duration-200 ${
                      activeTab==='wallet' 
                        ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-red-600'
                    }`}
                  >
                    <Wallet size={18} className={activeTab==='wallet' ? 'text-red-600' : ''} />
                    <span className="font-medium">Wallet</span>
                  </button>

                  <button 
                    onClick={() => { setActiveTab('cards'); setIsSidebarOpen(false) }} 
                    className={`w-full text-left p-3 rounded-lg flex items-center space-x-3 transition-all duration-200 ${
                      activeTab==='cards' 
                        ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-red-600'
                    }`}
                  >
                    <CreditCard size={18} className={activeTab==='cards' ? 'text-red-600' : ''} />
                    <span className="font-medium">Depo ak Kat</span>
                  </button>
                </div>
              </div>

              {/* Services */}
              <div className="pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-3">
                  Sèvis yo
                </p>
                
                <div className="space-y-2">
                  <button 
                    onClick={() => { setActiveTab('bills'); setIsSidebarOpen(false) }} 
                    className={`w-full text-left p-3 rounded-lg flex items-center space-x-3 transition-all duration-200 ${
                      activeTab==='bills' 
                        ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-red-600'
                    }`}
                  >
                    <FileText size={18} className={activeTab==='bills' ? 'text-red-600' : ''} />
                    <span className="font-medium">Peye Fakti</span>
                  </button>

                  <button 
                    onClick={() => { setActiveTab('topup'); setIsSidebarOpen(false) }} 
                    className={`w-full text-left p-3 rounded-lg flex items-center space-x-3 transition-all duration-200 ${
                      activeTab==='topup' 
                        ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-red-600'
                    }`}
                  >
                    <Phone size={18} className={activeTab==='topup' ? 'text-red-600' : ''} />
                    <span className="font-medium">Top Up</span>
                  </button>

                  <button 
                    onClick={() => { setActiveTab('merchants'); setIsSidebarOpen(false) }} 
                    className={`w-full text-left p-3 rounded-lg flex items-center space-x-3 transition-all duration-200 ${
                      activeTab==='merchants' 
                        ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-red-600'
                    }`}
                  >
                    <Zap size={18} className={activeTab==='merchants' ? 'text-red-600' : ''} />
                    <span className="font-medium">Peye Machann</span>
                  </button>

                  <button 
                    onClick={() => { setActiveTab('agents'); setIsSidebarOpen(false) }} 
                    className={`w-full text-left p-3 rounded-lg flex items-center space-x-3 transition-all duration-200 ${
                      activeTab==='agents' 
                        ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-red-600'
                    }`}
                  >
                    <Receipt size={18} className={activeTab==='agents' ? 'text-red-600' : ''} />
                    <span className="font-medium">Retire nan Ajan</span>
                  </button>
                </div>
              </div>

              {/* Account Management */}
              <div className="pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-3">
                  Jesyon Kont
                </p>
                
                <div className="space-y-2">
                  <button 
                    onClick={() => { setActiveTab('transactions'); setIsSidebarOpen(false) }} 
                    className={`w-full text-left p-3 rounded-lg flex items-center space-x-3 transition-all duration-200 ${
                      activeTab==='transactions' 
                        ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-red-600'
                    }`}
                  >
                    <Receipt size={18} className={activeTab==='transactions' ? 'text-red-600' : ''} />
                    <span className="font-medium">Tout Tranzaksyon</span>
                  </button>

                  <button 
                    onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false) }} 
                    className={`w-full text-left p-3 rounded-lg flex items-center space-x-3 transition-all duration-200 ${
                      activeTab==='settings' 
                        ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-red-600'
                    }`}
                  >
                    <FileText size={18} className={activeTab==='settings' ? 'text-red-600' : ''} />
                    <span className="font-medium">Paramèt ak Sekirite</span>
                  </button>
                </div>
              </div>
            </div>
          </nav>
        </aside>

        <main className="flex-1 p-6 lg:p-8 max-w-full bg-gray-50 min-h-screen">
          {activeTab==='overview' && (
            <div className="max-w-7xl mx-auto">
              {/* Enhanced Profile Section - More Classic */}
              <div className="bg-white rounded-xl p-4 lg:p-5 shadow-sm border border-gray-200 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    {(() => {
                      const displayName = getUserDisplayName(userData?.user || '') || 'Kliyan'
                      const profilePhotoUrl = profilePhotoPreview || (userData as any)?.profile?.profile_picture || (userData as any)?.profile?.photo || (userData as any)?.profile?.photo_url || (userData as any)?.user?.profile_picture || (userData as any)?.user?.photo_url || ''
                      const initials = displayName.split(' ').filter(Boolean).map((s:string)=>s[0]).slice(0,2).join('').toUpperCase() || 'K'
                      return (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center flex-shrink-0 ring-2 ring-red-100 shadow-sm">
                          {profilePhotoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={String(profilePhotoUrl)} alt={displayName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-red-700 font-bold text-lg sm:text-xl">{initials}</span>
                          )}
                        </div>
                      )
                    })()}
                    <div className="min-w-0">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                        {getUserDisplayName(userData?.user || {}) || 'Kliyan'}
                      </h2>
                      <p className="text-gray-600 text-sm sm:text-base">
                        Jesyon kont ak tranzaksyon ou yo
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('settings')} 
                    className="text-gray-600 hover:text-red-600 self-start sm:self-center bg-gray-50 hover:bg-red-50 px-3 py-2 rounded-lg transition-all duration-200 border border-gray-200 hover:border-red-200"
                  >
                    <span className="text-sm font-medium">Mizajou Profil</span>
                  </button>
                </div>

                {/* Enhanced Verification Badge */}
                {verificationStatus && (
                  <div className="mt-4 flex items-center gap-3">
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                      verificationStatus==='verified' 
                        ? 'bg-green-50 text-green-800 border border-green-200' 
                        : verificationStatus==='rejected' 
                          ? 'bg-red-50 text-red-800 border border-red-200' 
                          : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        verificationStatus==='verified' 
                          ? 'bg-green-500' 
                          : verificationStatus==='rejected' 
                            ? 'bg-red-500' 
                            : 'bg-yellow-500'
                      }`}></div>
                      <span>Verifikasyon: {verificationStatus}</span>
                    </div>
                    {showRequestVerification && (
                      <button 
                        onClick={async ()=>{const ok=await requestVerification(); if(ok){alert('Demann voye'); refreshAll()} else {alert('Demann pa pase')}}} 
                        className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >
                        Mande Verifikasyon
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Enhanced Balance Card - Classic Size */}
              <div className="bg-gradient-to-br from-black via-gray-900 to-black rounded-xl p-5 lg:p-6 text-white mb-6 relative overflow-hidden shadow-lg">
                <div className="relative z-10">
                  <p className="text-gray-300 text-xs font-medium mb-2 uppercase tracking-wider">
                    Balans Wallet Ou
                  </p>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 tracking-tight">
                    {userData?.wallet?.balance ?? 0}
                  </div>
                  <p className="text-gray-200 text-base font-medium">
                    {userData?.wallet?.currency ?? 'HTG'}
                  </p>
                </div>
                <div className="absolute top-4 right-4 w-10 h-10 lg:w-12 lg:h-12 bg-red-600 bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <DollarSign className="text-red-400" size={20} />
                </div>
                <div className="absolute -right-6 -bottom-6 w-20 h-20 lg:w-24 lg:h-24 bg-red-600 bg-opacity-10 rounded-full blur-xl"></div>
                <div className="absolute -left-6 -top-6 w-16 h-16 lg:w-20 lg:h-20 bg-red-600 bg-opacity-10 rounded-full blur-xl"></div>
              </div>

              {/* Enhanced Stats Cards - Classic Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5 mb-8">
                <div className="bg-white rounded-xl p-4 lg:p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                      <BarChart3 className="text-blue-600" size={20} />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                        {stats?.monthly_transactions ?? 0}
                      </p>
                      <p className="text-xs text-gray-500 font-medium">Tranzaksyon</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm font-medium">Tranzaksyon Mwa Sa a</p>
                  <div className="mt-2 flex items-center">
                    <div className="w-full bg-blue-100 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 lg:p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-50 rounded-xl flex items-center justify-center">
                      <DollarSign className="text-green-600" size={20} />
                    </div>
                    <div className="text-right">
                      <p className="text-xl lg:text-2xl font-bold text-gray-900">
                        {(stats?.balance ?? userData?.wallet?.balance ?? 0)}
                      </p>
                      <p className="text-xs text-gray-500 font-medium">{userData?.wallet?.currency ?? 'HTG'}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm font-medium">Balans Total</p>
                  <div className="mt-2 flex items-center">
                    <div className="w-full bg-green-100 rounded-full h-1.5">
                      <div className="bg-green-600 h-1.5 rounded-full" style={{ width: '90%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 lg:p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 sm:col-span-2 xl:col-span-1">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                      <Zap className="text-purple-600" size={20} />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl lg:text-3xl font-bold text-gray-900">5</p>
                      <p className="text-xs text-gray-500 font-medium">Disponib</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm font-medium">Aksyon Rapid</p>
                  <div className="mt-2 flex items-center">
                    <div className="w-full bg-purple-100 rounded-full h-1.5">
                      <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Recent Transactions - Classic Size */}
              <div className="bg-white rounded-xl p-5 lg:p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg lg:text-xl font-bold text-gray-900">Dènye Tranzaksyon</h3>
                    <p className="text-gray-500 text-xs mt-1">Wè aktivite yo ki pi resan</p>
                  </div>
                  <button 
                    onClick={refreshAll} 
                    className="bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-gray-200 hover:border-red-200"
                  >
                    Mizajou
                  </button>
                </div>
                {transactions.length===0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Receipt className="text-gray-400" size={20} />
                    </div>
                    <p className="text-gray-500 text-sm">Pa gen tranzaksyon pou kounye a.</p>
                    <p className="text-gray-400 text-xs mt-1">Kòmanse ak premye tranzaksyon ou</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {transactions.slice(0,10).map((t, index) => (
                      <div 
                        key={t.id} 
                        onClick={() => openTransactionDetails(t)} 
                        className={`px-3 py-3 flex items-center justify-between text-sm hover:bg-gray-50 cursor-pointer transition-colors rounded-lg ${
                          index !== transactions.slice(0,10).length - 1 ? 'border-b border-gray-100' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Receipt className="text-gray-500" size={14} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{t.display_type || t.transaction_type}</p>
                            <p className="text-xs text-gray-500">{formatDateTime(t.created_at)}</p>
                          </div>
                        </div>
                        <div className="text-right flex items-center space-x-2">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{t.amount} HTG</p>
                            <p className={`text-xs font-medium ${
                              t.status === 'completed' ? 'text-green-600' : 
                              t.status === 'pending' ? 'text-yellow-600' : 
                              'text-gray-500'
                            }`}>
                              {t.status}
                            </p>
                          </div>
                          <div className="text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                    {transactions.length > 10 && (
                      <div className="pt-3 text-center">
                        <button 
                          onClick={() => setActiveTab('transactions')}
                          className="text-red-600 hover:text-red-700 text-xs font-medium hover:underline"
                        >
                          Wè tout tranzaksyon yo ({transactions.length})
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab==='transfer' && (
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Voye Lajan</h2>
                <p className="text-gray-600">Voye lajan nan destinatè yo ak sekirite ak rapidite</p>
              </div>
              
              {/* Back button when form is shown */}
              {selectedRecipient && (
                <div className="mb-6">
                  <button
                    onClick={() => {
                      setSelectedRecipient(null)
                      setTransferForm({ recipientPhone: '', amount: '', description: '', pin: '' })
                    }}
                    className="flex items-center text-gray-600 hover:text-red-600 text-sm font-medium transition-colors bg-gray-50 hover:bg-red-50 px-4 py-2 rounded-lg border border-gray-200 hover:border-red-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Tounen nan lis destinatè yo
                  </button>
                </div>
              )}
              
              {/* Show recipient list and add button when no recipient is selected */}
              {!selectedRecipient && (
                <>
                  {/* Saved Recipients Section */}
                  {savedRecipients.length > 0 && (
                    <div className="mb-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Destinatè yo Ki Sovgade</h3>
                        <p className="text-gray-600">Chwazi nan lis destinatè yo pou voye lajan pi vit</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {savedRecipients
                          .slice()
                          .sort((a, b) => new Date(b.lastUsed || 0).getTime() - new Date(a.lastUsed || 0).getTime())
                          .map((recipient) => (
                          <div 
                            key={recipient.id} 
                            className="p-5 border-2 border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 cursor-pointer transition-all duration-200 group relative hover:shadow-lg"
                            onClick={() => selectRecipient(recipient)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center mb-3">
                                  <span className="text-red-700 font-bold text-lg">
                                    {recipient.name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}
                                  </span>
                                </div>
                                <p className="font-semibold text-gray-900 truncate mb-1">{recipient.name}</p>
                                <p className="text-sm text-gray-500 truncate">{recipient.phone || recipient.email}</p>
                                {recipient.lastUsed && (
                                  <p className="text-xs text-gray-400 mt-2">
                                    Itilize: {formatDateTimeLocal(recipient.lastUsed, { year: 'numeric', month: '2-digit', day: '2-digit' })}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (confirm(`Efase ${recipient.name}?`)) {
                                    removeRecipient(recipient.id)
                                  }
                                }}
                                className="ml-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white hover:bg-red-50 w-8 h-8 rounded-full flex items-center justify-center"
                                title="Efase destinatè a"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Recipient Button - Enhanced Design */}
                  <div className="text-center bg-white p-12 rounded-2xl shadow-sm border border-gray-200">
                    <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Ajoute Nouvo Destinatè</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Ajoute destinatè yo pou pi vit ak pi fasil nan pwochen fwa yo
                    </p>
                    <button
                      onClick={() => setShowAddRecipient(true)}
                      className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-xl hover:from-red-700 hover:to-red-800 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      Ajoute Destinatè
                    </button>
                  </div>
                </>
              )}

              {/* Transfer Form - Enhanced Design */}
              {selectedRecipient && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-lg mx-auto">
                  <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Destinatè Seleksyone
                    </h3>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center">
                        <span className="text-green-800 font-bold">
                          {selectedRecipient.name.split(' ').map((n:string) => n[0]).slice(0,2).join('').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-green-800">{selectedRecipient.name}</p>
                        <p className="text-sm text-green-700">{selectedRecipient.phone || selectedRecipient.email}</p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleTransferSubmit} className="space-y-6">
                    {/* Amount */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Montan (HTG) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={transferForm.amount}
                          onChange={(e) => setTransferForm({...transferForm, amount: e.target.value})}
                          placeholder="0.00"
                          min="1"
                          step="0.01"
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                          <span className="text-gray-500 font-medium">HTG</span>
                        </div>
                      </div>
                      {transferForm.amount && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Frè:</span> {(parseFloat(transferForm.amount) * 0.01).toFixed(2)} HTG
                            <span className="ml-4 font-medium">Total:</span> {(parseFloat(transferForm.amount) * 1.01).toFixed(2)} HTG
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Kòmantè (opsyonèl)</label>
                      <input
                        type="text"
                        value={transferForm.description}
                        onChange={(e) => setTransferForm({...transferForm, description: e.target.value})}
                        placeholder="Rezon pou tranzaksyon an"
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      />
                    </div>

                    {/* Balance Check */}
                    {userData?.wallet && (
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                        <div className="flex items-center justify-between">
                          <span className="text-blue-800 font-medium">Balans aktyèl:</span>
                          <span className="text-blue-900 font-bold text-lg">{userData.wallet.balance} HTG</span>
                        </div>
                        {transferForm.amount && parseFloat(transferForm.amount) > parseFloat(userData.wallet.balance) && (
                          <p className="text-red-600 text-sm mt-2 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            Ou pa gen ase lajan
                          </p>
                        )}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!transferForm.amount || transferLoading}
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-6 rounded-xl hover:from-red-700 hover:to-red-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:transform-none"
                    >
                      {transferLoading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Ap pwosè...
                        </span>
                      ) : (
                        'Kontinye ak PIN'
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
          {activeTab==='qr' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Kòd QR</h2>
              
              {/* QR Mode Toggle */}
              <div className="flex mb-6 bg-gray-100 rounded-lg p-1 max-w-md">
                <button
                  onClick={() => setQrMode('generate')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    qrMode === 'generate' 
                      ? 'bg-white text-primary-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📤 Kreye Kòd
                </button>
                <button
                  onClick={() => setQrMode('scan')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    qrMode === 'scan' 
                      ? 'bg-white text-primary-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📷 Eskane Kòd
                </button>
              </div>

              {/* Generate QR Code */}
              {qrMode === 'generate' && (
                <div className="bg-white p-6 rounded-lg shadow-sm border max-w-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Kreye Kòd QR pou Resevwa Lajan</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Montan (HTG)</label>
                      <input
                        type="number"
                        value={qrForm.amount}
                        onChange={(e) => setQrForm({...qrForm, amount: e.target.value})}
                        placeholder="0.00"
                        min="1"
                        step="0.01"
                        className="w-full border rounded px-3 py-2 text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kòmantè (opsyonèl)</label>
                      <input
                        type="text"
                        value={qrForm.description}
                        onChange={(e) => setQrForm({...qrForm, description: e.target.value})}
                        placeholder="Rezon pou peman an"
                        className="w-full border rounded px-3 py-2 text-sm"
                      />
                    </div>

                    <button
                      onClick={generateQRCode}
                      disabled={!qrForm.amount}
                      className="w-full bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Kreye Kòd QR
                    </button>

                    {qrCode && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center">
                        <p className="text-sm text-gray-600 mb-2">Kòd QR ou an (montre l bay moun ki ap peye a):</p>
                        <div className="bg-white p-4 rounded border inline-block">
                          {qrImage ? (
                            <div className="w-48 h-48 flex items-center justify-center">
                              <img 
                                src={`data:image/png;base64,${qrImage}`}
                                alt="QR Code"
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-xs text-gray-500 break-all">
                              📱 QR Code<br/>
                              <small className="block mt-2 max-w-full overflow-hidden">
                                {qrCode.substring(0, 50)}...
                              </small>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Montan: {qrForm.amount} HTG
                          {qrForm.description && <><br/>Rezon: {qrForm.description}</>}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Scan QR Code */}
              {qrMode === 'scan' && (
                <div className="bg-white p-6 rounded-lg shadow-sm border max-w-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Eskane Kòd QR pou Peye</h3>
                  
                  <div className="space-y-4">
                    {/* Camera Scanner Section */}
                    <div className="space-y-3">

                      {!cameraActive ? (
                        <div className="text-center">
                          <div className="w-full h-48 bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center mb-3">
                            <div className="text-center text-gray-500">
                              <div className="text-4xl mb-2">📷</div>
                              <p className="text-sm">Kamera pa aktif</p>
                            </div>
                          </div>
                          <button
                            onClick={startCamera}
                            className="w-full bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700"
                          >
                            Ouvri Kamera
                          </button>
                          {scannerError && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                              <p className="text-sm text-red-800">{scannerError}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="relative w-full h-48 bg-black rounded overflow-hidden mb-3">
                            <video
                              id="qr-video"
                              className="w-full h-full object-cover"
                              autoPlay
                              playsInline
                            />
                            <canvas id="qr-canvas" className="hidden" />

                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={scanQRFromCamera}
                              className="flex-1 bg-green-600 text-white py-2 px-3 rounded hover:bg-green-700"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4M4 8h4m4 0V4m0 0h4m-4 0a2 2 0 019 0M8 20h4a2 2 0 000-4H8a2 2 0 000 4z" />
                              </svg>
                              Eskane Kòd
                            </button>
                            <button
                              onClick={stopCamera}
                              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            >
                              Fèmen
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Manual Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Done Kòd QR</label>
                      <textarea
                        value={scannedData}
                        onChange={(e) => setScannedData(e.target.value)}
                        placeholder="Kole done kòd QR isit la oswa sèvi ak kamera a"
                        className="w-full border rounded px-3 py-2 text-sm h-24"
                      />
                    </div>

                    <button
                      onClick={processQRPayment}
                      disabled={!scannedData}
                      className="w-full bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Peye ak Kòd QR
                    </button>

                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-xs text-blue-800">
                        💡 Pou teste: Kreye yon kòd QR nan tab "Kreye Kòd" ak kole done yo isit la
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab==='bills' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Peye Faktè</h2>
              <div className="bg-white p-6 rounded-lg shadow-sm border max-w-md">
                <form onSubmit={handleBillPayment} className="space-y-4">
                  {/* Bill Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tip Faktè</label>
                    <select
                      value={billForm.billType}
                      onChange={(e) => setBillForm({...billForm, billType: e.target.value, serviceProvider: e.target.value === 'electricity' ? 'EDH' : e.target.value === 'water' ? 'DINEPA' : 'Natcom'})}
                      className="w-full border rounded px-3 py-2 text-sm"
                    >
                      <option value="electricity">Elektrisite</option>
                      <option value="water">Dlo</option>
                      <option value="internet">Entènèt</option>
                      <option value="phone">Telefòn</option>
                    </select>
                  </div>

                  {/* Service Provider */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Konpanyi</label>
                    <select
                      value={billForm.serviceProvider}
                      onChange={(e) => setBillForm({...billForm, serviceProvider: e.target.value})}
                      className="w-full border rounded px-3 py-2 text-sm"
                    >
                      {billForm.billType === 'electricity' && (
                        <>
                          <option value="EDH">EDH (Électricité d'Haïti)</option>
                          <option value="SOGENER">SOGENER</option>
                        </>
                      )}
                      {billForm.billType === 'water' && (
                        <>
                          <option value="DINEPA">DINEPA</option>
                          <option value="CAMEP">CAMEP</option>
                        </>
                      )}
                      {billForm.billType === 'internet' && (
                        <>
                          <option value="Access Haiti">Access Haiti</option>
                          <option value="Natcom">Natcom</option>
                          <option value="Digicel">Digicel</option>
                        </>
                      )}
                      {billForm.billType === 'phone' && (
                        <>
                          <option value="Natcom">Natcom</option>
                          <option value="Digicel">Digicel</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Account Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nimewo Kont</label>
                    <input
                      type="text"
                      value={billForm.accountNumber}
                      onChange={(e) => setBillForm({...billForm, accountNumber: e.target.value})}
                      placeholder="Antre nimewo kont ou"
                      className="w-full border rounded px-3 py-2 text-sm"
                      required
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Montan (HTG)</label>
                    <input
                      type="number"
                      value={billForm.amount}
                      onChange={(e) => setBillForm({...billForm, amount: e.target.value})}
                      placeholder="0.00"
                      min="1"
                      step="0.01"
                      className="w-full border rounded px-3 py-2 text-sm"
                      required
                    />
                    {billForm.amount && (
                      <p className="text-xs text-gray-500 mt-1">
                        Frè: {(parseFloat(billForm.amount) * 0.005).toFixed(2)} HTG | Total: {(parseFloat(billForm.amount) * 1.005).toFixed(2)} HTG
                      </p>
                    )}
                  </div>

                  {/* Balance Check */}
                  {userData?.wallet && (
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <p>Balans aktyèl: <span className="font-semibold">{userData.wallet.balance} HTG</span></p>
                      {billForm.amount && parseFloat(billForm.amount) * 1.005 > parseFloat(userData.wallet.balance) && (
                        <p className="text-red-600 text-xs mt-1">⚠️ Ou pa gen ase lajan</p>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!billForm.accountNumber || !billForm.amount}
                    className="w-full bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Peye Faktè
                  </button>
                </form>
              </div>
            </div>
          )}
          {activeTab==='wallet' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Wallet</h2>
              {userData?.wallet ? (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <p className="text-sm text-gray-600 mb-1">Balans</p>
                  <p className="text-3xl font-bold text-gray-900 mb-4">{userData.wallet.balance} {userData.wallet.currency}</p>
                  <button onClick={refreshAll} className="text-xs bg-gray-100 px-3 py-1 rounded hover:bg-gray-200">Mizajou</button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Pa gen wallet.</p>
              )}
            </div>
          )}
          {activeTab==='transactions' && (
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Tout Tranzaksyon</h2>
                <p className="text-gray-600">Wè ak filtre tout tranzaksyon ou yo</p>
              </div>

              {/* Search and Filters */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Rechèche</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={transactionSearch}
                        onChange={(e) => setTransactionSearch(e.target.value)}
                        placeholder="Rechèche tranzaksyon..."
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 pl-10 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Type Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tip Tranzaksyon</label>
                    <select
                      value={transactionFilter}
                      onChange={(e) => setTransactionFilter(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    >
                      <option value="all">Tout tip yo</option>
                      <option value="sent">Lajan voye</option>
                      <option value="received">Lajan resevwa</option>
                      <option value="bills">Fakti peye</option>
                      <option value="topup">Top up minit</option>
                    </select>
                  </div>

                  {/* Date Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Pèryòd</label>
                    <select
                      value={transactionDateFilter}
                      onChange={(e) => setTransactionDateFilter(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    >
                      <option value="all">Tout dat yo</option>
                      <option value="today">Jodi a</option>
                      <option value="week">7 dènye jou yo</option>
                      <option value="month">30 dènye jou yo</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Estati</label>
                    <select
                      value={transactionStatusFilter}
                      onChange={(e) => setTransactionStatusFilter(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    >
                      <option value="all">Tout estati yo</option>
                      <option value="completed">Konple</option>
                      <option value="pending">Ap tann</option>
                      <option value="failed">Echwe</option>
                    </select>
                  </div>
                </div>

                {/* Results Summary */}
                <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-100">
                  <span>
                    {getPaginatedTransactions().totalTransactions} tranzaksyon jwenn
                  </span>
                  <div className="flex items-center gap-4">
                    <span>Montre:</span>
                    <select
                      value={transactionsPerPage}
                      onChange={(e) => {
                        setTransactionsPerPage(Number(e.target.value))
                        setCurrentTransactionPage(1)
                      }}
                      className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span>pa paj</span>
                  </div>
                </div>
              </div>

              {/* Transactions List */}
              {(() => {
                const { transactions: paginatedTransactions, totalTransactions, totalPages } = getPaginatedTransactions()
                
                if (totalTransactions === 0) {
                  return (
                    <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-200 text-center">
                      <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {transactionSearch || transactionFilter !== 'all' || transactionDateFilter !== 'all' || transactionStatusFilter !== 'all' 
                          ? 'Pa gen tranzaksyon ki konfòme ak rechèche a' 
                          : 'Pa gen tranzaksyon pou kounye a'
                        }
                      </h3>
                      <p className="text-gray-500 mb-6">
                        {transactionSearch || transactionFilter !== 'all' || transactionDateFilter !== 'all' || transactionStatusFilter !== 'all'
                          ? 'Eseye chanje filtè yo pou wè pi plis rezilta'
                          : 'Kòmanse ak premye tranzaksyon ou'
                        }
                      </p>
                      {(transactionSearch || transactionFilter !== 'all' || transactionDateFilter !== 'all' || transactionStatusFilter !== 'all') && (
                        <button
                          onClick={() => {
                            setTransactionSearch('')
                            setTransactionFilter('all')
                            setTransactionDateFilter('all')
                            setTransactionStatusFilter('all')
                            setCurrentTransactionPage(1)
                          }}
                          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                        >
                          Efase tout filtè yo
                        </button>
                      )}
                    </div>
                  )
                }
                
                return (
                  <>
                    {/* Transaction Cards - Classic Size */}
                    <div className="space-y-2 mb-6">
                      {paginatedTransactions.map((t, index) => (
                        <div 
                          key={t.id} 
                          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md hover:border-red-200 transition-all duration-200 cursor-pointer"
                          onClick={() => openTransactionDetails(t)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {/* Transaction Icon */}
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
                                {getTransactionIcon(t)}
                              </div>
                              
                              {/* Transaction Details */}
                              <div>
                                <h4 className="font-semibold text-gray-900 text-sm">
                                  {t.display_type || t.transaction_type}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {formatDateTime(t.created_at)}
                                </p>
                                {t.description && (
                                  <p className="text-xs text-gray-600 mt-0.5">
                                    {t.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              {/* Amount */}
                              <div className="text-right">
                                <p className="text-base font-bold text-gray-900">
                                  {t.amount} HTG
                                </p>
                                <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getTransactionColor(t.status)}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                    t.status?.toLowerCase().includes('completed') || t.status?.toLowerCase().includes('success') || t.status?.toLowerCase().includes('konple') 
                                      ? 'bg-green-500' 
                                      : t.status?.toLowerCase().includes('pending') || t.status?.toLowerCase().includes('processing') || t.status?.toLowerCase().includes('ap tann')
                                        ? 'bg-yellow-500'
                                        : t.status?.toLowerCase().includes('failed') || t.status?.toLowerCase().includes('error') || t.status?.toLowerCase().includes('echwe')
                                          ? 'bg-red-500'
                                          : 'bg-gray-500'
                                  }`}></div>
                                  {t.status}
                                </div>
                              </div>
                              
                              {/* Arrow */}
                              <div className="text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination - Classic Size */}
                    {totalPages > 1 && (
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-600">
                            Montre {((currentTransactionPage - 1) * transactionsPerPage) + 1} nan {Math.min(currentTransactionPage * transactionsPerPage, totalTransactions)} sou {totalTransactions} tranzaksyon
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => setCurrentTransactionPage(Math.max(1, currentTransactionPage - 1))}
                              disabled={currentTransactionPage === 1}
                              className="px-2 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
                            >
                              Anvan
                            </button>
                            
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum
                              if (totalPages <= 5) {
                                pageNum = i + 1
                              } else if (currentTransactionPage <= 3) {
                                pageNum = i + 1
                              } else if (currentTransactionPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i
                              } else {
                                pageNum = currentTransactionPage - 2 + i
                              }
                              
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentTransactionPage(pageNum)}
                                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                                    pageNum === currentTransactionPage
                                      ? 'bg-red-600 text-white'
                                      : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              )
                            })}
                            
                            <button
                              onClick={() => setCurrentTransactionPage(Math.min(totalPages, currentTransactionPage + 1))}
                              disabled={currentTransactionPage === totalPages}
                              className="px-2 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
                            >
                              Apre
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          )}
          {activeTab==='topup' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Voye Minit</h2>
              <form onSubmit={handleTopupSubmit} className="bg-white p-6 rounded-lg shadow-sm border space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nimewo Benefisyè</label>
                  <input 
                    value={topupForm.recipientNumber} 
                    onChange={e=>setTopupForm({...topupForm, recipientNumber:e.target.value})} 
                    className="w-full border rounded px-3 py-2 text-sm" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Operatè</label>
                  <select 
                    value={topupForm.carrier} 
                    onChange={e=>setTopupForm({...topupForm, carrier:e.target.value})} 
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="digicel">Digicel</option>
                    <option value="natcom">Natcom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montan (HTG)</label>
                  <input 
                    type="number" 
                    value={topupForm.amount} 
                    onChange={e=>setTopupForm({...topupForm, amount:e.target.value})} 
                    className="w-full border rounded px-3 py-2 text-sm" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mesaj (opsyonèl)</label>
                  <textarea 
                    value={topupForm.message} 
                    onChange={e=>setTopupForm({...topupForm, message:e.target.value})} 
                    className="w-full border rounded px-3 py-2 text-sm" 
                    rows={3}
                  ></textarea>
                </div>
                <div className="flex justify-between items-center">
                  <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded text-sm hover:bg-primary-700">Voye</button>
                  <button type="button" onClick={()=>refreshAll()} className="text-xs text-gray-500 hover:underline">Refresh</button>
                </div>
              </form>
            </div>
          )}
          {activeTab==='settings' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Paramèt</h2>
              
              {/* PIN Management Section */}
              <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sekirite PIN</h3>
                
                {pinStatus ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {pinStatus.has_pin ? '✅ PIN Konfigire' : '❌ Pa gen PIN'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {pinStatus.has_pin 
                            ? 'PIN ou konfigire pou tranzaksyon yo' 
                            : 'Ou dwe konfigire yon PIN pou ka voye lajan'
                          }
                        </p>
                        {pinStatus.pin_locked && (
                          <p className="text-sm text-red-600 mt-1">
                            ⚠️ PIN bloke akòz twòp esè ki mal
                          </p>
                        )}
                        {pinStatus.pin_attempts > 0 && !pinStatus.pin_locked && (
                          <p className="text-sm text-yellow-600 mt-1">
                            ⚠️ {pinStatus.pin_attempts} esè ki mal
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setShowPinSetup(true)}
                        className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
                      >
                        {pinStatus.has_pin ? 'Chanje PIN' : 'Konfigire PIN'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full"></div>
                    <span className="text-sm text-gray-500">Chajman enfòmasyon PIN...</span>
                  </div>
                )}
              </div>

              {/* Profile Management Section */}
              <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">👤 Jesyon Profil</h3>
                
                <div className="space-y-6">
                  {/* Profile Photo Section */}
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      {(() => {
                        // Check for preview first (when user selects new photo)
                        if (profilePhotoPreview) {
                          return <img src={profilePhotoPreview} alt="Profil" className="w-full h-full object-cover" />
                        }
                        
                        // Check for existing profile photo from user data
                        const existingPhoto = (userData as any)?.profile?.profile_picture || 
                                            (userData as any)?.profile?.photo || 
                                            (userData as any)?.profile?.photo_url || 
                                            (userData as any)?.user?.profile_picture || 
                                            (userData as any)?.user?.photo_url || ''
                        
                        if (existingPhoto) {
                          // Ensure the URL is complete
                          const photoUrl = existingPhoto.startsWith('http') ? existingPhoto : `http://127.0.0.1:8000${existingPhoto}`
                          return <img src={photoUrl} alt="Profil" className="w-full h-full object-cover" />
                        }
                        
                        // Default avatar if no photo
                        return <span className="text-2xl text-gray-500">👤</span>
                      })()}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{userData?.user?.first_name} {userData?.user?.last_name}</h4>
                      <p className="text-sm text-gray-500">{userData?.user?.email}</p>
                      <div className="mt-3">
                        <label className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm cursor-pointer transition-colors inline-flex items-center gap-2">
                          📷 
                          {selectedLanguage === 'kreyol' && 'Chanje Foto'}
                          {selectedLanguage === 'french' && 'Changer Photo'}
                          {selectedLanguage === 'english' && 'Change Photo'}
                          {selectedLanguage === 'spanish' && 'Cambiar Foto'}
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                // Validate file size before setting
                                const maxSize = 5 * 1024 * 1024; // 5MB
                                if (file.size > maxSize) {
                                  alert('❌ Foto a twò gwo. Li dwe pi piti pase 5MB.')
                                  e.target.value = '' // Reset input
                                  return
                                }
                                
                                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
                                if (!allowedTypes.includes(file.type.toLowerCase())) {
                                  alert('❌ Tip fichye pa aksèpte. Tanpri chwazi JPG, PNG, GIF oswa WebP.')
                                  e.target.value = '' // Reset input
                                  return
                                }

                                setProfilePhotoFile(file)
                                const reader = new FileReader()
                                reader.onload = (e) => setProfilePhotoPreview(e.target?.result as string)
                                reader.readAsDataURL(file)
                              }
                            }}
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          {selectedLanguage === 'kreyol' && 'JPG, PNG, GIF oswa WebP (maksimòm 5MB)'}
                          {selectedLanguage === 'french' && 'JPG, PNG, GIF ou WebP (maximum 5MB)'}
                          {selectedLanguage === 'english' && 'JPG, PNG, GIF or WebP (maximum 5MB)'}
                          {selectedLanguage === 'spanish' && 'JPG, PNG, GIF o WebP (máximo 5MB)'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Name Display (non-editable) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prenom</label>
                      <input
                        type="text"
                        value={userData?.user?.first_name || ''}
                        disabled
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Pa ka chanje</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Non</label>
                      <input
                        type="text"
                        value={userData?.user?.last_name || ''}
                        disabled
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Pa ka chanje</p>
                    </div>
                  </div>

                  {/* Email Management */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <button
                        onClick={() => {
                          setShowEmailChange(!showEmailChange)
                          setProfileForm({...profileForm, email: userData?.user?.email || ''})
                        }}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Chanje
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="email"
                        value={showEmailChange ? profileForm.email : userData?.user?.email || ''}
                        onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                        disabled={!showEmailChange}
                        className={`w-full p-3 border border-gray-300 rounded-lg ${!showEmailChange ? 'bg-gray-50 text-gray-500' : 'focus:ring-2 focus:ring-red-500 focus:border-red-500'}`}
                      />
                      {showEmailChange && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={async () => {
                              setProfileLoading(true)
                              const token = localStorage.getItem('auth_token')
                              try {
                                const response = await fetch('http://127.0.0.1:8000/api/auth/update-email/', {
                                  method: 'PUT',
                                  headers: {
                                    'Authorization': `Token ${token}`,
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({ email: profileForm.email })
                                })
                                
                                if (response.ok) {
                                  alert('✅ Email chanje ak siksè!')
                                  setShowEmailChange(false)
                                  await refreshAll()
                                } else {
                                  const error = await response.json()
                                  alert(`❌ Erè: ${error.error || 'Email pa chanje'}`)
                                }
                              } catch (error) {
                                alert('❌ Erè nan koneksyon an')
                              } finally {
                                setProfileLoading(false)
                              }
                            }}
                            disabled={profileLoading}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                          >
                            Konfime
                          </button>
                          <button
                            onClick={() => setShowEmailChange(false)}
                            className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                          >
                            Anile
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Phone Number Management */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Nimewo Telefòn</label>
                      <button
                        onClick={() => {
                          setShowPhoneChange(!showPhoneChange)
                          setProfileForm({...profileForm, phone: userData?.user?.phone_number || ''})
                        }}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Chanje
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="tel"
                        value={showPhoneChange ? profileForm.phone : userData?.user?.phone_number || ''}
                        onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                        disabled={!showPhoneChange}
                        placeholder="+509 XXXX XXXX"
                        className={`w-full p-3 border border-gray-300 rounded-lg ${!showPhoneChange ? 'bg-gray-50 text-gray-500' : 'focus:ring-2 focus:ring-red-500 focus:border-red-500'}`}
                      />
                      {showPhoneChange && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={async () => {
                              setProfileLoading(true)
                              const token = localStorage.getItem('auth_token')
                              try {
                                const response = await fetch('http://127.0.0.1:8000/api/auth/update-phone/', {
                                  method: 'PUT',
                                  headers: {
                                    'Authorization': `Token ${token}`,
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({ phone: profileForm.phone })
                                })
                                
                                if (response.ok) {
                                  alert('✅ Nimewo telefòn chanje ak siksè!')
                                  setShowPhoneChange(false)
                                  await refreshAll()
                                } else {
                                  const error = await response.json()
                                  alert(`❌ Erè: ${error.error || 'Nimewo pa chanje'}`)
                                }
                              } catch (error) {
                                alert('❌ Erè nan koneksyon an')
                              } finally {
                                setProfileLoading(false)
                              }
                            }}
                            disabled={profileLoading}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                          >
                            Konfime
                          </button>
                          <button
                            onClick={() => setShowPhoneChange(false)}
                            className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                          >
                            Anile
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Password Change */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Modpas</label>
                      <button
                        onClick={() => setShowPasswordChange(!showPasswordChange)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Chanje Modpas
                      </button>
                    </div>
                    
                    {showPasswordChange && (
                      <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                        <input
                          type="password"
                          value={profileForm.currentPassword}
                          onChange={(e) => setProfileForm({...profileForm, currentPassword: e.target.value})}
                          placeholder="Modpas aktyèl"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        />
                        <input
                          type="password"
                          value={profileForm.newPassword}
                          onChange={(e) => setProfileForm({...profileForm, newPassword: e.target.value})}
                          placeholder="Nouvo modpas"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        />
                        <input
                          type="password"
                          value={profileForm.confirmPassword}
                          onChange={(e) => setProfileForm({...profileForm, confirmPassword: e.target.value})}
                          placeholder="Konfime nouvo modpas"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              if (!profileForm.currentPassword || !profileForm.newPassword || !profileForm.confirmPassword) {
                                alert('Tanpri ranpli tout jan yo')
                                return
                              }
                              
                              if (profileForm.newPassword !== profileForm.confirmPassword) {
                                alert('Nouvo modpas yo pa menm')
                                return
                              }
                              
                              if (profileForm.newPassword.length < 8) {
                                alert('Nouvo modpas la dwe gen omwen 8 karaktè')
                                return
                              }
                              
                              setProfileLoading(true)
                              const token = localStorage.getItem('auth_token')
                              try {
                                const response = await fetch('http://127.0.0.1:8000/api/auth/change-password/', {
                                  method: 'PUT',
                                  headers: {
                                    'Authorization': `Token ${token}`,
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    current_password: profileForm.currentPassword,
                                    new_password: profileForm.newPassword
                                  })
                                })
                                
                                if (response.ok) {
                                  alert('✅ Modpas chanje ak siksè!')
                                  setShowPasswordChange(false)
                                  setProfileForm({...profileForm, currentPassword: '', newPassword: '', confirmPassword: ''})
                                } else {
                                  const error = await response.json()
                                  alert(`❌ Erè: ${error.error || 'Modpas pa chanje'}`)
                                }
                              } catch (error) {
                                alert('❌ Erè nan koneksyon an')
                              } finally {
                                setProfileLoading(false)
                              }
                            }}
                            disabled={profileLoading}
                            className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                          >
                            Chanje Modpas
                          </button>
                          <button
                            onClick={() => {
                              setShowPasswordChange(false)
                              setProfileForm({...profileForm, currentPassword: '', newPassword: '', confirmPassword: ''})
                            }}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-400"
                          >
                            Anile
                          </button>
                        </div>
                        
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <h5 className="text-sm font-medium text-blue-900 mb-1">Konsèy Sekirite:</h5>
                          <ul className="text-xs text-blue-800 space-y-1">
                            <li>• Omwen 8 karaktè</li>
                            <li>• Melanje lèt ak chif</li>
                            <li>• Pa itilize enfòmasyon pèsonèl</li>
                            <li>• Pa pataje modpas ou ak persòn</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Upload Profile Photo Button */}
                  {profilePhotoFile && (
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          // Validate file before upload
                          if (!profilePhotoFile) {
                            alert('❌ Pa gen foto ki chwazi')
                            return
                          }

                          // Check file size (max 5MB)
                          const maxSize = 5 * 1024 * 1024; // 5MB
                          if (profilePhotoFile.size > maxSize) {
                            alert('❌ Foto a twò gwo. Li dwe pi piti pase 5MB.')
                            return
                          }

                          // Check file type
                          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
                          if (!allowedTypes.includes(profilePhotoFile.type.toLowerCase())) {
                            alert('❌ Tip fichye pa aksèpte. Tanpri chwazi JPG, PNG, GIF oswa WebP.')
                            return
                          }

                          setProfileLoading(true)
                          const token = localStorage.getItem('auth_token')
                          const formData = new FormData()
                          formData.append('profile_picture', profilePhotoFile)
                          
                          try {
                            const response = await fetch('http://127.0.0.1:8000/api/auth/upload-photo/', {
                              method: 'POST',
                              headers: {
                                'Authorization': `Token ${token}`,
                              },
                              body: formData
                            })
                            
                            if (response.ok) {
                              const data = await response.json()
                              alert('✅ Foto profil chanje ak siksè!')
                              setProfilePhotoFile(null)
                              
                              // Clear the preview since we'll use the server photo now
                              setProfilePhotoPreview('')
                              
                              // Refresh all data to get the updated profile photo
                              await refreshAll()
                            } else {
                              const error = await response.json()
                              alert(`❌ Erè: ${error.error || error.message || 'Foto pa chanje'}`)
                            }
                          } catch (error) {
                            console.error('Upload error:', error)
                            alert('❌ Erè nan koneksyon an. Tanpri eseye ankò.')
                          } finally {
                            setProfileLoading(false)
                          }
                        }}
                        disabled={profileLoading}
                        className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                      >
                        📷 Anrejistre Foto
                      </button>
                      <button
                        onClick={() => {
                          setProfilePhotoFile(null)
                          setProfilePhotoPreview('')
                        }}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-400"
                      >
                        Anile
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Language Settings Section */}
              <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🌍 {t('language_settings')}</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">{t('choose_language')}</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { code: 'kreyol' as LanguageCode, name: 'Kreyòl Ayisyen', flag: '🇭🇹', native: 'Kreyòl' },
                        { code: 'french' as LanguageCode, name: 'Français', flag: '🇫🇷', native: 'Français' },
                        { code: 'english' as LanguageCode, name: 'English', flag: '🇺🇸', native: 'English' },
                        { code: 'spanish' as LanguageCode, name: 'Español', flag: '🇪🇸', native: 'Español' }
                      ].map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => setSelectedLanguage(lang.code)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedLanguage === lang.code
                              ? 'border-red-500 bg-red-50 text-red-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-2xl mb-1">{lang.flag}</div>
                            <div className="font-medium text-sm">{lang.native}</div>
                            <div className="text-xs text-gray-500">{lang.name}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Preview Section */}
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h4 className="font-medium text-gray-900 mb-3">📋 Aperçu</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div className="bg-white p-2 rounded text-center">
                        <div className="text-xs text-gray-500">Dashboard</div>
                      </div>
                      <div className="bg-white p-2 rounded text-center">
                        <div className="text-xs text-gray-500">
                          {selectedLanguage === 'kreyol' && 'Voye Lajan'}
                          {selectedLanguage === 'french' && 'Envoyer argent'}
                          {selectedLanguage === 'english' && 'Send Money'}
                          {selectedLanguage === 'spanish' && 'Enviar dinero'}
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded text-center">
                        <div className="text-xs text-gray-500">
                          {selectedLanguage === 'kreyol' && 'Wallet'}
                          {selectedLanguage === 'french' && 'Portefeuille'}
                          {selectedLanguage === 'english' && 'Wallet'}
                          {selectedLanguage === 'spanish' && 'Billetera'}
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded text-center">
                        <div className="text-xs text-gray-500">{t('language_settings')}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-sm text-gray-600">
                        {t('selected_language')}: <span className="font-medium">
                          {getLanguageDisplayName(selectedLanguage)}
                        </span> {getLanguageFlag(selectedLanguage)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedLanguage === 'kreyol' && 'Chanjman an ap pran efè apre w klicke "Anrejistre"'}
                        {selectedLanguage === 'french' && 'Les changements prendront effet après avoir cliqué sur "Enregistrer"'}
                        {selectedLanguage === 'english' && 'Changes will take effect after clicking "Save"'}
                        {selectedLanguage === 'spanish' && 'Los cambios tomarán efecto después de hacer clic en "Guardar"'}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        setLanguageLoading(true)
                        const token = localStorage.getItem('auth_token')
                        try {
                          const response = await fetch('http://127.0.0.1:8000/api/auth/update-language/', {
                            method: 'PUT',
                            headers: {
                              'Authorization': `Token ${token}`,
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ language: selectedLanguage })
                          })
                          
                          if (response.ok) {
                            const messages = {
                              kreyol: '✅ Lang chanje ak siksè!',
                              french: '✅ Langue changée avec succès!',
                              english: '✅ Language changed successfully!',
                              spanish: '✅ ¡Idioma cambiado con éxito!'
                            }
                            alert(messages[selectedLanguage])
                            localStorage.setItem('user_language', selectedLanguage)
                            await refreshAll()
                            // Refresh page to apply translations everywhere
                            window.location.reload()
                          } else {
                            const error = await response.json()
                            alert(`❌ ${t('error')}: ${error.error || 'Lang pa chanje'}`)
                          }
                        } catch (error) {
                          alert(`❌ ${t('error')} nan koneksyon an`)
                        } finally {
                          setLanguageLoading(false)
                        }
                      }}
                      disabled={languageLoading}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {languageLoading ? 
                        (selectedLanguage === 'kreyol' ? 'Ap anrejistre...' :
                         selectedLanguage === 'french' ? 'Enregistrement...' :
                         selectedLanguage === 'english' ? 'Saving...' : 'Guardando...') 
                        : 
                        `💾 ${t('save_language')}`
                      }
                    </button>
                  </div>

                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">📝 {selectedLanguage === 'kreyol' ? 'Enfòmasyon sou Lang yo' : selectedLanguage === 'french' ? 'Informations sur les langues' : selectedLanguage === 'english' ? 'Language Information' : 'Información de idiomas'}</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {selectedLanguage === 'kreyol' && (
                        <>
                          <li>• <strong>Kreyòl Ayisyen:</strong> Lang prensipal yo nan Ayiti</li>
                          <li>• <strong>Français:</strong> Lang ofisyèl Ayiti ak Kanada</li>
                          <li>• <strong>English:</strong> Lang entènasyonal yo nan biznis</li>
                          <li>• <strong>Español:</strong> Lang yo nan Amerika Latin</li>
                        </>
                      )}
                      {selectedLanguage === 'french' && (
                        <>
                          <li>• <strong>Créole haïtien:</strong> Langue principale d'Haïti</li>
                          <li>• <strong>Français:</strong> Langue officielle d'Haïti et du Canada</li>
                          <li>• <strong>Anglais:</strong> Langue internationale des affaires</li>
                          <li>• <strong>Espagnol:</strong> Langue de l'Amérique latine</li>
                        </>
                      )}
                      {selectedLanguage === 'english' && (
                        <>
                          <li>• <strong>Haitian Creole:</strong> Main language of Haiti</li>
                          <li>• <strong>French:</strong> Official language of Haiti and Canada</li>
                          <li>• <strong>English:</strong> International business language</li>
                          <li>• <strong>Spanish:</strong> Language of Latin America</li>
                        </>
                      )}
                      {selectedLanguage === 'spanish' && (
                        <>
                          <li>• <strong>Criollo haitiano:</strong> Idioma principal de Haití</li>
                          <li>• <strong>Francés:</strong> Idioma oficial de Haití y Canadá</li>
                          <li>• <strong>Inglés:</strong> Idioma internacional de negocios</li>
                          <li>• <strong>Español:</strong> Idioma de América Latina</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 2FA and Advanced Security */}
              <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sekirite Avanse</h3>
                
                {securityOverview ? (
                  <div className="space-y-4">
                    {/* 2FA Status */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {securityOverview.two_factor_enabled ? '✅ 2FA Aktive' : '❌ 2FA Pa Aktive'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Otentifikasyon ak de faktè
                        </p>
                      </div>
                      <button
                        onClick={enable2FA}
                        disabled={securityOverview.two_factor_enabled}
                        className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {securityOverview.two_factor_enabled ? 'Aktive' : 'Aktive 2FA'}
                      </button>
                    </div>

                    {/* Email/Phone Verification */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <span className={`ml-2 ${securityOverview.email_verified ? 'text-green-600' : 'text-red-600'}`}>
                          {securityOverview.email_verified ? '✅ Verifye' : '❌ Pa verifye'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Telefòn:</span>
                        <span className={`ml-2 ${securityOverview.phone_verified ? 'text-green-600' : 'text-red-600'}`}>
                          {securityOverview.phone_verified ? '✅ Verifye' : '❌ Pa verifye'}
                        </span>
                      </div>
                    </div>

                    {/* Device Info */}
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <p className="font-medium text-gray-900 mb-1">Enfòmasyon Aparèy</p>
                      <p className="text-gray-600">IP: {securityOverview.device_info?.current_ip}</p>
                      <p className="text-gray-600 truncate">
                        Navegatè: {securityOverview.device_info?.user_agent?.substring(0, 50)}...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full"></div>
                    <span className="text-sm text-gray-500">Chajman enfòmasyon sekirite...</span>
                  </div>
                )}
              </div>

              {/* Recent Security Activities */}
              {securityOverview?.recent_activities && securityOverview.recent_activities.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Dènye Aktivite Sekirite</h3>
                  <div className="space-y-3">
                    {securityOverview.recent_activities.slice(0, 5).map((activity: any, index: number) => (
                      <div key={index} className="flex justify-between items-start text-sm">
                        <div>
                          <p className="font-medium text-gray-900">{activity.event_type}</p>
                          <p className="text-gray-500">IP: {activity.ip_address}</p>
                        </div>
                        <p className="text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Account Information */}
              <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Enfòmasyon Kont</h3>
                {userData?.user && (
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-600">Non:</span>
                      <span className="ml-2 font-medium">{userData.user.first_name} {userData.user.last_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 font-medium">{userData.user.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Telefòn:</span>
                      <span className="ml-2 font-medium">{userData.user.phone_number || 'Pa konfigire'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Tip Kont:</span>
                      <span className="ml-2 font-medium capitalize">{userData.user.user_type}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Plis paramèt ap vini nan pwochèn mizajou yo...</p>
              </div>
            </div>
          )}

      {/* Add Recipient Modal */}
      {showAddRecipient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Ajoute Destinatè</h3>
              <button
                onClick={() => {
                  setShowAddRecipient(false)
                  setAddRecipientForm({ name: '', contact: '', contactType: 'phone', country: 'HT' })
                }}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); addNewRecipient() }} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Non Destinatè *</label>
                <input
                  type="text"
                  value={addRecipientForm.name}
                  onChange={(e) => setAddRecipientForm({...addRecipientForm, name: e.target.value})}
                  placeholder="Antre non destinatè a"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>

              {/* Contact Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tip Kontak</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="contactType"
                      value="phone"
                      checked={addRecipientForm.contactType === 'phone'}
                      onChange={(e) => setAddRecipientForm({...addRecipientForm, contactType: e.target.value as 'phone' | 'email'})}
                      className="mr-2 text-red-600"
                    />
                    <span className="text-sm">📞 Telefòn</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="contactType"
                      value="email"
                      checked={addRecipientForm.contactType === 'email'}
                      onChange={(e) => setAddRecipientForm({...addRecipientForm, contactType: e.target.value as 'phone' | 'email'})}
                      className="mr-2 text-red-600"
                    />
                    <span className="text-sm">📧 Email</span>
                  </label>
                </div>
              </div>

              {/* Country Selector - Show only for phone */}
              {addRecipientForm.contactType === 'phone' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Peyi</label>
                  <select
                    value={addRecipientForm.country}
                    onChange={(e) => setAddRecipientForm({...addRecipientForm, country: e.target.value, contact: ''})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.name} ({country.dialCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Contact Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {addRecipientForm.contactType === 'phone' ? 'Nimewo Telefòn' : 'Email'} *
                </label>
                <input
                  type={addRecipientForm.contactType === 'email' ? 'email' : 'text'}
                  value={addRecipientForm.contact}
                  onChange={(e) => {
                    if (addRecipientForm.contactType === 'phone') {
                      const formatted = formatPhoneNumber(e.target.value, addRecipientForm.country)
                      setAddRecipientForm({...addRecipientForm, contact: formatted})
                    } else {
                      setAddRecipientForm({...addRecipientForm, contact: e.target.value})
                    }
                  }}
                  placeholder={
                    addRecipientForm.contactType === 'phone' 
                      ? countries.find(c => c.code === addRecipientForm.country)?.example || '+509 1234 5678'
                      : 'email@example.com'
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
                {addRecipientForm.contactType === 'phone' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Format: {countries.find(c => c.code === addRecipientForm.country)?.format}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddRecipient(false)
                    setAddRecipientForm({ name: '', contact: '', contactType: 'phone', country: 'HT' })
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Anile
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Ajoute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PIN Confirmation Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Konfime Tranzaksyon</h3>
            
            {/* Transaction Summary */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Destinatè:</span>
                <span className="font-medium">{transferForm.recipientPhone}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Montan:</span>
                <span className="font-medium">{transferForm.amount} HTG</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Frè:</span>
                <span className="font-medium">{(parseFloat(transferForm.amount) * 0.01).toFixed(2)} HTG</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-900 font-semibold">Total:</span>
                <span className="font-bold text-primary-600">{(parseFloat(transferForm.amount) * 1.01).toFixed(2)} HTG</span>
              </div>
            </div>

            {/* PIN Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Antre PIN ou</label>
              <input
                type="password"
                value={transferForm.pin}
                onChange={(e) => setTransferForm({...transferForm, pin: e.target.value.replace(/\D/g, '')})}
                placeholder="••••"
                maxLength={6}
                className="w-full border rounded px-3 py-2 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-600"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">Antre PIN 4-6 chif ou</p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowPinModal(false)
                  setTransferForm({...transferForm, pin: ''})
                }}
                disabled={transferLoading}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 disabled:opacity-50"
              >
                Anile
              </button>
              <button
                onClick={confirmTransfer}
                disabled={transferLoading || !transferForm.pin}
                className="flex-1 bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {transferLoading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  'Konfime'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Setup Modal */}
      {showPinSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {pinStatus?.has_pin ? 'Chanje PIN' : 'Konfigire PIN'}
            </h3>
            
            <form onSubmit={handlePinSetup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {pinStatus?.has_pin ? 'Nouvo PIN' : 'Antre PIN'}
                </label>
                <input
                  type="password"
                  value={pinSetupForm.pin}
                  onChange={(e) => setPinSetupForm({...pinSetupForm, pin: e.target.value.replace(/\D/g, '')})}
                  placeholder="••••"
                  maxLength={6}
                  className="w-full border rounded px-3 py-2 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-600"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">4-6 chif</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Konfime PIN</label>
                <input
                  type="password"
                  value={pinSetupForm.confirmPin}
                  onChange={(e) => setPinSetupForm({...pinSetupForm, confirmPin: e.target.value.replace(/\D/g, '')})}
                  placeholder="••••"
                  maxLength={6}
                  className="w-full border rounded px-3 py-2 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-xs text-yellow-800">
                  ⚠️ Sonje PIN ou: Li yo bezwen pou tout tranzaksyon lajan yo
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinSetup(false)
                    setPinSetupForm({ pin: '', confirmPin: '' })
                  }}
                  disabled={pinSetupLoading}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 disabled:opacity-50"
                >
                  Anile
                </button>
                <button
                  type="submit"
                  disabled={pinSetupLoading || !pinSetupForm.pin || !pinSetupForm.confirmPin}
                  className="flex-1 bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {pinSetupLoading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    'Konfigire'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {show2FASetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Konfime 2FA</h3>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-800">
                  📱 Kòd konfimo 2FA ou an: <strong>{twoFACode}</strong>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Nan pwojè reyèl la, w ap jwenn kòd sa a nan email ou oswa nan aplikasyon Authenticator
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Antre Kòd 2FA</label>
                <input
                  type="text"
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full border rounded px-3 py-2 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-600"
                  autoFocus
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShow2FASetup(false)
                    setTwoFACode('')
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                >
                  Anile
                </button>
                <button
                  onClick={verify2FA}
                  disabled={!twoFACode}
                  className="flex-1 bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Verifye
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

          {/* Card Deposit Section */}
          {activeTab==='cards' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">💳 Depo ak Kat VISA/Mastercard</h2>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <form onSubmit={async (e) => {
                  e.preventDefault()
                  if (!cardForm.cardNumber || !cardForm.expiryMonth || !cardForm.expiryYear || !cardForm.cvv || !cardForm.amount) {
                    alert('Tanpri ranpli tout enfòmasyon yo')
                    return
                  }
                  
                  setCardLoading(true)
                  const token = localStorage.getItem('auth_token')
                  try {
                    const response = await fetch('http://127.0.0.1:8000/api/transactions/card-deposit/', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        card_number: cardForm.cardNumber.replace(/\s/g, ''),
                        expiry_month: cardForm.expiryMonth,
                        expiry_year: cardForm.expiryYear,
                        cvv: cardForm.cvv,
                        amount: cardForm.amount,
                        cardholder_name: cardForm.cardholderName
                      })
                    })
                    
                    if (response.ok) {
                      const result = await response.json()
                      alert(`✅ Depo ak siksè! Referans: ${result.reference_number}`)
                      setCardForm({ cardNumber: '', expiryMonth: '', expiryYear: '', cvv: '', amount: '', cardholderName: '' })
                      await refreshAll()
                    } else {
                      const error = await response.json()
                      alert(`❌ Erè: ${error.error || 'Depo a echwe'}`)
                    }
                  } catch (error) {
                    alert('❌ Erè nan koneksyon an')
                  } finally {
                    setCardLoading(false)
                  }
                }} className="space-y-4">
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Non sou Kat la</label>
                    <input
                      type="text"
                      value={cardForm.cardholderName}
                      onChange={(e) => setCardForm({...cardForm, cardholderName: e.target.value.toUpperCase()})}
                      placeholder="JAN MARI DUPONT"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nimewo Kat</label>
                    <input
                      type="text"
                      value={cardForm.cardNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ')
                        if (value.replace(/\s/g, '').length <= 16) {
                          setCardForm({...cardForm, cardNumber: value})
                        }
                      }}
                      placeholder="0000 0000 0000 0000"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mwa</label>
                      <select
                        value={cardForm.expiryMonth}
                        onChange={(e) => setCardForm({...cardForm, expiryMonth: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        required
                      >
                        <option value="">Mwa</option>
                        {Array.from({length: 12}, (_, i) => (
                          <option key={i+1} value={String(i+1).padStart(2, '0')}>{String(i+1).padStart(2, '0')}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ane</label>
                      <select
                        value={cardForm.expiryYear}
                        onChange={(e) => setCardForm({...cardForm, expiryYear: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        required
                      >
                        <option value="">Ane</option>
                        {Array.from({length: 10}, (_, i) => {
                          const year = new Date().getFullYear() + i
                          return <option key={year} value={String(year).slice(-2)}>{year}</option>
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                      <input
                        type="text"
                        value={cardForm.cvv}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '')
                          if (value.length <= 4) {
                            setCardForm({...cardForm, cvv: value})
                          }
                        }}
                        placeholder="123"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kantite pou Depo (HTG)</label>
                    <input
                      type="number"
                      value={cardForm.amount}
                      onChange={(e) => setCardForm({...cardForm, amount: e.target.value})}
                      placeholder="500"
                      min="100"
                      max="50000"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Depo minimòm: 100 HTG, Maksimòm: 50,000 HTG</p>
                  </div>

                  <button
                    type="submit"
                    disabled={cardLoading}
                    className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                  >
                    {cardLoading ? 'Ap pwosè...' : '💳 Depo Lajan'}
                  </button>
                </form>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">🛡️ Sekirite</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Nou aksepte kat VISA ak Mastercard sèlman</li>
                    <li>• Tout tranzaksyon yo kripte ak TLS 1.3</li>
                    <li>• Frè: 2.5% + 10 HTG sou chak depo</li>
                    <li>• Lajan an ap parèt nan kont ou nan 1-5 minit</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Merchant Payment Section */}
          {activeTab==='merchants' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🏪 Peye Machann</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">📱 Peye ak QR Code</h3>
                  <div className="space-y-4">
                    <button
                      onClick={() => setQrMode('scan')}
                      className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 font-medium"
                    >
                      📷 Skane QR Code Machann
                    </button>
                    
                    <div className="text-center text-gray-500">oswa</div>
                    
                    <input
                      type="text"
                      value={merchantForm.merchantCode}
                      onChange={(e) => setMerchantForm({...merchantForm, merchantCode: e.target.value})}
                      placeholder="Antre kòd machann (M123456)"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">📄 Peye Faktè Machann</h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault()
                    if (!merchantForm.merchantCode || !merchantForm.amount) {
                      alert('Tanpri antre kòd machann ak kantite')
                      return
                    }
                    
                    setMerchantLoading(true)
                    const token = localStorage.getItem('auth_token')
                    try {
                      const response = await fetch('http://127.0.0.1:8000/api/transactions/merchant-payment/', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Token ${token}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          merchant_code: merchantForm.merchantCode,
                          amount: merchantForm.amount,
                          description: merchantForm.description,
                          payment_type: merchantForm.paymentType
                        })
                      })
                      
                      if (response.ok) {
                        const result = await response.json()
                        alert(`✅ Peyman ak siksè! Referans: ${result.reference_number}`)
                        setMerchantForm({ merchantCode: '', amount: '', description: '', paymentType: 'qr' })
                        await refreshAll()
                      } else {
                        const error = await response.json()
                        alert(`❌ Erè: ${error.error || 'Peyman an echwe'}`)
                      }
                    } catch (error) {
                      alert('❌ Erè nan koneksyon an')
                    } finally {
                      setMerchantLoading(false)
                    }
                  }} className="space-y-4">
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kantite (HTG)</label>
                      <input
                        type="number"
                        value={merchantForm.amount}
                        onChange={(e) => setMerchantForm({...merchantForm, amount: e.target.value})}
                        placeholder="100"
                        min="10"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsyon (opsyonèl)</label>
                      <input
                        type="text"
                        value={merchantForm.description}
                        onChange={(e) => setMerchantForm({...merchantForm, description: e.target.value})}
                        placeholder="Achte nan magazen..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={merchantLoading}
                      className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                    >
                      {merchantLoading ? 'Ap pwosè...' : '💰 Peye Machann'}
                    </button>
                  </form>
                </div>
              </div>

              <div className="mt-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">🗺️ Machann yo Tou Pre</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: 'Supèmake Royal', code: 'M001234', distance: '0.2 km', category: 'Supèmake' },
                    { name: 'Pharmacy Plus', code: 'M005678', distance: '0.5 km', category: 'Famasi' },
                    { name: 'Restaurant Ti Kafe', code: 'M009876', distance: '0.8 km', category: 'Restoran' }
                  ].map((merchant, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-red-300 cursor-pointer"
                      onClick={() => setMerchantForm({...merchantForm, merchantCode: merchant.code})}>
                      <h4 className="font-medium text-gray-900">{merchant.name}</h4>
                      <p className="text-sm text-gray-600">{merchant.category}</p>
                      <p className="text-xs text-gray-500">📍 {merchant.distance} • {merchant.code}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Agent Cash Withdrawal Section */}
          {activeTab==='agents' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🏧 Retire Lajan nan Ajan</h2>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                <form onSubmit={(e) => {
                  e.preventDefault()
                  if (!agentForm.agentCode || !agentForm.amount) {
                    alert('Tanpri antre kòd ajan ak kantite')
                    return
                  }
                  setShowAgentPinModal(true)
                }} className="space-y-4">
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kòd Ajan</label>
                    <input
                      type="text"
                      value={agentForm.agentCode}
                      onChange={(e) => setAgentForm({...agentForm, agentCode: e.target.value.toUpperCase()})}
                      placeholder="A123456"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Jwenn kòd la sou resèpsyon biwo ajan an</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kantite pou Retire (HTG)</label>
                    <input
                      type="number"
                      value={agentForm.amount}
                      onChange={(e) => setAgentForm({...agentForm, amount: e.target.value})}
                      placeholder="500"
                      min="100"
                      max="25000"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Retire minimòm: 100 HTG, Maksimòm: 25,000 HTG chak jou</p>
                  </div>

                  <button
                    type="submit"
                    disabled={agentLoading}
                    className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                  >
                    🏧 Kontinye ak Retire
                  </button>
                </form>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">📍 Ajan yo Tou Pre</h3>
                <div className="space-y-4">
                  {[
                    { name: 'Ajan Delmas 33', code: 'A001234', address: 'Delmas 33, nan kwen Pharmacy Plus', hours: '8h00 - 18h00', distance: '0.3 km' },
                    { name: 'Ajan Pétion-Ville', code: 'A005678', address: 'Pétion-Ville, devan Supèmake Giant', hours: '7h00 - 19h00', distance: '1.2 km' },
                    { name: 'Ajan Tabarre', code: 'A009876', address: 'Tabarre 41, nan kwen estasyon Texaco', hours: '6h00 - 20h00', distance: '2.1 km' }
                  ].map((agent, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-red-300 cursor-pointer"
                      onClick={() => setAgentForm({...agentForm, agentCode: agent.code})}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{agent.name}</h4>
                          <p className="text-sm text-gray-600">{agent.address}</p>
                          <p className="text-xs text-gray-500">🕒 {agent.hours}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-red-600">{agent.distance}</p>
                          <p className="text-xs text-gray-500">{agent.code}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">⚠️ Enfòmasyon Enpòtan</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• W ap bezwen ID valide ak kòd ajan an</li>
                  <li>• Frè retire: 25 HTG sou chak tranzaksyon</li>
                  <li>• Maksimòm chak jou: 25,000 HTG</li>
                  <li>• Verifye è yo a ajan an avan w ale</li>
                </ul>
              </div>
            </div>
          )}

          {/* Agent PIN Modal */}
          {showAgentPinModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Antre PIN pou Retire</h3>
                <form onSubmit={async (e) => {
                  e.preventDefault()
                  if (!agentForm.pin) {
                    alert('Tanpri antre PIN ou')
                    return
                  }
                  
                  setAgentLoading(true)
                  const token = localStorage.getItem('auth_token')
                  try {
                    const response = await fetch('http://127.0.0.1:8000/api/transactions/agent-withdrawal/', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        agent_code: agentForm.agentCode,
                        amount: agentForm.amount,
                        pin: agentForm.pin
                      })
                    })
                    
                    if (response.ok) {
                      const result = await response.json()
                      alert(`✅ Retire otorize! Kòd konfimadyon: ${result.confirmation_code}\n\nMontre kòd sa a ak ID ou bay ajan an`)
                      setAgentForm({ agentCode: '', amount: '', pin: '' })
                      setShowAgentPinModal(false)
                      await refreshAll()
                    } else {
                      const error = await response.json()
                      alert(`❌ Erè: ${error.error || 'Retire a echwe'}`)
                    }
                  } catch (error) {
                    alert('❌ Erè nan koneksyon an')
                  } finally {
                    setAgentLoading(false)
                  }
                }} className="space-y-4">
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Ajan: <span className="font-medium">{agentForm.agentCode}</span></p>
                    <p className="text-sm text-gray-600">Kantite: <span className="font-medium">{agentForm.amount} HTG</span></p>
                  </div>

                  <input
                    type="password"
                    value={agentForm.pin}
                    onChange={(e) => setAgentForm({...agentForm, pin: e.target.value.replace(/\D/g, '')})}
                    placeholder="Antre PIN ou"
                    maxLength={6}
                    className="w-full p-3 border border-gray-300 rounded-lg text-center text-lg tracking-widest focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAgentPinModal(false)
                        setAgentForm({...agentForm, pin: ''})
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                    >
                      Anile
                    </button>
                    <button
                      type="submit"
                      disabled={agentLoading}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {agentLoading ? 'Ap pwosè...' : 'Konfime'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Transaction Details Modal */}
      {showTransactionDetails && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Detay Tranzaksyon</h3>
              <button 
                onClick={() => setShowTransactionDetails(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4 space-y-6">
              {/* Basic Transaction Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Enfòmasyon Jeneral</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Tip Tranzaksyon:</span>
                    <span className="ml-2 font-medium">{selectedTransaction.display_type || selectedTransaction.transaction_type}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Eta:</span>
                    <span className={`ml-2 font-medium ${selectedTransaction.status === 'completed' ? 'text-green-600' : selectedTransaction.status === 'failed' ? 'text-red-600' : 'text-yellow-600'}`}>
                      {selectedTransaction.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Dat ak Lè:</span>
                    <span className="ml-2 font-medium">{formatDateTime(selectedTransaction.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Referans:</span>
                    <span className="ml-2 font-medium font-mono text-xs">{selectedTransaction.transaction_reference}</span>
                  </div>
                </div>
              </div>

              {/* Amount Breakdown */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Detay Montan</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Montan Prensipal:</span>
                    <span className="font-medium">{(selectedTransaction.amount - (selectedTransaction.fees?.total_fees || 0)).toFixed(2)} HTG</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frè Sèvis:</span>
                    <span className="font-medium">{(selectedTransaction.fees?.service_fee || 0).toFixed(2)} HTG</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taks:</span>
                    <span className="font-medium">{(selectedTransaction.fees?.tax || 0).toFixed(2)} HTG</span>
                  </div>
                  <hr className="border-gray-300" />
                  <div className="flex justify-between font-semibold text-base">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-gray-900">{selectedTransaction.amount} HTG</span>
                  </div>
                </div>
              </div>

              {/* Sender/Receiver Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sender */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Ekspèditè</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Non:</span>
                      <span className="ml-2 font-medium">{selectedTransaction.sender_details?.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Telefòn:</span>
                      <span className="ml-2 font-medium">{selectedTransaction.sender_details?.phone}</span>
                    </div>
                    {selectedTransaction.sender_details?.account && selectedTransaction.sender_details.account !== 'N/A' && (
                      <div>
                        <span className="text-gray-600">Kont:</span>
                        <span className="ml-2 font-medium font-mono text-xs">{selectedTransaction.sender_details.account}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Receiver */}
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Resèvè</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Non:</span>
                      <span className="ml-2 font-medium">{selectedTransaction.receiver_details?.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Telefòn:</span>
                      <span className="ml-2 font-medium">{selectedTransaction.receiver_details?.phone}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Imèl:</span>
                      <span className="ml-2 font-medium">{selectedTransaction.receiver_details?.email || 'N/A'}</span>
                    </div>
                    {selectedTransaction.receiver_details?.account && selectedTransaction.receiver_details.account !== 'N/A' && (
                      <div>
                        <span className="text-gray-600">Kont:</span>
                        <span className="ml-2 font-medium font-mono text-xs">{selectedTransaction.receiver_details.account}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              {selectedTransaction.description && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Deskripsyon</h4>
                  <p className="text-sm text-gray-700">{selectedTransaction.description}</p>
                </div>
              )}

              {/* Confirmation Code */}
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <h4 className="font-semibold text-gray-900 mb-2">Kòd Konfìmasyon</h4>
                <p className="text-2xl font-mono font-bold text-purple-600">{selectedTransaction.confirmation_code}</p>
                <p className="text-xs text-gray-500 mt-1">Kenbe kòd sa a pou referans</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button 
                onClick={() => window.print()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Enprime
              </button>
              <button 
                onClick={() => setShowTransactionDetails(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700"
              >
                Fèmen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
