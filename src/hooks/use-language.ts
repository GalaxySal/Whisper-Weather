import { useState, useEffect, useCallback } from 'react'
import { useTauri } from './use-tauri'

type Language = 'tr' | 'en'

export function useLanguage() {
  const [language, setLanguage] = useState<Language>('tr')
  const { saveSettings, loadSettings } = useTauri()

  const loadLanguage = useCallback(async () => {
    try {
      const settings = await loadSettings()
      setLanguage(settings.language || 'tr')
    } catch (error) {
      console.error('Error loading language:', error)
    }
  }, [loadSettings])

  useEffect(() => {
    loadLanguage()
  }, [loadLanguage])

  const changeLanguage = async (newLanguage: Language) => {
    setLanguage(newLanguage)
    try {
      const settings = await loadSettings()
      await saveSettings(newLanguage, settings.theme || 'system')
    } catch (error) {
      console.error('Error saving language:', error)
    }
  }

  return { language, setLanguage: changeLanguage }
}
