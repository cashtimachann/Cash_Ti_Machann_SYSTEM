'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUserCoreData, formatTimeAgo } from '../../utils/useUserCoreData'

// Function to format date and time
const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }
    return date.toLocaleDateString('fr-FR', options).replace(/\//g, '/') + ' ' + 
           date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false })
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
  const [recipientSearch, setRecipientSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  
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
  const [scannedData, setScannedData] = useState('')
  
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
          console.error('Error loading user language:', error)
        }
      }
    }
    
    loadUserLanguage()
  }, [userData])

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
  const searchRecipients = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([])
      return
    }
    setSearchLoading(true)
    const token = localStorage.getItem('auth_token')
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/auth/users/search/?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Token ${token}` }
      })
      if (response.ok) {
        const users = await response.json()
        setSearchResults(users.filter((u: any) => u.user_type === 'client' && u.id !== userData?.user?.id))
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!transferForm.recipientPhone || !transferForm.amount) {
      alert('Tanpri antre destinatè ak montan an')
      return
    }
    if (parseFloat(transferForm.amount) <= 0) {
      alert('Montan an dwe pi gwo pase 0')
      return
    }
    if (!userData?.wallet || parseFloat(transferForm.amount) > parseFloat(userData.wallet.balance)) {
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
          receiver_phone: transferForm.recipientPhone,
          amount: transferForm.amount,
          description: transferForm.description,
          pin: transferForm.pin
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`✅ Lajan voye ak siksè! Referans: ${result.reference_number}`)
        setTransferForm({ recipientPhone: '', amount: '', description: '', pin: '' })
        setShowPinModal(false)
        await refreshAll()
      } else {
        const error = await response.json()
        alert(`❌ Erè: ${error.error || 'Tranzaksyon an echwe'}`)
      }
    } catch (error) {
      alert('❌ Erè nan koneksyon an')
    } finally {
      setTransferLoading(false)
    }
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
        phone: transaction.receiver_phone || 'N/A',
        account: transaction.receiver_account || 'N/A'
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
        alert('✅ Kòd QR kreye!')
      } else {
        const error = await response.json()
        alert(`❌ Erè: ${error.error || 'Kòd QR pa kreye'}`)
      }
    } catch (error) {
      alert('❌ Erè nan koneksyon an')
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
      <header className="bg-dark-950 shadow-sm"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex justify-between items-center h-14 sm:h-16"><div className="flex items-center"><h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white"><span className="hidden sm:inline">Cash Ti </span><span className="text-primary-600"><span className="sm:hidden">CTM</span><span className="hidden sm:inline">Machann</span></span><span className="hidden md:inline"> - Kliyan</span></h1></div><div className="flex items-center space-x-2 sm:space-x-4"><div className="hidden md:block text-sm text-gray-300">Byenveni, <span className="font-medium text-white">{userData?.user?.first_name}</span></div><button onClick={handleLogout} className="bg-primary-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm hover:bg-primary-700 transition-colors"><span className="sm:hidden">Soti</span><span className="hidden sm:inline">Dekonekte</span></button></div></div></div></header>
      <div className="flex">
        <nav className="w-64 bg-white shadow-sm min-h-screen"><div className="p-4"><ul className="space-y-2">{['overview','transfer','qr','bills','wallet','transactions','topup','cards','merchants','agents','settings'].map(id => (<li key={id}><button onClick={()=>setActiveTab(id)} className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${activeTab===id?'bg-primary-600 text-white':'text-gray-700 hover:bg-gray-100'}`}>{id==='overview' && '📊 Apèsi Jeneral'}{id==='transfer' && '💸 Voye Lajan'}{id==='qr' && '📱 Kòd QR'}{id==='bills' && '📄 Peye Faktè'}{id==='wallet' && '💰 Wallet'}{id==='transactions' && '📋 Tranzaksyon'}{id==='topup' && '📞 Top Up'}{id==='cards' && '💳 Depo ak kat'}{id==='merchants' && '🏪 Peye machann'}{id==='agents' && '🏧 Retire nan ajan'}{id==='settings' && '⚙️ Paramèt'}</button></li>))}</ul></div></nav>
        <main className="flex-1 p-8">
          {activeTab==='overview' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Kliyan</h2>
              {verificationStatus && <div className="mb-4 flex items-center gap-3"><span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${verificationStatus==='verified'?'bg-green-100 text-green-700':verificationStatus==='rejected'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700'}`}>Verifikasyon: {verificationStatus}</span>{showRequestVerification && <button onClick={async ()=>{const ok=await requestVerification(); if(ok){alert('Demann voye'); refreshAll()} else {alert('Demann pa pase')}}} className="text-xs bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700">Mande Verifikasyon</button>}</div>}
              {userData?.wallet && <div className="mb-6 bg-white p-4 rounded-lg border shadow-sm flex items-center justify-between"><div><p className="text-sm text-gray-600">Balans Wallet</p><p className="text-2xl font-bold text-gray-900">{userData.wallet.balance} {userData.wallet.currency}</p></div><button onClick={refreshAll} className="text-xs bg-gray-100 px-3 py-1 rounded hover:bg-gray-200">Refresh</button></div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">{stats && <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"><p className="text-sm text-gray-600 mb-1">Tranzaksyon Mwa Sa a</p><p className="text-2xl font-bold text-gray-900">{stats.monthly_transactions}</p></div>}<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"><p className="text-sm text-gray-600 mb-1">Balans</p><p className="text-2xl font-bold text-gray-900">{stats?.balance || userData?.wallet?.balance} HTG</p></div></div>
              <div className="mt-10"><div className="flex items-center justify-between mb-3"><h3 className="text-lg font-semibold text-gray-900">Dènye Tranzaksyon</h3><button onClick={refreshAll} className="text-xs text-primary-600 hover:underline">Mizajou</button></div>{transactions.length===0?<p className="text-sm text-gray-500">Pa gen tranzaksyon pou kounye a.</p>:(<ul className="divide-y divide-gray-200 bg-white rounded-lg border">{transactions.slice(0,10).map(t=>(<li key={t.id} onClick={() => openTransactionDetails(t)} className="px-4 py-3 flex items-center justify-between text-sm hover:bg-gray-50 cursor-pointer transition-colors"><div><p className="font-medium text-gray-800">{t.display_type || t.transaction_type}</p><p className="text-xs text-gray-500">{formatDateTime(t.created_at)}</p></div><div className="text-right"><p className="font-semibold text-gray-900">{t.amount} HTG</p><p className="text-xs text-gray-500">{t.status}</p></div><div className="text-gray-400">›</div></li>))}</ul>)}</div>
            </div>
          )}
          {activeTab==='transfer' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Voye Lajan</h2>
              <div className="bg-white p-6 rounded-lg shadow-sm border max-w-md">
                <form onSubmit={handleTransferSubmit} className="space-y-4">
                  {/* Recipient Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destinatè</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={recipientSearch}
                        onChange={(e) => {
                          setRecipientSearch(e.target.value)
                          searchRecipients(e.target.value)
                        }}
                        placeholder="Antre non oswa nimewo telefòn"
                        className="w-full border rounded px-3 py-2 text-sm"
                      />
                      {searchLoading && (
                        <div className="absolute right-3 top-2">
                          <div className="animate-spin h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full"></div>
                        </div>
                      )}
                    </div>
                    
                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="mt-2 border rounded-md max-h-40 overflow-y-auto">
                        {searchResults.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => {
                              setTransferForm({...transferForm, recipientPhone: user.phone_number})
                              setRecipientSearch(`${user.first_name} ${user.last_name} (${user.phone_number})`)
                              setSearchResults([])
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                          >
                            <p className="font-medium text-sm">{user.first_name} {user.last_name}</p>
                            <p className="text-xs text-gray-500">{user.phone_number}</p>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Manual Phone Input */}
                    <div className="mt-2">
                      <input
                        type="text"
                        value={transferForm.recipientPhone}
                        onChange={(e) => setTransferForm({...transferForm, recipientPhone: e.target.value})}
                        placeholder="Oswa antre nimewo telefòn manuèlman"
                        className="w-full border rounded px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Montan (HTG)</label>
                    <input
                      type="number"
                      value={transferForm.amount}
                      onChange={(e) => setTransferForm({...transferForm, amount: e.target.value})}
                      placeholder="0.00"
                      min="1"
                      step="0.01"
                      className="w-full border rounded px-3 py-2 text-sm"
                      required
                    />
                    {transferForm.amount && (
                      <p className="text-xs text-gray-500 mt-1">
                        Frè: {(parseFloat(transferForm.amount) * 0.01).toFixed(2)} HTG | Total: {(parseFloat(transferForm.amount) * 1.01).toFixed(2)} HTG
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kòmantè (opsyonèl)</label>
                    <input
                      type="text"
                      value={transferForm.description}
                      onChange={(e) => setTransferForm({...transferForm, description: e.target.value})}
                      placeholder="Rezon pou tranzaksyon an"
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>

                  {/* Balance Check */}
                  {userData?.wallet && (
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <p>Balans aktyèl: <span className="font-semibold">{userData.wallet.balance} HTG</span></p>
                      {transferForm.amount && parseFloat(transferForm.amount) > parseFloat(userData.wallet.balance) && (
                        <p className="text-red-600 text-xs mt-1">⚠️ Ou pa gen ase lajan</p>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!transferForm.recipientPhone || !transferForm.amount || transferLoading}
                    className="w-full bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Kontinye ak PIN
                  </button>
                </form>
              </div>
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
                          <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-xs text-gray-500 break-all">
                            📱 QR Code<br/>
                            <small className="block mt-2 max-w-full overflow-hidden">
                              {qrCode.substring(0, 50)}...
                            </small>
                          </div>
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Done Kòd QR</label>
                      <textarea
                        value={scannedData}
                        onChange={(e) => setScannedData(e.target.value)}
                        placeholder="Kole done kòd QR isit la oswa sèvi ak kamera a"
                        className="w-full border rounded px-3 py-2 text-sm h-32"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Nan pwojè reyèl la, w ap gen yon kamera pou eskane kòd QR dirèkteman
                      </p>
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
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Tout Tranzaksyon</h2>
              {transactions.length===0 ? (
                <p className="text-sm text-gray-500">Pa gen tranzaksyon.</p>
              ) : (
                <div className="overflow-x-auto bg-white border rounded-lg">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Tip</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Montan</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Eta</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Dat ak Lè</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Aksyon</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transactions.map(t => (
                        <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2">{t.display_type || t.transaction_type}</td>
                          <td className="px-4 py-2">{t.amount} HTG</td>
                          <td className="px-4 py-2">{t.status}</td>
                          <td className="px-4 py-2">{formatDateTime(t.created_at)}</td>
                          <td className="px-4 py-2">
                            <button onClick={() => openTransactionDetails(t)} className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                              Wè Detay
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
                      {profilePhotoPreview ? (
                        <img src={profilePhotoPreview} alt="Profil" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl text-gray-500">👤</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{userData?.user?.first_name} {userData?.user?.last_name}</h4>
                      <p className="text-sm text-gray-500">{userData?.user?.email}</p>
                      <label className="mt-2 bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm cursor-pointer hover:bg-gray-200">
                        📷 Chanje Foto
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setProfilePhotoFile(file)
                              const reader = new FileReader()
                              reader.onload = (e) => setProfilePhotoPreview(e.target?.result as string)
                              reader.readAsDataURL(file)
                            }
                          }}
                        />
                      </label>
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
                              alert('✅ Foto profil chanje ak siksè!')
                              setProfilePhotoFile(null)
                              setProfilePhotoPreview('')
                              await refreshAll()
                            } else {
                              const error = await response.json()
                              alert(`❌ Erè: ${error.error || 'Foto pa chanje'}`)
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
                    <div>
                      <span className="text-gray-600">Kont:</span>
                      <span className="ml-2 font-medium font-mono text-xs">{selectedTransaction.sender_details?.account}</span>
                    </div>
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
                      <span className="text-gray-600">Kont:</span>
                      <span className="ml-2 font-medium font-mono text-xs">{selectedTransaction.receiver_details?.account}</span>
                    </div>
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
