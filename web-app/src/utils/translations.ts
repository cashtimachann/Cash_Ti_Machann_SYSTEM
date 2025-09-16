// Translation dictionary for Cash Ti Machann
export const translations = {
  kreyol: {
    // Navigation
    'dashboard': 'Dashboard',
    'overview': 'Apèsi Jeneral',
    'transfer': 'Voye Lajan',
    'qr': 'Kòd QR',
    'bills': 'Peye Faktè',
    'wallet': 'Wallet',
    'transactions': 'Tranzaksyon',
    'topup': 'Top Up',
    'cards': 'Depo ak kat',
    'merchants': 'Peye machann',
    'agents': 'Retire nan ajan',
    'settings': 'Paramèt',
    
    // Common
    'welcome': 'Byenveni',
    'loading': 'Ap chaje...',
    'success': 'Siksè',
    'error': 'Erè',
    'confirm': 'Konfime',
    'cancel': 'Anile',
    'save': 'Anrejistre',
    'logout': 'Dekonekte',
    
    // Profile
    'profile_management': 'Jesyon Profil',
    'change_photo': 'Chanje Foto',
    'change_email': 'Chanje Email',
    'change_phone': 'Chanje Telefòn',
    'change_password': 'Chanje Modpas',
    
    // Language
    'language_settings': 'Paramèt Lang',
    'choose_language': 'Chwazi Lang ou',
    'selected_language': 'Lang ki chwazi a',
    'save_language': 'Anrejistre Lang'
  },
  
  french: {
    // Navigation
    'dashboard': 'Tableau de bord',
    'overview': 'Aperçu général',
    'transfer': 'Envoyer argent',
    'qr': 'Code QR',
    'bills': 'Payer factures',
    'wallet': 'Portefeuille',
    'transactions': 'Transactions',
    'topup': 'Recharge',
    'cards': 'Dépôt carte',
    'merchants': 'Payer marchand',
    'agents': 'Retrait agent',
    'settings': 'Paramètres',
    
    // Common
    'welcome': 'Bienvenue',
    'loading': 'Chargement...',
    'success': 'Succès',
    'error': 'Erreur',
    'confirm': 'Confirmer',
    'cancel': 'Annuler',
    'save': 'Enregistrer',
    'logout': 'Déconnexion',
    
    // Profile
    'profile_management': 'Gestion du profil',
    'change_photo': 'Changer photo',
    'change_email': 'Changer email',
    'change_phone': 'Changer téléphone',
    'change_password': 'Changer mot de passe',
    
    // Language
    'language_settings': 'Paramètres de langue',
    'choose_language': 'Choisissez votre langue',
    'selected_language': 'Langue sélectionnée',
    'save_language': 'Enregistrer langue'
  },
  
  english: {
    // Navigation
    'dashboard': 'Dashboard',
    'overview': 'Overview',
    'transfer': 'Send Money',
    'qr': 'QR Code',
    'bills': 'Pay Bills',
    'wallet': 'Wallet',
    'transactions': 'Transactions',
    'topup': 'Top Up',
    'cards': 'Card Deposit',
    'merchants': 'Pay Merchant',
    'agents': 'Agent Withdrawal',
    'settings': 'Settings',
    
    // Common
    'welcome': 'Welcome',
    'loading': 'Loading...',
    'success': 'Success',
    'error': 'Error',
    'confirm': 'Confirm',
    'cancel': 'Cancel',
    'save': 'Save',
    'logout': 'Logout',
    
    // Profile
    'profile_management': 'Profile Management',
    'change_photo': 'Change Photo',
    'change_email': 'Change Email',
    'change_phone': 'Change Phone',
    'change_password': 'Change Password',
    
    // Language
    'language_settings': 'Language Settings',
    'choose_language': 'Choose your language',
    'selected_language': 'Selected language',
    'save_language': 'Save Language'
  },
  
  spanish: {
    // Navigation
    'dashboard': 'Panel de control',
    'overview': 'Resumen general',
    'transfer': 'Enviar dinero',
    'qr': 'Código QR',
    'bills': 'Pagar facturas',
    'wallet': 'Billetera',
    'transactions': 'Transacciones',
    'topup': 'Recarga',
    'cards': 'Depósito tarjeta',
    'merchants': 'Pagar comerciante',
    'agents': 'Retiro agente',
    'settings': 'Configuración',
    
    // Common
    'welcome': 'Bienvenido',
    'loading': 'Cargando...',
    'success': 'Éxito',
    'error': 'Error',
    'confirm': 'Confirmar',
    'cancel': 'Cancelar',
    'save': 'Guardar',
    'logout': 'Cerrar sesión',
    
    // Profile
    'profile_management': 'Gestión de perfil',
    'change_photo': 'Cambiar foto',
    'change_email': 'Cambiar email',
    'change_phone': 'Cambiar teléfono',
    'change_password': 'Cambiar contraseña',
    
    // Language
    'language_settings': 'Configuración de idioma',
    'choose_language': 'Elige tu idioma',
    'selected_language': 'Idioma seleccionado',
    'save_language': 'Guardar idioma'
  }
}

export type LanguageCode = 'kreyol' | 'french' | 'english' | 'spanish'
export type TranslationKey = keyof typeof translations.kreyol

// Hook for translation
export const useTranslation = (language: LanguageCode = 'kreyol') => {
  const t = (key: TranslationKey): string => {
    return translations[language]?.[key] || translations.kreyol[key] || key
  }
  
  return { t }
}

// Get language flag
export const getLanguageFlag = (language: LanguageCode): string => {
  const flags = {
    kreyol: '🇭🇹',
    french: '🇫🇷', 
    english: '🇺🇸',
    spanish: '🇪🇸'
  }
  return flags[language] || '🇭🇹'
}

// Get language display name
export const getLanguageDisplayName = (language: LanguageCode): string => {
  const names = {
    kreyol: 'Kreyòl Ayisyen',
    french: 'Français',
    english: 'English',
    spanish: 'Español'
  }
  return names[language] || 'Kreyòl Ayisyen'
}