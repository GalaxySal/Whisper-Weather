import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../hooks/use-theme'
import { useState } from 'react'

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-4 h-4 text-white" />
      case 'dark':
        return <Moon className="w-4 h-4 text-white" />
      default:
        return <Monitor className="w-4 h-4 text-white" />
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
      >
        {getIcon()}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 bg-white/95 backdrop-blur-md border border-white/20 rounded-xl shadow-xl z-50">
          <button
            onClick={() => {
              setTheme('light')
              setIsOpen(false)
            }}
            className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors text-gray-900 rounded-t-xl flex items-center gap-2"
          >
            <Sun className="w-4 h-4" />
            Light
          </button>
          <button
            onClick={() => {
              setTheme('dark')
              setIsOpen(false)
            }}
            className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors text-gray-900 flex items-center gap-2"
          >
            <Moon className="w-4 h-4" />
            Dark
          </button>
          <button
            onClick={() => {
              setTheme('system')
              setIsOpen(false)
            }}
            className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors text-gray-900 rounded-b-xl flex items-center gap-2"
          >
            <Monitor className="w-4 h-4" />
            System
          </button>
        </div>
      )}
    </div>
  )
}
