import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { 
  Users, 
  Activity,
  Settings,
  Trash2,
  RefreshCw,
  Download,
  BarChart3,
  Globe,
  Clock,
  TrendingUp
} from 'lucide-react'
import { useLanguage } from '@/hooks/use-language'
import { MotionItem } from '@/components/ui/motion'

interface WeatherSearch {
  city: string
  timestamp: string
  success: boolean
  temperature?: number
  condition?: string
}

interface WeatherStats {
  totalSearches: number
  favoriteCities: number
  uniqueCities: number
  todaySearches: number
  popularCity: string
  searchTrend: 'up' | 'down' | 'stable'
  lastSearch: string
  weatherAlerts: number
  savedLocations: number
}

function WeatherExplorer() {
  const { language } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [searchHistory, setSearchHistory] = useState<WeatherSearch[]>([])
  const [weatherStats, setWeatherStats] = useState<WeatherStats>({
    totalSearches: 0,
    favoriteCities: 0,
    uniqueCities: 0,
    todaySearches: 0,
    popularCity: 'İstanbul',
    searchTrend: 'up',
    lastSearch: new Date().toLocaleString(),
    weatherAlerts: 0,
    savedLocations: 0
  })
  const [selectedTab, setSelectedTab] = useState('overview')

  const loadWeatherData = useCallback(async () => {
    setIsLoading(true)
    
    try {
      // Local storage'dan verileri çek
      const savedHistory = localStorage.getItem('weather-search-history')
      const savedFavorites = localStorage.getItem('favorite-cities')
      
      const history = savedHistory ? JSON.parse(savedHistory) : []
      const favorites = savedFavorites ? JSON.parse(savedFavorites) : []
      
      setSearchHistory(history.slice(0, 10))
      
      // İstatistikleri hesapla
      const uniqueCities = [...new Set(history.map((h: any) => h.city))]
      const todaySearches = history.filter((h: any) => {
        const searchDate = new Date(h.timestamp).toDateString()
        return searchDate === new Date().toDateString()
      })
      
      const cityCounts = history.reduce((acc: any, h: any) => {
        acc[h.city] = (acc[h.city] || 0) + 1
        return acc
      }, {})
      
      const popularCity = Object.keys(cityCounts).length > 0 
        ? Object.keys(cityCounts).reduce((a, b) => cityCounts[a] > cityCounts[b] ? a : b)
        : 'İstanbul'
      
      setWeatherStats({
        totalSearches: history.length,
        favoriteCities: favorites.length,
        uniqueCities: uniqueCities.length,
        todaySearches: todaySearches.length,
        popularCity,
        searchTrend: todaySearches.length > 5 ? 'up' : todaySearches.length > 2 ? 'stable' : 'down',
        lastSearch: history.length > 0 ? new Date(history[0].timestamp).toLocaleString() : new Date().toLocaleString(),
        weatherAlerts: 0,
        savedLocations: favorites.length
      })
      
    } catch (error) {
      console.error('Failed to load weather data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadWeatherData()
  }, [loadWeatherData])

  const clearHistory = () => {
    localStorage.removeItem('weather-search-history')
    setSearchHistory([])
    setWeatherStats(prev => ({ ...prev, totalSearches: 0, todaySearches: 0, uniqueCities: 0 }))
    toast.success(
      language === 'tr' ? 'Arama geçmişi temizlendi' : 'Search history cleared'
    )
  }

  const exportData = () => {
    const data = {
      searchHistory,
      weatherStats,
      exportDate: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `weather-explorer-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success(
      language === 'tr' ? 'Veriler dışa aktarıldı' : 'Data exported'
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="glass-effect rounded-2xl p-8 text-white text-center">
          <div className="w-12 h-12 mx-auto border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>{language === 'tr' ? 'Yükleniyor...' : 'Loading...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <MotionItem delay={0.1}>
        <div className="glass-effect rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Globe className="w-8 h-8 mr-3 text-blue-400" />
              <h1 className="text-3xl font-bold">
                {language === 'tr' ? 'Hava Durumu Keşif Merkezi' : 'Weather Explorer'}
              </h1>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadWeatherData}
                className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white/20 transition-all duration-200 flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {language === 'tr' ? 'Yenile' : 'Refresh'}
              </button>
              <button
                onClick={clearHistory}
                className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white/20 transition-all duration-200 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {language === 'tr' ? 'Temizle' : 'Clear'}
              </button>
              <button
                onClick={exportData}
                className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white/20 transition-all duration-200 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                {language === 'tr' ? 'Dışa Aktar' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      </MotionItem>

      {/* Tabs */}
      <MotionItem delay={0.2}>
        <div className="glass-effect rounded-xl p-2 text-white">
          <div className="flex space-x-2">
            {[
              { id: 'overview', label: language === 'tr' ? 'Genel Bakış' : 'Overview', icon: BarChart3 },
              { id: 'history', label: language === 'tr' ? 'Arama Geçmişi' : 'Search History', icon: Clock },
              { id: 'cities', label: language === 'tr' ? 'Şehirler' : 'Cities', icon: Globe },
              { id: 'trends', label: language === 'tr' ? 'Trendler' : 'Trends', icon: TrendingUp },
              { id: 'stats', label: language === 'tr' ? 'İstatistikler' : 'Statistics', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg transition-all duration-200 ${
                  selectedTab === tab.id 
                    ? 'bg-white/20 text-white' 
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </MotionItem>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MotionItem delay={0.3}>
              <div className="glass-effect rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <Activity className="w-8 h-8 text-blue-400" />
                  <span className="text-2xl font-bold">{weatherStats.totalSearches}</span>
                </div>
                <h3 className="text-lg font-semibold">{language === 'tr' ? 'Toplam Arama' : 'Total Searches'}</h3>
                <p className="text-sm text-white/60">{weatherStats.todaySearches} {language === 'tr' ? 'bugün' : 'today'}</p>
              </div>
            </MotionItem>

            <MotionItem delay={0.4}>
              <div className="glass-effect rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <Globe className="w-8 h-8 text-green-400" />
                  <span className="text-2xl font-bold">{weatherStats.uniqueCities}</span>
                </div>
                <h3 className="text-lg font-semibold">{language === 'tr' ? 'Şehir Sayısı' : 'Unique Cities'}</h3>
                <p className="text-sm text-white/60">{weatherStats.popularCity}</p>
              </div>
            </MotionItem>

            <MotionItem delay={0.5}>
              <div className="glass-effect rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-purple-400" />
                  <span className="text-2xl font-bold">{weatherStats.favoriteCities}</span>
                </div>
                <h3 className="text-lg font-semibold">{language === 'tr' ? 'Favori Şehirler' : 'Favorite Cities'}</h3>
                <p className="text-sm text-white/60">{language === 'tr' ? 'Kaydedildi' : 'Saved'}</p>
              </div>
            </MotionItem>

            <MotionItem delay={0.6}>
              <div className="glass-effect rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="w-8 h-8 text-orange-400" />
                  <span className="text-sm font-bold">{weatherStats.lastSearch}</span>
                </div>
                <h3 className="text-lg font-semibold">{language === 'tr' ? 'Son Arama' : 'Last Search'}</h3>
                <p className="text-sm text-white/60">{language === 'tr' ? 'Güncel' : 'Recent'}</p>
              </div>
            </MotionItem>
          </div>

          {/* Recent Activity */}
          <MotionItem delay={0.7}>
            <div className="glass-effect rounded-xl p-6 text-white">
              <h3 className="text-xl font-semibold mb-4">
                {language === 'tr' ? 'Son Aktiviteler' : 'Recent Activity'}
              </h3>
              <div className="space-y-3">
                {searchHistory.slice(0, 5).map((search) => (
                  <div key={search.timestamp} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Activity className="w-4 h-4 text-blue-400" />
                      <div>
                        <p className="font-medium">{search.city}</p>
                        <p className="text-sm text-white/60">{new Date(search.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      search.success ? 'text-green-400 bg-green-500/20' : 'text-red-400 bg-red-500/20'
                    }`}>
                      {search.success ? 'Başarılı' : 'Hata'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </MotionItem>
        </>
      )}

      {/* Search History Tab */}
      {selectedTab === 'history' && (
        <MotionItem delay={0.3}>
          <div className="glass-effect rounded-xl p-6 text-white">
            <h3 className="text-xl font-semibold mb-6">
              {language === 'tr' ? 'Arama Geçmişi' : 'Search History'}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-4">{language === 'tr' ? 'Şehir' : 'City'}</th>
                    <th className="text-left py-3 px-4">{language === 'tr' ? 'Tarih' : 'Date'}</th>
                    <th className="text-left py-3 px-4">{language === 'tr' ? 'Sıcaklık' : 'Temperature'}</th>
                    <th className="text-left py-3 px-4">{language === 'tr' ? 'Durum' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody>
                  {searchHistory.map((search) => (
                    <tr key={search.timestamp} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-3 px-4 font-medium">{search.city}</td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <p>{new Date(search.timestamp).toLocaleDateString()}</p>
                          <p className="text-white/60">{new Date(search.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {search.temperature ? `${search.temperature}°C` : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          search.success ? 'text-green-400 bg-green-500/20' : 'text-red-400 bg-red-500/20'
                        }`}>
                          {search.success ? 'Başarılı' : 'Hata'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </MotionItem>
      )}

      {/* Cities Tab */}
      {selectedTab === 'cities' && (
        <MotionItem delay={0.3}>
          <div className="glass-effect rounded-xl p-6 text-white">
            <h3 className="text-xl font-semibold mb-6">
              {language === 'tr' ? 'Şehir İstatistikleri' : 'City Statistics'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  {language === 'tr' ? 'En Popüler Şehirler' : 'Popular Cities'}
                </h4>
                <div className="space-y-2">
                  {Object.entries(
                    searchHistory.reduce((acc: any, search) => {
                      acc[search.city] = (acc[search.city] || 0) + 1
                      return acc
                    }, {})
                  )
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .slice(0, 5)
                    .map(([city, count]) => (
                      <div key={city} className="flex justify-between">
                        <span>{city}</span>
                        <span>{count as number} {language === 'tr' ? 'kez' : 'times'}</span>
                      </div>
                    ))}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {language === 'tr' ? 'Arama Trendi' : 'Search Trend'}
                </h4>
                <p className="text-white/60">
                  {weatherStats.searchTrend === 'up' 
                    ? language === 'tr' ? 'Artışta' : 'Increasing'
                    : weatherStats.searchTrend === 'down'
                    ? language === 'tr' ? 'Düşüşte' : 'Decreasing'
                    : language === 'tr' ? 'Stabil' : 'Stable'
                  }
                </p>
              </div>
            </div>
          </div>
        </MotionItem>
      )}

      {/* Trends Tab */}
      {selectedTab === 'trends' && (
        <MotionItem delay={0.3}>
          <div className="glass-effect rounded-xl p-6 text-white">
            <h3 className="text-xl font-semibold mb-6">
              {language === 'tr' ? 'Arama Trendleri' : 'Search Trends'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold mb-2">{weatherStats.totalSearches}</div>
                <div className="text-sm text-white/60">{language === 'tr' ? 'Toplam Arama' : 'Total Searches'}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold mb-2">{weatherStats.todaySearches}</div>
                <div className="text-sm text-white/60">{language === 'tr' ? 'Bugün' : 'Today'}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold mb-2">{weatherStats.uniqueCities}</div>
                <div className="text-sm text-white/60">{language === 'tr' ? 'Benzersiz Şehir' : 'Unique Cities'}</div>
              </div>
            </div>
          </div>
        </MotionItem>
      )}

      {/* Statistics Tab */}
      {selectedTab === 'stats' && (
        <MotionItem delay={0.3}>
          <div className="glass-effect rounded-xl p-6 text-white">
            <h3 className="text-xl font-semibold mb-6">
              {language === 'tr' ? 'Detaylı İstatistikler' : 'Detailed Statistics'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold mb-3">{language === 'tr' ? 'Arama Performansı' : 'Search Performance'}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{language === 'tr' ? 'Başarı Oranı' : 'Success Rate'}</span>
                    <span>
                      {searchHistory.length > 0 
                        ? `${Math.round((searchHistory.filter(s => s.success).length / searchHistory.length) * 100)}%`
                        : '0%'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === 'tr' ? 'Ortalama Sıcaklık' : 'Avg Temperature'}</span>
                    <span>
                      {searchHistory.length > 0 && searchHistory.some(s => s.temperature)
                        ? Math.round(searchHistory.filter(s => s.temperature).reduce((acc, s) => acc + (s.temperature || 0), 0) / searchHistory.filter(s => s.temperature).length)
                        : 'N/A'}°C
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold mb-3">{language === 'tr' ? 'Zaman Analizi' : 'Time Analysis'}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{language === 'tr' ? 'İlk Arama' : 'First Search'}</span>
                    <span>
                      {searchHistory.length > 0 
                        ? new Date(searchHistory[searchHistory.length - 1].timestamp).toLocaleDateString()
                        : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === 'tr' ? 'Son Arama' : 'Last Search'}</span>
                    <span>
                      {searchHistory.length > 0 
                        ? new Date(searchHistory[0].timestamp).toLocaleDateString()
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </MotionItem>
      )}
    </div>
  )
}

export default function WeatherExplorerWithErrorBoundary() {
  return (
    <div className="min-h-screen weather-gradient">
      <div className="min-h-screen backdrop-blur-sm bg-black/10">
        <div className="container mx-auto px-4 py-8">
          <WeatherExplorer />
        </div>
      </div>
    </div>
  )
}
