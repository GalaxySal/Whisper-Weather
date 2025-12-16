import { Moon, Sun, Home, User, Settings, Info, Cpu, Globe, Bug, BarChart3, Zap } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'
import { useLanguage } from '@/hooks/use-language'
import { translations } from '@/lib/translations'
import { TunnelStatus } from '@/components/TunnelStatus'
import { isTauri } from '@/lib/platform'

interface AppSidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
}

export default function AppSidebar({ currentPage, onPageChange }: AppSidebarProps) {
  const { theme, setTheme } = useTheme()
  const { language } = useLanguage()
  const t = translations[language]

  return (
    <div className="w-16 h-screen bg-white/10 backdrop-blur-md border-r border-white/20 p-2">
      <div className="flex flex-col items-center space-y-2">
        {/* Logo */}
        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-4">
          <Home className="w-5 h-5 text-white" />
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col space-y-2">
          <button
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              currentPage === 'home' 
                ? 'bg-white/20 text-white' 
                : 'text-white/60 hover:bg-white/10 hover:text-white'
            }`}
            onClick={() => onPageChange('home')}
            title={t.navigation.home}
          >
            <Home className="w-4 h-4" />
          </button>

          <button
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              currentPage === 'profile' 
                ? 'bg-white/20 text-white' 
                : 'text-white/60 hover:bg-white/10 hover:text-white'
            }`}
            onClick={() => onPageChange('profile')}
            title={t.navigation.profile}
          >
            <User className="w-4 h-4" />
          </button>

          <button
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              currentPage === 'settings' 
                ? 'bg-white/20 text-white' 
                : 'text-white/60 hover:bg-white/10 hover:text-white'
            }`}
            onClick={() => onPageChange('settings')}
            title={t.navigation.settings}
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              currentPage === 'about' 
                ? 'bg-white/20 text-white' 
                : 'text-white/60 hover:bg-white/10 hover:text-white'
            }`}
            onClick={() => onPageChange('about')}
            title={t.about.title}
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              currentPage === 'system' 
                ? 'bg-white/20 text-white' 
                : 'text-white/60 hover:bg-white/10 hover:text-white'
            }`}
            onClick={() => onPageChange('system')}
            title={t.command.systemResources}
          >
            <Cpu className="w-4 h-4" />
          </button>

          <button
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              currentPage === 'zentaira' 
                ? 'bg-white/20 text-white' 
                : 'text-white/60 hover:bg-white/10 hover:text-white'
            }`}
            onClick={() => onPageChange('zentaira')}
            title="Zentaira"
          >
            <Globe className="w-4 h-4" />
          </button>

          <button
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              currentPage === 'explorer' 
                ? 'bg-white/20 text-white' 
                : 'text-white/60 hover:bg-white/10 hover:text-white'
            }`}
            onClick={() => onPageChange('explorer')}
            title="Weather Explorer"
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          <button
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              currentPage === 'bugreport' 
                ? 'bg-white/20 text-white' 
                : 'text-white/60 hover:bg-white/10 hover:text-white'
            }`}
            onClick={() => onPageChange('bugreport')}
            title={t.command.bugReport}
          >
            <Bug className="w-4 h-4" />
          </button>

          <button
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              currentPage === 'updates' 
                ? 'bg-white/20 text-white' 
                : 'text-white/60 hover:bg-white/10 hover:text-white'
            }`}
            onClick={() => onPageChange('updates')}
            title="Updates"
          >
            <Zap className="w-4 h-4" />
          </button>
        </nav>

        {/* Theme Toggle */}
        <div className="mt-auto flex flex-col space-y-2">
          <button
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={t.navigation.theme}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {isTauri() && (
            <div className="w-10 h-10 flex items-center justify-center">
              <TunnelStatus />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
