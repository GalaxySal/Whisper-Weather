import { useState, useEffect, useCallback } from 'react'
import { useTauri } from './use-tauri'
import { listen } from '@tauri-apps/api/event'

type Theme = 'light' | 'dark' | 'system' | 'weather'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('system')
  const [isThemeReady, setIsThemeReady] = useState(false)
  const { saveSettings, loadSettings, getSystemTheme } = useTauri()

  // İlk yükleme - Tauri backend'den yükle
  const loadTheme = useCallback(async () => {
    try {
      const settings = await loadSettings()
      const savedTheme = settings.theme || 'system'
      setTheme(savedTheme)
      
      // Sistem teması ise önce al sonra uygula
      if (savedTheme === 'system') {
        const systemTheme = await getSystemTheme()
        applyTheme(systemTheme === 'dark' ? 'dark' : 'light')
      } else {
        applyTheme(savedTheme)
      }
      
      setIsThemeReady(true)
    } catch (error) {
      console.error('Error loading theme from Tauri:', error)
      setIsThemeReady(true)
    }
  }, [loadSettings, getSystemTheme])

  useEffect(() => {
    loadTheme()
  }, [loadTheme])

  const applyTheme = (themeValue: Theme) => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark', 'weather')
    root.classList.add(themeValue)
  }

  // Hava durumuna göre tema uygula
  const applyWeatherTheme = (weatherCondition: string, temperature: number) => {
    const root = window.document.documentElement
    
    // Önce mevcut weather class'larını temizle
    root.classList.remove(
      'weather-clear', 'weather-clouds', 'weather-rain', 'weather-snow', 
      'weather-thunderstorm', 'weather-drizzle', 'weather-mist', 
      'weather-fog', 'weather-haze', 'weather-hot', 'weather-cold'
    )
    
    // Hava durumuna göre class ekle
    const normalizedCondition = weatherCondition.toLowerCase()
    
    // Sıcaklığa göre sınıflandırma
    if (temperature >= 30) {
      root.classList.add('weather-hot')
    } else if (temperature <= 5) {
      root.classList.add('weather-cold')
    }
    
    // Hava durumuna göre sınıflandırma
    if (normalizedCondition.includes('clear') || normalizedCondition.includes('sunny') || normalizedCondition.includes('açık')) {
      root.classList.add('weather-clear')
    } else if (normalizedCondition.includes('cloud') || normalizedCondition.includes('bulut') || normalizedCondition.includes('kapalı') || normalizedCondition.includes('parçalı')) {
      root.classList.add('weather-clouds')
    } else if (normalizedCondition.includes('rain') || normalizedCondition.includes('yağmur') || normalizedCondition.includes('yağış') || normalizedCondition.includes('sağanak')) {
      root.classList.add('weather-rain')
    } else if (normalizedCondition.includes('snow') || normalizedCondition.includes('kar')) {
      root.classList.add('weather-snow')
    } else if (normalizedCondition.includes('thunderstorm') || normalizedCondition.includes('fırtına') || normalizedCondition.includes('gök gürültülü')) {
      root.classList.add('weather-thunderstorm')
    } else if (normalizedCondition.includes('drizzle') || normalizedCondition.includes('çiseley') || normalizedCondition.includes('çiseleme')) {
      root.classList.add('weather-drizzle')
    } else if (normalizedCondition.includes('mist') || normalizedCondition.includes('sis') || normalizedCondition.includes('sisli')) {
      root.classList.add('weather-mist')
    } else if (normalizedCondition.includes('fog') || normalizedCondition.includes('pus') || normalizedCondition.includes('puslu')) {
      root.classList.add('weather-fog')
    } else if (normalizedCondition.includes('haze') || normalizedCondition.includes('duman')) {
      root.classList.add('weather-haze')
    } else {
      // Bilinmeyen durum için varsayılan
      root.classList.add('weather-clouds')
    }
  }

  // Tema değiştiğinde Tauri backend'e kaydet
  const changeTheme = async (newTheme: Theme) => {
    setTheme(newTheme)
    
    if (newTheme === 'system') {
      const systemTheme = await getSystemTheme()
      applyTheme(systemTheme === 'dark' ? 'dark' : 'light')
    } else {
      applyTheme(newTheme)
    }
    
    try {
      const settings = await loadSettings()
      await saveSettings(settings.language || 'tr', newTheme)
    } catch (error) {
      console.error('Error saving theme to Tauri:', error)
    }
  }

  // Sistem teması değişikliklerini dinle
  useEffect(() => {
    let unlisten: (() => void) | null = null;
    
    const setupListener = async () => {
      try {
        unlisten = await listen<string>('system-theme-changed', (event) => {
          const newSystemTheme = event.payload
          if (theme === 'system') {
            applyTheme(newSystemTheme === 'dark' ? 'dark' : 'light')
          }
        })
      } catch (error) {
        console.warn('Failed to setup system theme listener:', error)
      }
    }
    
    setupListener()
    
    return () => {
      if (unlisten) {
        try {
          unlisten()
        } catch (error) {
          console.warn('Failed to cleanup system theme listener:', error)
        }
      }
    }
  }, [theme])

  return { theme, setTheme: changeTheme, isThemeReady, applyWeatherTheme }
}
