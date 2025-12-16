import { useState, useEffect, useCallback } from 'react'
import { useTauri } from './use-tauri'

type Language = 'tr' | 'en'

export function useLanguage() {
  const [language, setLanguage] = useState<Language>('tr')
  const { saveSettings, loadSettings } = useTauri()

  // İlk yükleme - Tauri backend'den yükle
  const loadLanguage = useCallback(async () => {
    try {
      const settings = await loadSettings()
      setLanguage(settings.language || 'tr')
    } catch (error) {
      console.error('Error loading language from Tauri:', error)
    }
  }, [loadSettings])

  useEffect(() => {
    loadLanguage()
  }, [loadLanguage])

  // Dil değiştiğinde Tauri backend'e kaydet
  const changeLanguage = async (newLanguage: Language) => {
    setLanguage(newLanguage)
    
    try {
      const settings = await loadSettings()
      await saveSettings(newLanguage, settings.theme || 'light')
    } catch (error) {
      console.error('Error saving language to Tauri:', error)
    }
  }

  return { language, setLanguage: changeLanguage }
}
