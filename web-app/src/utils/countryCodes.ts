// Country codes and area codes data
export interface CountryCode {
  code: string
  name: string
  nameKreol: string
  dialCode: string
  flag: string
  areaCodes?: string[]
}

export const COUNTRY_CODES: CountryCode[] = [
  // Haiti - Primary country
  {
    code: 'HT',
    name: 'Haiti',
    nameKreol: 'Ayiti',
    dialCode: '+509',
    flag: '🇭🇹'
    // No area codes - Haiti uses 8-digit numbers directly after +509
  },
  
  // Caribbean Countries
  {
    code: 'DO',
    name: 'Dominican Republic',
    nameKreol: 'Repiblik Dominikèn',
    dialCode: '+1',
    flag: '🇩🇴',
    areaCodes: ['809', '829', '849']
  },
  {
    code: 'JM',
    name: 'Jamaica',
    nameKreol: 'Jamayik',
    dialCode: '+1',
    flag: '🇯🇲',
    areaCodes: ['876', '658']
  },
  {
    code: 'CU',
    name: 'Cuba',
    nameKreol: 'Kiba',
    dialCode: '+53',
    flag: '🇨🇺'
  },
  {
    code: 'PR',
    name: 'Puerto Rico',
    nameKreol: 'Pòto Riko',
    dialCode: '+1',
    flag: '🇵🇷',
    areaCodes: ['787', '939']
  },
  {
    code: 'TT',
    name: 'Trinidad and Tobago',
    nameKreol: 'Trinidad ak Tobago',
    dialCode: '+1',
    flag: '🇹🇹',
    areaCodes: ['868']
  },
  {
    code: 'BB',
    name: 'Barbados',
    nameKreol: 'Barbad',
    dialCode: '+1',
    flag: '🇧🇧',
    areaCodes: ['246']
  },
  {
    code: 'GD',
    name: 'Grenada',
    nameKreol: 'Grenad',
    dialCode: '+1',
    flag: '🇬🇩',
    areaCodes: ['473']
  },
  
  // North America
  {
    code: 'US',
    name: 'United States',
    nameKreol: 'Etazini',
    dialCode: '+1',
    flag: '🇺🇸',
    areaCodes: [
      '212', '646', '332', '917', // New York
      '305', '786', '645', // Miami (Large Haitian community)
      '954', '754', // Fort Lauderdale
      '561', '728', // West Palm Beach
      '407', '321', '689', // Orlando
  '617', '857', '351', // Boston
      '202', '771', // Washington DC
      '404', '678', '470', '943', // Atlanta
      '312', '773', '872', // Chicago
      '713', '281', '832', '346', // Houston
      '214', '469', '972', '945', // Dallas
      '323', '213', '310', '424', '747', '818', // Los Angeles
      '718', '347', '929', // Brooklyn/Queens
      '631', '934', // Long Island
      '504', '985', // New Orleans
      '301', '240', // Maryland
      '571', '703', // Virginia
      '215', '267', '445', // Philadelphia
      '860', '959', // Connecticut
  '508', '774', // (Removed duplicate 351 - already listed for Boston above)
    ]
  },
  {
    code: 'CA',
    name: 'Canada',
    nameKreol: 'Kanada',
    dialCode: '+1',
    flag: '🇨🇦',
    areaCodes: [
      '514', '438', '263', // Montreal (Large Haitian community)
      '416', '647', '437', '365', // Toronto
      '604', '778', '236', // Vancouver
      '403', '587', '825', // Calgary
      '613', '343', // Ottawa
      '902', '782', // Halifax
    ]
  },
  
  // Europe
  {
    code: 'FR',
    name: 'France',
    nameKreol: 'Frans',
    dialCode: '+33',
    flag: '🇫🇷'
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    nameKreol: 'Wayòm Ini',
    dialCode: '+44',
    flag: '🇬🇧'
  },
  {
    code: 'DE',
    name: 'Germany',
    nameKreol: 'Almay',
    dialCode: '+49',
    flag: '🇩🇪'
  },
  {
    code: 'ES',
    name: 'Spain',
    nameKreol: 'Panyòl',
    dialCode: '+34',
    flag: '🇪🇸'
  },
  {
    code: 'IT',
    name: 'Italy',
    nameKreol: 'Itali',
    dialCode: '+39',
    flag: '🇮🇹'
  },
  
  // South America
  {
    code: 'BR',
    name: 'Brazil',
    nameKreol: 'Brezil',
    dialCode: '+55',
    flag: '🇧🇷'
  },
  {
    code: 'AR',
    name: 'Argentina',
    nameKreol: 'Ajantin',
    dialCode: '+54',
    flag: '🇦🇷'
  },
  {
    code: 'CL',
    name: 'Chile',
    nameKreol: 'Chili',
    dialCode: '+56',
    flag: '🇨🇱'
  },
  {
    code: 'CO',
    name: 'Colombia',
    nameKreol: 'Kolombi',
    dialCode: '+57',
    flag: '🇨🇴'
  },
  {
    code: 'VE',
    name: 'Venezuela',
    nameKreol: 'Venezwela',
    dialCode: '+58',
    flag: '🇻🇪'
  },
  {
    code: 'GF',
    name: 'French Guiana',
    nameKreol: 'Giyàn Franse',
    dialCode: '+594',
    flag: '🇬🇫'
  }
]

