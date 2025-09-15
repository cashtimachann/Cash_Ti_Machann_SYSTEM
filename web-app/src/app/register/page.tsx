'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { COUNTRY_CODES, CountryCode, formatPhoneNumber, validatePhoneNumber, ALLOWED_REGISTRATION_COUNTRIES } from '../../utils/countryCodes'

// Type definitions
interface FormData {
  firstName: string
  lastName: string
  username: string
  dateOfBirth: string
  countryCode: string
  areaCode: string
  phoneNumber: string
  email: string
  password: string
  confirmPassword: string
  address: string
  city: string
  residenceCountry: string
  idType: string
  idNumber: string
  idDocumentFront: File | null
  idDocumentBack: File | null
  agreeToTerms: boolean
}

interface FormErrors {
  firstName?: string
  lastName?: string
  username?: string
  dateOfBirth?: string
  phoneNumber?: string
  phoneSuggestion?: string
  email?: string
  emailSuggestion?: string
  password?: string
  confirmPassword?: string
  address?: string
  city?: string
  residenceCountry?: string
  idNumber?: string
  idDocument?: string
  agreeToTerms?: string
  submit?: string
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1) // Multi-step form
  const [formData, setFormData] = useState<FormData>({
    // Personal Information
    firstName: '',
    lastName: '',
  username: '',
    dateOfBirth: '',
    countryCode: 'HT', // Default to Haiti
    areaCode: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    
    // Address Information
    address: '',
    city: '',
  residenceCountry: 'HT',
    
    // Identity Document
    idType: 'national_id',
    idNumber: '',
    idDocumentFront: null,
    idDocumentBack: null,
    
    // Terms and conditions
    agreeToTerms: false
  })

  // Derive limited country list once (memo not strictly necessary here due to page scope)
  const allowedCountries = COUNTRY_CODES.filter(c => ALLOWED_REGISTRATION_COUNTRIES.includes(c.code as any))
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')

  // List of allowed residence countries (business rule) - reuse allowedCountries already derived

  // Live username availability check (debounced)
  useEffect(() => {
    const name = formData.username?.trim()
    if (!name) {
      setUsernameStatus('idle')
      return
    }
    setUsernameStatus('checking')
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/auth/check-username/?username=${encodeURIComponent(name)}`,
          { signal: controller.signal }
        )
        if (!res.ok) {
          setUsernameStatus('idle')
          return
        }
        const data = await res.json()
        if (data.available) {
          setUsernameStatus('available')
        } else {
          setUsernameStatus('taken')
        }
      } catch (e) {
        setUsernameStatus('idle')
      }
    }, 450)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [formData.username])

  const validateStep = (currentStep: number): boolean => {
    const newErrors: FormErrors = {}
    
    if (currentStep === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'Obligatwa'
      if (!formData.lastName.trim()) newErrors.lastName = 'Obligatwa'
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Obligatwa'
      
      // Enhanced phone number validation
      if (!formData.phoneNumber.trim()) {
        newErrors.phoneNumber = 'Obligatwa'
      } else {
        // For Haiti, no area code needed - use phoneNumber directly
        // For other countries, combine area code + phone number
  const selectedCountry = allowedCountries.find(c => c.code === formData.countryCode)
        let fullPhoneNumber
        
        if (formData.countryCode === 'HT') {
          fullPhoneNumber = formData.phoneNumber
        } else {
          fullPhoneNumber = `${formData.areaCode}${formData.phoneNumber}`
        }
        
        if (!validatePhoneNumber(formData.countryCode, fullPhoneNumber)) {
          switch (formData.countryCode) {
            case 'HT':
              newErrors.phoneNumber = 'Ayiti: 8 chif, kòmanse ak 2-5.'; break
            case 'US':
            case 'CA':
            case 'DO':
              newErrors.phoneNumber = 'Obligatwa 10 chif (area code + nimewo).'; break
            case 'FR':
              newErrors.phoneNumber = 'Frans: dwe 9 oswa 10 chif.'; break
            case 'CL':
              newErrors.phoneNumber = 'Chili: dwe 9 chif.'; break
            case 'BR':
              newErrors.phoneNumber = 'Brezil: dwe 10 oswa 11 chif.'; break
            case 'MX':
              newErrors.phoneNumber = 'Meksik: dwe 10 chif.'; break
            default:
              newErrors.phoneNumber = 'Nimewo telefòn pa valid.'
          }
        }
      }
      
      // Area code validation only for countries that require it (not Haiti)
  const selectedCountry = allowedCountries.find(c => c.code === formData.countryCode)
      if (selectedCountry?.areaCodes && formData.countryCode !== 'HT' && !formData.areaCode) {
        newErrors.phoneNumber = 'Chwazi kòd rejyon an'
      }
      
      if (!formData.email.trim()) newErrors.email = 'Obligatwa'
      if (formData.password.length < 8) newErrors.password = 'Minimòm 8 karaktè'
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Mo de pas yo pa menm'
      }
    }
    
    if (currentStep === 2) {
      if (!formData.address.trim()) newErrors.address = 'Obligatwa'
      if (!formData.city.trim()) newErrors.city = 'Obligatwa'
      if (!formData.residenceCountry) newErrors.residenceCountry = 'Obligatwa'
    }
    
    if (currentStep === 3) {
      if (!formData.idNumber.trim()) newErrors.idNumber = 'Obligatwa'
      if (!formData.agreeToTerms) newErrors.agreeToTerms = 'Ou dwe aksepte kondisyon yo ak règleman konfidansyalite a'
      // Require both sides for national ID
      if (formData.idType === 'national_id') {
        if (!formData.idDocumentFront) {
          newErrors.idDocument = 'Fas devan dokiman an obligatwa pou CIN.'
        } else if (!formData.idDocumentBack) {
          newErrors.idDocument = 'Fas dèyè dokiman an obligatwa pou CIN.'
        }
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handlePrevious = () => {
    setStep(step - 1)
    setErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validate all steps
    let allValid = true
    for (let i = 1; i <= 3; i++) {
      if (!validateStep(i)) {
        allValid = false
      }
    }
    
    if (!allValid) {
      return
    }

    setLoading(true)

    try {
      // Prepare data for submission with complete phone number
      const selectedCountry = COUNTRY_CODES.find(c => c.code === formData.countryCode)
      let completePhoneNumber
      
      if (formData.countryCode === 'HT') {
        // Haiti: +509 + 8-digit number (no area code)
        completePhoneNumber = `${selectedCountry?.dialCode}${formData.phoneNumber}`
      } else {
        // Other countries: dial code + area code + number
        completePhoneNumber = `${selectedCountry?.dialCode}${formData.areaCode}${formData.phoneNumber}`
      }
      
      // Use FormData for file upload
      const formDataToSend = new FormData()
      formDataToSend.append('email', formData.email)
      if (formData.username && formData.username.trim()) {
        formDataToSend.append('username', formData.username.trim())
      }
      formDataToSend.append('phone', completePhoneNumber)
      formDataToSend.append('first_name', formData.firstName)
      formDataToSend.append('last_name', formData.lastName)
      formDataToSend.append('date_of_birth', formData.dateOfBirth)
      formDataToSend.append('password', formData.password)
      formDataToSend.append('address', formData.address)
      formDataToSend.append('city', formData.city)
  formDataToSend.append('country', allowedCountries.find(c => c.code === formData.residenceCountry)?.name || 'Haiti')
      formDataToSend.append('id_document_type', formData.idType)
      formDataToSend.append('id_document_number', formData.idNumber)
      
      // Add document files if present
      if (formData.idDocumentFront) {
        formDataToSend.append('id_document_front', formData.idDocumentFront)
      }
      if (formData.idDocumentBack) {
        formDataToSend.append('id_document_back', formData.idDocumentBack)
      }

      const response = await fetch('http://127.0.0.1:8000/api/auth/register/', {
        method: 'POST',
        // Don't set Content-Type header - let browser set it with boundary for FormData
        body: formDataToSend,
      })

      let data: any = {}
      try {
        const responseText = await response.text()
        if (responseText.trim()) {
          data = JSON.parse(responseText)
        } else {
          setErrors({ submit: 'Sèvè a pa voye okenn enfòmasyon. Tanpri verifye koneksyon ou oswa kontakte sipò teknik.' })
          return
        }
      } catch (parseError) {
        console.error('Failed to parse response:', parseError)
        setErrors({ submit: 'Erè nan response lan. Tanpri esaye ankò.' })
        return
      }

      if (response.ok) {
        // Registration successful, redirect to email verification with email
        const emailParam = encodeURIComponent(formData.email)
        router.push(`/verify-email?email=${emailParam}`)
      } else {
        // Handle server errors
        console.error('Registration failed:', data)
        console.error('Status code:', response.status)
        
        if (response.status === 0 || response.status >= 500) {
          setErrors({ submit: 'Sèvè a pa reponn. Tanpri eseye ankò.' })
        } else if (data.email) {
          const emailError = Array.isArray(data.email) ? data.email[0] : data.email
          setErrors({ 
            email: emailError,
            emailSuggestion: emailError.includes('deja egziste') ? 'login' : null
          })
        } else if (data.phone) {
          const phoneError = Array.isArray(data.phone) ? data.phone[0] : data.phone
          setErrors({ 
            phoneNumber: phoneError,
            phoneSuggestion: phoneError.includes('deja egziste') ? 'login' : null
          })
        } else if (data.password) {
          setErrors({ password: Array.isArray(data.password) ? data.password[0] : data.password })
        } else if (data.error) {
          // Handle detailed error responses
          const errorMsg = data.error
          const suggestion = data.suggestion || ''
          const errorCode = data.error_code || ''
          
          if (errorCode === 'EMAIL_EXISTS') {
            setErrors({ 
              email: errorMsg,
              emailSuggestion: 'login'
            })
          } else if (errorCode === 'PHONE_EXISTS') {
            setErrors({ 
              phoneNumber: errorMsg,
              phoneSuggestion: 'login'
            })
          } else if (errorCode === 'USERNAME_EXISTS') {
            setErrors({
              username: errorMsg
            })
          } else {
            setErrors({ submit: `${errorMsg}${suggestion ? ` ${suggestion}` : ''}` })
          }
        } else if (data.detail) {
          setErrors({ submit: data.detail })
        } else {
          setErrors({ submit: `Erè nan kreye kont la (Status: ${response.status}). Tanpri verifye enfò yo ak eseye ankò.` })
        }
      }
    } catch (error) {
      console.error('Network or other error:', error)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setErrors({ submit: 'Pa ka konekte ak sèvè a. Verifye koneksyon entènèt ou ak eseye ankò.' })
      } else {
        setErrors({ submit: 'Erè inatandi nan sistèm nan. Tanpri esaye ankò.' })
      }
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleFileUploadFront = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, idDocument: 'Fichye devan twò gwo. Maks 5MB.' }))
        return
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, idDocument: 'Tip fichye devan pa aksepte.' }))
        return
      }
      
      updateFormData('idDocumentFront', file as any)
    }
  }
  const handleFileUploadBack = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, idDocument: 'Fichye dèyè twò gwo. Maks 5MB.' }))
        return
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, idDocument: 'Tip fichye dèyè pa aksepte.' }))
        return
      }
      
      updateFormData('idDocumentBack', file as any)
    }
  }
  // Legacy single file handler referenced by the hidden main upload input (kept for backward compatibility)
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, idDocument: 'Fichye a twò gwo. Maks 5MB.' }))
      return
    }
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, idDocument: 'Tip fichye pa aksepte.' }))
      return
    }
    // Prefer map legacy upload to front if empty; else to back; else ignore
    if (!formData.idDocumentFront) {
      updateFormData('idDocumentFront', file as any)
    } else if (!formData.idDocumentBack) {
      updateFormData('idDocumentBack', file as any)
    } else {
      // Both occupied — replace front by default
      updateFormData('idDocumentFront', file as any)
    }
  }

  const captureFromCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      })
      
      // Create video element to show camera feed
      const video = document.createElement('video')
      video.srcObject = stream
      video.play()
      
      setShowCamera(true)
      
      // You would implement the camera capture UI here
      // For now, just stop the stream
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop())
        setShowCamera(false)
      }, 5000)
      
    } catch (error) {
      setErrors(prev => ({ ...prev, idDocument: 'Pa ka aksede kamera a. Itilize upload fichye.' }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-primary-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Cash Ti <span className="text-primary-600">Machann</span>
          </h1>
          <h2 className="text-xl text-gray-300">Kreye Kont Kliyan</h2>
          <p className="text-sm text-gray-400 mt-2">
            Enskipsyon pou kliyan yo sèlman. Kont Ajan ak Antrepriz yo kreye pa administratè a.
          </p>
          
          {/* Progress indicator */}
          <div className="flex justify-center mt-4 space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i <= step ? 'bg-primary-600' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Etap {step} nan 3
          </p>
        </div>

        {/* Registration Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="bg-dark-800/50 backdrop-blur-sm p-8 rounded-xl border border-primary-600/20">
            
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white mb-4">Enfòmasyon Pèsonèl</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-1">
                      Prenon *
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      required
                      className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      placeholder="Prenon ou"
                      value={formData.firstName}
                      onChange={(e) => updateFormData('firstName', e.target.value)}
                    />
                    {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1">
                      Non *
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      required
                      className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      placeholder="Non ou"
                      value={formData.lastName}
                      onChange={(e) => updateFormData('lastName', e.target.value)}
                    />
                    {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                    Non Itilizatè (opsyonèl)
                  </label>
                  <input
                    id="username"
                    type="text"
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    placeholder="egzanp: jan_doe"
                    value={formData.username}
                    onChange={(e) => updateFormData('username', e.target.value)}
                  />
                  {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
                  {!errors.username && formData.username && (
                    usernameStatus === 'checking' ? (
                      <p className="text-xs text-gray-400 mt-1">Nap verifye disponiblite...</p>
                    ) : usernameStatus === 'available' ? (
                      <p className="text-xs text-green-400 mt-1">Non itilizatè disponib.</p>
                    ) : usernameStatus === 'taken' ? (
                      <p className="text-xs text-red-400 mt-1">Non itilizatè sa a deja egziste.</p>
                    ) : null
                  )}
                  <p className="text-xs text-gray-400 mt-1">Si ou pa ranpli li, n ap itilize pati avan email ou a.</p>
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-300 mb-1">
                    Dat Nesans *
                  </label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    required
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                  />
                  {errors.dateOfBirth && <p className="text-red-400 text-xs mt-1">{errors.dateOfBirth}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Nimewo Telefòn * 📞
                  </label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Country Selection */}
                    <div>
                      <label htmlFor="countryCode" className="block text-xs text-gray-400 mb-1">
                        Peyi
                      </label>
                      <select
                        id="countryCode"
                        className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                        value={formData.countryCode}
                        onChange={(e) => {
                          updateFormData('countryCode', e.target.value)
                          updateFormData('areaCode', '') // Reset area code when country changes
                        }}
                      >
                        {allowedCountries.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.flag} {country.nameKreol} ({country.dialCode})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Area Code Selection */}
                    {(() => {
                      const selectedCountry = allowedCountries.find(c => c.code === formData.countryCode)
                      return selectedCountry?.areaCodes ? (
                        <div>
                          <label htmlFor="areaCode" className="block text-xs text-gray-400 mb-1">
                            {formData.countryCode === 'HT' ? 'Kòd Rejyon' : 'Area Code'}
                          </label>
                          <select
                            id="areaCode"
                            className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                            value={formData.areaCode}
                            onChange={(e) => updateFormData('areaCode', e.target.value)}
                          >
                            <option value="">Chwazi...</option>
                            {selectedCountry.areaCodes.map((code) => (
                              <option key={code} value={code}>
                                {code}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : null
                    })()}

                    {/* Phone Number Input */}
                    <div className={(() => {
                      const selectedCountry = allowedCountries.find(c => c.code === formData.countryCode)
                      return selectedCountry?.areaCodes ? "md:col-span-1" : "md:col-span-2"
                    })()}>
                      <label htmlFor="phoneNumber" className="block text-xs text-gray-400 mb-1">
                        Nimewo
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-600 bg-dark-600 text-gray-300 text-sm">
                          {(() => {
                            const country = allowedCountries.find(c => c.code === formData.countryCode)
                            return `${country?.dialCode}${formData.areaCode ? ` ${formData.areaCode}` : ''}`
                          })()}
                        </span>
                        <input
                          id="phoneNumber"
                          type="tel"
                          required
                          className="flex-1 px-3 py-2 bg-dark-700 border border-gray-600 rounded-r-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                          placeholder={formData.countryCode === 'HT' ? '12345678' : '1234567'}
                          value={formData.phoneNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '') // Only numbers
                            updateFormData('phoneNumber', value)
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Phone Number Preview */}
                  {formData.phoneNumber && (
                    <div className="mt-2 p-2 bg-dark-600 rounded-md border border-gray-600">
                      <p className="text-xs text-gray-400">Nimewo konplè:</p>
                      <p className="text-sm text-white font-mono">
                        {(() => {
                          const country = allowedCountries.find(c => c.code === formData.countryCode)
                          let fullNumber
                          
                          if (formData.countryCode === 'HT') {
                            // Haiti: +509 + phone number (no area code)
                            fullNumber = `${country?.dialCode}${formData.phoneNumber}`
                          } else {
                            // Other countries: dial code + area code + phone number
                            fullNumber = `${country?.dialCode}${formData.areaCode}${formData.phoneNumber}`
                          }
                          
                          return formatPhoneNumber(formData.countryCode, fullNumber)
                        })()}
                      </p>
                    </div>
                  )}

                  {errors.phoneNumber && (
                    <div className="mt-1">
                      <p className="text-red-400 text-xs">{errors.phoneNumber}</p>
                      {errors.phoneSuggestion && (
                        <p className="text-yellow-400 text-xs mt-1">
                          {errors.phoneSuggestion}{' '}
                          <button
                            type="button"
                            onClick={() => router.push('/login')}
                            className="text-primary-500 hover:text-primary-400 underline font-medium"
                          >
                            Konekte nan kont la
                          </button>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                    Email *
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                  />
                  {errors.email && (
                    <div className="mt-1">
                      <p className="text-red-400 text-xs">{errors.email}</p>
                      {errors.emailSuggestion && (
                        <p className="text-yellow-400 text-xs mt-1">
                          {errors.emailSuggestion}{' '}
                          <button
                            type="button"
                            onClick={() => router.push('/login')}
                            className="text-primary-500 hover:text-primary-400 underline font-medium"
                          >
                            Konekte nan kont la
                          </button>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                    Mo de Pas *
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    placeholder="Minimòm 8 karaktè"
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                  />
                  {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                    Konfime Mo de Pas *
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    placeholder="Repete mo de pas la"
                    value={formData.confirmPassword}
                    onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                  />
                  {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            )}

            {/* Step 2: Address Information */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white mb-4">Enfòmasyon Adrès</h3>
                
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-1">
                    Adrès Konplè *
                  </label>
                  <textarea
                    id="address"
                    required
                    rows={3}
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    placeholder="Egzanp: 123 Rue Capois, Bò Hotel Montana"
                    value={formData.address}
                    onChange={(e) => updateFormData('address', e.target.value)}
                  />
                  {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-1">
                    Vil *
                  </label>
                  <input
                    id="city"
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    placeholder="Egzanp: Port-au-Prince"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                  />
                  {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label htmlFor="residenceCountry" className="block text-sm font-medium text-gray-300 mb-1">
                    Peyi Rezidans *
                  </label>
                  <select
                    id="residenceCountry"
                    required
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    value={formData.residenceCountry}
                    onChange={(e) => updateFormData('residenceCountry', e.target.value)}
                  >
                    {allowedCountries.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.nameKreol}</option>
                    ))}
                  </select>
                  {errors.residenceCountry && <p className="text-red-400 text-xs mt-1">{errors.residenceCountry}</p>}
                </div>
              </div>
            )}

            {/* Step 3: Identity and Confirmation */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white mb-4">Idantifikasyon ak Konfìmasyon</h3>
                
                <div>
                  <label htmlFor="idType" className="block text-sm font-medium text-gray-300 mb-1">
                    Tip Dokiman Idantite
                  </label>
                  <select
                    id="idType"
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    value={formData.idType}
                    onChange={(e) => updateFormData('idType', e.target.value)}
                  >
                    <option value="national_id">Kat Idantite Nasyonal (CIN)</option>
                    <option value="passport">Paspò</option>
                    <option value="drivers_license">Pèmi Kondwi</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="idNumber" className="block text-sm font-medium text-gray-300 mb-1">
                    Nimewo Dokiman *
                  </label>
                  <input
                    id="idNumber"
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    placeholder="Antre nimewo dokiman an"
                    value={formData.idNumber}
                    onChange={(e) => updateFormData('idNumber', e.target.value)}
                  />
                  {errors.idNumber && <p className="text-red-400 text-xs mt-1">{errors.idNumber}</p>}
                </div>

                {/* Document Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Upload Dokiman Idantifikasyon
                  </label>
                  
                  {/* Upload Options (Front / Back) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 border-2 border-dashed border-gray-600 rounded-lg bg-dark-700/50">
                      <label className="block text-xs font-medium text-gray-400 mb-2">Fas Devant *</label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileUploadFront}
                        className="w-full text-xs text-gray-300"
                      />
                      {formData.idDocumentFront && (
                        <p className="text-green-400 text-xs mt-2">✓ {formData.idDocumentFront.name}</p>
                      )}
                    </div>
                    <div className="p-4 border-2 border-dashed border-gray-600 rounded-lg bg-dark-700/50">
                      <label className="block text-xs font-medium text-gray-400 mb-2">Fas Dèyè *</label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileUploadBack}
                        className="w-full text-xs text-gray-300"
                      />
                      {formData.idDocumentBack && (
                        <p className="text-green-400 text-xs mt-2">✓ {formData.idDocumentBack.name}</p>
                      )}
                    </div>
                  </div>

                  {/* File Preview */}
                  {formData.idDocumentFront && (
                    <div className="bg-dark-700 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-white">{formData.idDocumentFront.name}</p>
                            <p className="text-xs text-gray-400">
                              {(formData.idDocumentFront.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateFormData('idDocumentFront', null)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {formData.idDocumentBack && (
                    <div className="bg-dark-700 p-4 rounded-lg mt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-white">{formData.idDocumentBack.name}</p>
                            <p className="text-xs text-gray-400">
                              {(formData.idDocumentBack.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateFormData('idDocumentBack', null)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Camera View (when active) */}
                  {showCamera && (
                    <div className="bg-dark-700 p-4 rounded-lg">
                      <div className="text-center">
                        <div className="w-full h-48 bg-dark-600 rounded-lg flex items-center justify-center mb-4">
                          <p className="text-gray-400">📷 Kamera View (Demo)</p>
                        </div>
                        <div className="space-x-4">
                          <button
                            type="button"
                            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                          >
                            Pran Foto
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowCamera(false)}
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                          >
                            Fèmen
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {errors.idDocument && <p className="text-red-400 text-xs mt-2">{errors.idDocument}</p>}
                  
                  <p className="text-xs text-gray-400 mt-2">
                    💡 Konsèy: Asire dokiman an klè ak tout enfòmasyon yo vizib
                  </p>
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-3 mt-6">
                  <div className="flex items-start space-x-3">
                    <input
                      id="agreeToTerms"
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-600 border-gray-600 rounded bg-dark-700 mt-1"
                      checked={formData.agreeToTerms}
                      onChange={(e) => updateFormData('agreeToTerms', e.target.checked)}
                    />
                    <label htmlFor="agreeToTerms" className="text-sm text-gray-300">
                      Mwen aksepte{' '}
                      <Link href="/terms" className="text-primary-600 hover:text-primary-500">
                        Kondisyon ak Règleman yo
                      </Link>
                      {' '}ak{' '}
                      <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
                        Règleman Konfidansyalite
                      </Link>
                    </label>
                  </div>
                  {errors.agreeToTerms && <p className="text-red-400 text-xs">{errors.agreeToTerms}</p>}
                </div>
              </div>
            )}

            {/* Submit Error Display */}
            {errors.submit && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-600/30 rounded-md">
                <p className="text-red-400 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                >
                  ← Retounen
                </button>
              ) : (
                <div></div>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors"
                >
                  Kontinye →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {loading ? 'Kreye...' : 'Kreye Kont'}
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-gray-300">
            Gen kont deja? {' '}
            <Link href="/login" className="text-primary-600 hover:text-primary-500 font-medium">
              Konekte
            </Link>
          </p>
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