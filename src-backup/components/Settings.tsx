import { Settings as SettingsIcon, Moon, Sun, Monitor, Cloud, Languages, Heart, X, Plus, Shield, Eye, EyeOff } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'
import { useLanguage } from '@/hooks/use-language'
import { useFavorites } from '@/hooks/use-favorites'
import { translations } from '@/lib/translations'
import { useState } from 'react'
import PlacesAutocomplete from './PlacesAutocomplete'
import { Button } from '@/components/ui/button'

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const { favorites, addFavorite, removeFavorite } = useFavorites()
  const t = translations[language]
  const [isEditingFavorites, setIsEditingFavorites] = useState(false)
  const [newCity, setNewCity] = useState('')
  const [showUserId, setShowUserId] = useState(false)

  // ID'yi güvenli bir şekilde maskela
  const maskUserId = (userId: string) => {
    if (!userId || userId.length < 8) return '***'
    const start = userId.substring(0, 4)
    const end = userId.substring(userId.length - 4)
    const middle = '*'.repeat(userId.length - 8)
    return `${start}${middle}${end}`
  }

  const getUserId = () => {
    return '****-****-****-****'
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass-effect rounded-2xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <SettingsIcon className="w-6 h-6 mr-2" />
          {t.settings.title}
        </h2>
        
        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Hesap Bilgileri
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Kullanıcı ID</span>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-white/10 rounded text-sm font-mono">
                    {showUserId ? getUserId() : maskUserId(getUserId())}
                  </code>
                  <button
                    onClick={() => setShowUserId(!showUserId)}
                    className="p-1 rounded hover:bg-white/10 transition-colors"
                    title={showUserId ? "Gizle" : "Göster"}
                  >
                    {showUserId ? (
                      <EyeOff className="w-4 h-4 text-white/60" />
                    ) : (
                      <Eye className="w-4 h-4 text-white/60" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">E-posta</span>
                <span className="text-sm text-white/60">
                  gue***@wea***
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Hesap Durumu</span>
                <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-sm">
                  Aktif
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold mb-4">{t.settings.theme}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/80">{t.settings.light}</span>
                <button
                  onClick={() => setTheme('light')}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    theme === 'light' 
                      ? 'bg-white/20 border-white/40' 
                      : 'bg-white/5 border-white/20 hover:bg-white/10'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">{t.settings.dark}</span>
                <button
                  onClick={() => setTheme('dark')}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    theme === 'dark' 
                      ? 'bg-white/20 border-white/40' 
                      : 'bg-white/5 border-white/20 hover:bg-white/10'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">{t.settings.system}</span>
                <button
                  onClick={() => setTheme('system')}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    theme === 'system' 
                      ? 'bg-white/20 border-white/40' 
                      : 'bg-white/5 border-white/20 hover:bg-white/10'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">{t.settings.weather}</span>
                <button
                  onClick={() => setTheme('weather')}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    theme === 'weather' 
                      ? 'bg-white/20 border-white/40' 
                      : 'bg-white/5 border-white/20 hover:bg-white/10'
                  }`}
                >
                  <Cloud className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold mb-4">{t.settings.language}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/80">{t.settings.turkish}</span>
                <button
                  onClick={() => setLanguage('tr')}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    language === 'tr' 
                      ? 'bg-white/20 border-white/40' 
                      : 'bg-white/5 border-white/20 hover:bg-white/10'
                  }`}
                >
                  <Languages className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">{t.settings.english}</span>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    language === 'en' 
                      ? 'bg-white/20 border-white/40' 
                      : 'bg-white/5 border-white/20 hover:bg-white/10'
                  }`}
                >
                  <Languages className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                {t.settings.favorites}
              </h3>
              <Button
                onClick={() => setIsEditingFavorites(!isEditingFavorites)}
                variant="ghost"
                size="sm"
                className="bg-white/10 hover:bg-white/20 border border-white/20"
              >
                {isEditingFavorites ? (
                  <X className="w-4 h-4" />
                ) : (
                  t.settings.edit
                )}
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/80">{t.settings.favoriteCitiesCount}</span>
                <span className="font-medium">{favorites.length}</span>
              </div>
              
              {isEditingFavorites && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <PlacesAutocomplete
                      onPlaceSelect={(city) => {
                        setNewCity(city)
                      }}
                      placeholder={t.settings.addCity}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => {
                        if (newCity && !favorites.includes(newCity)) {
                          addFavorite(newCity)
                          setNewCity('')
                        }
                      }}
                      size="sm"
                      className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/40"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {favorites.length === 0 && (
                <p className="text-white/60 text-sm italic">
                  {t.settings.noFavoritesYet}
                </p>
              )}
              {favorites.length > 0 && (
                <div className="mt-4">
                  <div className="text-white/80 text-sm mb-2">
                    {t.weather.favoriteCities}:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {favorites.map((city, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-1 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-sm"
                      >
                        <span>{city}</span>
                        {isEditingFavorites && (
                          <button
                            onClick={() => removeFavorite(city)}
                            className="ml-1 text-white/60 hover:text-white/80"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