// Subset of countries allowed for registration (business rule)
// Haiti (HT), United States (US), Canada (CA), Chile (CL), France (FR), Dominican Republic (DO), Brazil (BR), Mexico (MX)
export const ALLOWED_REGISTRATION_COUNTRIES = ['HT','US','CA','CL','FR','DO','BR','MX'] as const
export type AllowedRegistrationCountry = typeof ALLOWED_REGISTRATION_COUNTRIES[number]

// Defensive: ensure no duplicate area codes to avoid React key collisions
COUNTRY_CODES.forEach(c => {
  if (c.areaCodes && c.areaCodes.length) {
    const seen = new Set<string>()
    c.areaCodes = c.areaCodes.filter(code => {
      if (seen.has(code)) return false
      seen.add(code)
      return true
    })
  }
})

// Haiti specific mobile carrier prefixes
export const HAITI_MOBILE_PREFIXES = {
  digicel: ['3', '34', '36', '37', '38'],
  natcom: ['4', '41', '42', '43', '44', '45', '46', '47', '48', '49']
}

// Helper function to format phone number based on country
export const formatPhoneNumber = (countryCode: string, fullNumber: string): string => {
  // Remove all non-digits for processing
  const digits = fullNumber.replace(/\D/g, '')
  
  if (countryCode === 'HT') {
    // Haiti format: +509 XXXX-XXXX
    if (digits.startsWith('509')) {
      const phoneNumber = digits.substring(3) // Remove 509
      if (phoneNumber.length === 8) {
        return `+509 ${phoneNumber.substring(0, 4)}-${phoneNumber.substring(4)}`
      }
    }
    // If just 8 digits provided
    if (digits.length === 8) {
      return `+509 ${digits.substring(0, 4)}-${digits.substring(4)}`
    }
    return fullNumber
  } else if (countryCode === 'US' || countryCode === 'CA') {
    // North America format: +1 (XXX) XXX-XXXX
    if (digits.startsWith('1') && digits.length === 11) {
      const areaCode = digits.substring(1, 4)
      const exchange = digits.substring(4, 7)
      const number = digits.substring(7, 11)
      return `+1 (${areaCode}) ${exchange}-${number}`
    }
    return fullNumber
  }
  // Default format - just add spaces for readability
  return fullNumber
}

// Helper function to validate phone number
export const validatePhoneNumber = (countryCode: string, number: string): boolean => {
  // Strip non-digits early
  const digits = number.replace(/\D/g, '')
  if (countryCode === 'HT') {
    // Haiti: 8 digits, starts with 2, 3, 4, or 5
    return /^[2-5]\d{7}$/.test(digits)
  } else if (countryCode === 'US' || countryCode === 'CA') {
    // North America: 10 digits
    return /^\d{10}$/.test(digits)
  } else if (countryCode === 'DO') {
    // Dominican Republic (NANP as well): 10 digits
    return /^\d{10}$/.test(digits)
  } else if (countryCode === 'FR') {
    // France: usually 9 digits after leading 0 when formatted domestically; internationally it's 9 digits after +33
    // Accept 9 or 10 digits (some users may include leading 0). We'll allow 9-10 for flexibility.
    return /^\d{9,10}$/.test(digits)
  } else if (countryCode === 'CL') {
    // Chile: mobile numbers commonly 9 digits
    return /^\d{9}$/.test(digits)
  } else if (countryCode === 'BR') {
    // Brazil: 10 or 11 digits (including area code + number, mobile 11)
    return /^\d{10,11}$/.test(digits)
  } else if (countryCode === 'MX') {
    // Mexico: 10 digits (area code + number)
    return /^\d{10}$/.test(digits)
  }
  // Basic validation for other countries
  return digits.length >= 7
}
