import { useState, useEffect, useCallback } from 'react'

interface UserPreferences {
  viewMode: 'table' | 'cards'
  density: 'regular' | 'compact'
  sortBy: string
  sortDir: 'asc' | 'desc'
  itemsPerPage: number
}

const DEFAULT_PREFERENCES: UserPreferences = {
  viewMode: 'table',
  density: 'regular',
  sortBy: 'date',
  sortDir: 'desc',
  itemsPerPage: 10
}

const STORAGE_KEY = 'admin_user_preferences'

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed })
      }
    } catch (error) {
      console.warn('Failed to load user preferences:', error)
    }
    setIsLoaded(true)
  }, [])

  // Save preferences to localStorage when they change
  const savePreferences = useCallback((newPreferences: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPreferences }
    setPreferences(updated)
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (error) {
      console.warn('Failed to save user preferences:', error)
    }
  }, [preferences])

  const updateViewMode = useCallback((viewMode: 'table' | 'cards') => {
    savePreferences({ viewMode })
  }, [savePreferences])

  const updateDensity = useCallback((density: 'regular' | 'compact') => {
    savePreferences({ density })
  }, [savePreferences])

  const updateSort = useCallback((sortBy: string, sortDir?: 'asc' | 'desc') => {
    savePreferences({ 
      sortBy, 
      ...(sortDir && { sortDir }) 
    })
  }, [savePreferences])

  const updateSortDir = useCallback((sortDir: 'asc' | 'desc') => {
    savePreferences({ sortDir })
  }, [savePreferences])

  const updateItemsPerPage = useCallback((itemsPerPage: number) => {
    savePreferences({ itemsPerPage })
  }, [savePreferences])

  return {
    preferences,
    isLoaded,
    updateViewMode,
    updateDensity,
    updateSort,
    updateSortDir,
    updateItemsPerPage
  }
}