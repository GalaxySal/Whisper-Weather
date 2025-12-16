import { useState, useEffect, useCallback } from 'react'
import { useTauri } from './use-tauri'

type Theme = 'light' | 'dark' | 'system'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('system')
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light')
  const { saveSettings, loadSettings } = useTauri()

  // Check system theme
  const checkSystemTheme = useCallback(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
      setSystemTheme(darkModeQuery.matches ? 'dark' : 'light')
      
      // Listen for system theme changes
      const handleChange = (e: MediaQueryListEvent) => {
        setSystemTheme(e.matches ? 'dark' : 'light')
      }
      
      darkModeQuery.addEventListener('change', handleChange)
      return () => darkModeQuery.removeEventListener('change', handleChange)
    }
  }, [])

  // Load theme from settings
  const loadTheme = useCallback(async () => {
    try {
      // Check if we're in Tauri environment
      const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__
      
      if (isTauri) {
        const settings = await loadSettings()
        const savedTheme = settings.theme || 'system'
        setTheme(savedTheme)
      } else {
        // Web environment - use localStorage
        const savedTheme = localStorage.getItem('theme') as Theme || 'system'
        setTheme(savedTheme)
      }
    } catch (error) {
      console.error('Error loading theme:', error)
      // Fallback to system theme
      setTheme('system')
    }
  }, [loadSettings])

  // Save theme
  const saveTheme = useCallback(async (newTheme: Theme) => {
    try {
      const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__
      
      if (isTauri) {
        const settings = await loadSettings()
        await saveSettings(settings.language || 'tr', newTheme)
      } else {
        // Web environment - use localStorage
        localStorage.setItem('theme', newTheme)
      }
      
      setTheme(newTheme)
    } catch (error) {
      console.error('Error saving theme:', error)
      // Still update local state even if save fails
      setTheme(newTheme)
    }
  }, [loadSettings, saveSettings])

  // Get current active theme
  const getCurrentTheme = useCallback(() => {
    if (theme === 'system') {
      return systemTheme
    }
    return theme
  }, [theme, systemTheme])

  // Apply theme to document
  const applyTheme = useCallback(() => {
    const currentTheme = getCurrentTheme()
    const root = document.documentElement
    
    if (currentTheme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }
    
    // Force Tailwind to update in Tauri environment
    if (typeof window !== 'undefined') {
      // Add a data attribute for additional theme tracking
      root.setAttribute('data-theme', currentTheme)
      
      // Trigger a reflow to ensure Tailwind updates
      void root.offsetWidth
    }
  }, [getCurrentTheme])

  // Listen for Rust-triggered theme changes
  const listenToRustThemeChanges = useCallback(() => {
    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__
    
    if (isTauri) {
      const { listen } = (window as any).__TAURI__.event
      
      // Listen for system theme changes from Rust
      const unlisten = listen('system-theme-changed', (event: any) => {
        const rustSystemTheme = event.payload as 'light' | 'dark'
        setSystemTheme(rustSystemTheme)
      })
      
      return unlisten
    }
    
    return () => {} // No-op for web environment
  }, [])

  // Get weather-based gradient
  const getWeatherGradient = useCallback((weatherMain?: string) => {
    const currentTheme = getCurrentTheme()
    
    if (weatherMain) {
      switch (weatherMain.toLowerCase()) {
        case 'clear':
          return currentTheme === 'dark' 
            ? 'from-slate-900 via-slate-800 to-slate-900'
            : 'from-blue-400 via-blue-500 to-blue-600'
        case 'clouds':
          return currentTheme === 'dark'
            ? 'from-gray-900 via-gray-800 to-gray-900'
            : 'from-gray-400 via-gray-500 to-gray-600'
        case 'rain':
        case 'drizzle':
          return currentTheme === 'dark'
            ? 'from-slate-800 via-slate-700 to-slate-800'
            : 'from-gray-500 via-gray-600 to-gray-700'
        case 'snow':
          return currentTheme === 'dark'
            ? 'from-slate-700 via-slate-600 to-slate-700'
            : 'from-gray-200 via-gray-300 to-gray-400'
        case 'thunderstorm':
          return currentTheme === 'dark'
            ? 'from-purple-900 via-purple-800 to-purple-900'
            : 'from-purple-600 via-purple-700 to-purple-800'
        case 'mist':
        case 'fog':
          return currentTheme === 'dark'
            ? 'from-gray-800 via-gray-700 to-gray-800'
            : 'from-gray-300 via-gray-400 to-gray-500'
        default:
          return currentTheme === 'dark'
            ? 'from-slate-900 via-slate-800 to-slate-900'
            : 'from-blue-400 via-blue-500 to-blue-600'
      }
    }
    
    // Default gradients
    return currentTheme === 'dark'
      ? 'from-slate-900 via-slate-800 to-slate-900'
      : 'from-blue-400 via-blue-500 to-blue-600'
  }, [getCurrentTheme])

  useEffect(() => {
    checkSystemTheme()
    loadTheme()
    
    // Set up Rust theme change listener
    const unlisten = listenToRustThemeChanges()
    
    return () => {
      unlisten()
    }
  }, [])

  useEffect(() => {
    applyTheme()
  }, [theme, systemTheme])

  return {
    theme,
    systemTheme,
    setTheme: saveTheme,
    getCurrentTheme,
    getWeatherGradient
  }
}
