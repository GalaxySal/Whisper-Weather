import { Moon, Sun, Monitor, Languages, Heart, Info, LogOut } from 'lucide-react'
import { useTheme } from '../hooks/use-theme'
import { useLanguage } from '../hooks/use-language'
import { useFavorites } from '../hooks/use-favorites'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface NavigationProps {
  user: any
  onPageChange: (page: string) => void
}

export default function Navigation({ user, onPageChange }: NavigationProps) {
  const { setTheme } = useTheme()
  const { setLanguage } = useLanguage()
  const { favorites } = useFavorites()
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2 flex items-center gap-2">
      {/* User Menu */}
      <div className="relative">
        <button className="px-3 py-2 text-white hover:bg-white/20 rounded-lg transition-colors">
          {user?.email || 'User'}
        </button>
        <div className="absolute top-full left-0 mt-2 w-48 bg-white/95 backdrop-blur-md border border-white/20 rounded-xl shadow-xl z-50">
          <div className="p-2 text-gray-900">
            <div className="flex items-center gap-2 p-2 hover:bg-blue-50 rounded-lg">
              <Heart className="w-4 h-4" />
              <span>Favorites ({favorites.length})</span>
            </div>
            <div 
              className="flex items-center gap-2 p-2 hover:bg-blue-50 rounded-lg cursor-pointer"
              onClick={() => onPageChange('about')}
            >
              <Info className="w-4 h-4" />
              <span>About</span>
            </div>
            <div 
              className="flex items-center gap-2 p-2 hover:bg-blue-50 rounded-lg cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Menu */}
      <div className="relative">
        <button 
          onClick={() => setThemeMenuOpen(!themeMenuOpen)}
          className="px-3 py-2 text-white hover:bg-white/20 rounded-lg transition-colors"
        >
          Theme
        </button>
        {themeMenuOpen && (
          <div className="absolute top-full left-0 mt-2 w-40 bg-white/95 backdrop-blur-md border border-white/20 rounded-xl shadow-xl z-50">
            <div className="p-2 text-gray-900">
              <button
                onClick={() => {
                  setTheme('light')
                  setThemeMenuOpen(false)
                }}
                className="w-full flex items-center gap-2 p-2 hover:bg-blue-50 rounded-lg text-left"
              >
                <Sun className="w-4 h-4" />
                <span>Light</span>
              </button>
              <button
                onClick={() => {
                  setTheme('dark')
                  setThemeMenuOpen(false)
                }}
                className="w-full flex items-center gap-2 p-2 hover:bg-blue-50 rounded-lg text-left"
              >
                <Moon className="w-4 h-4" />
                <span>Dark</span>
              </button>
              <button
                onClick={() => {
                  setTheme('system')
                  setThemeMenuOpen(false)
                }}
                className="w-full flex items-center gap-2 p-2 hover:bg-blue-50 rounded-lg text-left"
              >
                <Monitor className="w-4 h-4" />
                <span>System</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Language Menu */}
      <div className="relative">
        <button 
          onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
          className="px-3 py-2 text-white hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2"
        >
          <Languages className="w-4 h-4" />
          Language
        </button>
        {languageMenuOpen && (
          <div className="absolute top-full left-0 mt-2 w-32 bg-white/95 backdrop-blur-md border border-white/20 rounded-xl shadow-xl z-50">
            <div className="p-2 text-gray-900">
              <button
                onClick={() => {
                  setLanguage('tr')
                  setLanguageMenuOpen(false)
                }}
                className="w-full p-2 hover:bg-blue-50 rounded-lg text-left"
              >
                Türkçe
              </button>
              <button
                onClick={() => {
                  setLanguage('en')
                  setLanguageMenuOpen(false)
                }}
                className="w-full p-2 hover:bg-blue-50 rounded-lg text-left"
              >
                English
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
