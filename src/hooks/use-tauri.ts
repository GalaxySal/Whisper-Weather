import { invoke } from '@tauri-apps/api/core'
import { searchCitiesWeb } from '../lib/api'

// Tauri'nin mevcut olup olmadığını kontrol et
const isTauri = () => {
  return typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined
}

export function useTauri() {
  // Web fallback için localStorage
  const loadSettings = async () => {
    if (isTauri()) {
      return await invoke('load_settings')
    } else {
      const stored = localStorage.getItem('whisper-weather-settings')
      if (stored) {
        return JSON.parse(stored)
      }
      return { language: 'tr', theme: 'system' }
    }
  }

  const saveSettings = async (language: string, theme: string) => {
    if (isTauri()) {
      return await invoke('save_settings', { language, theme })
    } else {
      const settings = { language, theme }
      localStorage.setItem('whisper-weather-settings', JSON.stringify(settings))
    }
  }

  const loadFavoriteCities = async () => {
    if (isTauri()) {
      try {
        console.log('Loading favorite cities from Tauri...')
        const result = await invoke('load_favorite_cities')
        console.log('Tauri result:', result, typeof result)
        
        // Handle empty string or invalid JSON
        if (!result || result === '') {
          console.log('Empty result, returning []')
          return []
        }
        
        // If result is already an array, return it
        if (Array.isArray(result)) {
          console.log('Result is array:', result)
          return result
        }
        
        // If result is a string, try to parse it
        if (typeof result === 'string') {
          console.log('Parsing string result:', result)
          return JSON.parse(result)
        }
        
        // Fallback
        console.log('Unknown result type, returning []')
        return []
      } catch (error) {
        console.error('Error loading favorite cities from Tauri:', error)
        return []
      }
    } else {
      const stored = localStorage.getItem('whisper-weather-favorites')
      return stored ? JSON.parse(stored) : []
    }
  }

  const saveFavoriteCities = async (cities: string[]) => {
    if (isTauri()) {
      return await invoke('save_favorite_cities', { cities })
    } else {
      localStorage.setItem('whisper-weather-favorites', JSON.stringify(cities))
    }
  }

  const getSystemInfo = async () => {
    if (isTauri()) {
      try {
        return await invoke('get_system_info')
      } catch (error) {
        console.error('Tauri getSystemInfo error:', error)
        return null
      }
    } else {
      // Web için sistem bilgileri - Tauri formatıyla uyumlu
      return {
        platform: 'web',
        desktop: 'browser',
        kernel: navigator.userAgent.split(' ').pop() || 'unknown',
        locale: navigator.language || 'en-US',
        theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
        arch: 'x86_64', // Web için varsayılan
        online: navigator.onLine
      }
    }
  }

  const openWeatherUrl = async (city: string) => {
    if (isTauri()) {
      return await invoke('open_weather_url', { city })
    } else {
      window.open(`https://weather.com/search?q=${encodeURIComponent(city)}`, '_blank')
    }
  }

  const showNotification = async (title: string, body: string) => {
    if (isTauri()) {
      try {
        await invoke('show_notification', { title, body })
        return true
      } catch (error) {
        console.error('Notification error:', error)
        return false
      }
    } else {
      // Web için browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body })
        return true
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, { body })
          }
        })
      }
      return false
    }
  }

  const getSystemTheme = async () => {
    if (isTauri()) {
      try {
        const theme = await invoke<string>('get_system_theme')
        return theme
      } catch (error) {
        console.error('System theme error:', error)
        return 'light'
      }
    } else {
      // Web için browser media query
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
  }

  const searchCities = async (query: string) => {
    if (isTauri()) {
      try {
        console.log('Tauri: Calling searchCities with query:', query)
        const result = await invoke('search_cities', { query })
        console.log('Tauri: searchCities result:', result)
        return result
      } catch (error) {
        console.error('Tauri searchCities error:', error)
        // Fallback: Türkiye şehirleri
        const turkishCities = [
          "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin",
          "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur",
          "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan",
          "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul",
          "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir",
          "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş",
          "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Şanlıurfa", "Siirt", "Sinop",
          "Sivas", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat",
          "Zonguldak"
        ].filter(city => 
          city.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10)
        console.log('Tauri: Using fallback cities:', turkishCities)
        return turkishCities
      }
    } else {
      // Web için web API çağrısı
      try {
        console.log('Web: Calling searchCitiesWeb with query:', query)
        const result = await searchCitiesWeb(query)
        console.log('Web: searchCitiesWeb result:', result)
        return result
      } catch (error) {
        console.error('Web searchCitiesWeb error:', error)
        // Fallback: Türkiye şehirleri
        const turkishCities = [
          "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin",
          "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur",
          "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan",
          "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul",
          "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir",
          "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş",
          "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Şanlıurfa", "Siirt", "Sinop",
          "Sivas", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat",
          "Zonguldak"
        ].filter(city => 
          city.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10)
        console.log('Web: Using fallback cities:', turkishCities)
        return turkishCities
      }
    }
  }

  const getSystemResources = async () => {
    if (isTauri()) {
      try {
        return await invoke('get_system_resources')
      } catch (error) {
        console.error('Tauri getSystemResources error:', error)
        return null
      }
    } else {
      // Web için fallback - basit sistem bilgileri
      return {
        process: {
          pid: 'web',
          memory_mb: 0,
          cpu_percent: 0,
          name: 'web'
        },
        system: {
          total_memory_mb: 0,
          used_memory_mb: 0,
          available_memory_mb: 0,
          cpu_usage: 0,
          cpu_count: navigator.hardwareConcurrency || 4,
          process_count: 0
        },
        timestamp: Date.now()
      }
    }
  }

  return {
    isTauri: isTauri(),
    getSystemInfo,
    getSystemResources,
    openWeatherUrl,
    saveFavoriteCities,
    loadFavoriteCities,
    saveSettings,
    loadSettings,
    showNotification,
    getSystemTheme,
    searchCities,
  }
}
