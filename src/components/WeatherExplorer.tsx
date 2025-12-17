import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, BarChart3, Clock, Trash2, RefreshCw, Globe, Activity, Settings, Download } from 'lucide-react'
import { useTranslation } from '../hooks/use-translation'
import { toast } from 'sonner'

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
  const { t, language } = useTranslation()
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
      const stored = localStorage.getItem('weather-search-history')
      if (stored) {
        const history = JSON.parse(stored)
        setSearchHistory(history)
        setWeatherStats(calculateStats(history))
      }
    } catch (error) {
      console.error('Failed to load weather data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const calculateStats = (history: WeatherSearch[]) => {
    const cityCounts = history.reduce((acc: any, h: any) => {
      acc[h.city] = (acc[h.city] || 0) + 1
      return acc
    }, {})
    
    const popularCity = Object.keys(cityCounts).length > 0 
      ? Object.keys(cityCounts).reduce((a, b) => cityCounts[a] > cityCounts[b] ? a : b)
      : 'İstanbul'
    
    return {
      totalSearches: history.length,
      favoriteCities: Object.keys(cityCounts).length,
      uniqueCities: Object.keys(cityCounts).length,
      todaySearches: history.filter((h: any) => {
        const searchDate = new Date(h.timestamp).toDateString()
        return searchDate === new Date().toDateString()
      }).length,
      popularCity,
      searchTrend: 'up' as const,
      lastSearch: history.length > 0 ? history[history.length - 1].timestamp : new Date().toLocaleString(),
      weatherAlerts: 0,
      savedLocations: 0
    }
  }

  useEffect(() => {
    loadWeatherData()
  }, [loadWeatherData])

  const clearSearchHistory = () => {
    localStorage.removeItem('weather-search-history')
    setSearchHistory([])
    setWeatherStats({
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
    
    toast.success(language === 'tr' ? 'Arama geçmişi temizlendi' : 'Search history cleared', {
      duration: 3000,
      position: 'bottom-right'
    })
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
    a.download = `weather-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success(language === 'tr' ? 'Veri dışa aktarıldı' : 'Data exported', {
      duration: 3000,
      position: 'bottom-right'
    })
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-white text-center border border-white/20">
          <div className="w-12 h-12 mx-auto border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>{t('loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-white border border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Globe className="w-8 h-8 mr-3 text-blue-400" />
            <h1 className="text-3xl font-bold">
              {t('weatherExplorer')}
            </h1>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={loadWeatherData}
              className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white/20 transition-all duration-200 flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('refresh')}
            </button>
            <button
              onClick={clearSearchHistory}
              className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white/20 transition-all duration-200 flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('clear')}
            </button>
            <button
              onClick={exportData}
              className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white/20 transition-all duration-200 flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              {t('export')}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 text-white border border-white/20">
        <div className="flex space-x-2">
          {[
            { id: 'overview', label: t('overview'), icon: BarChart3 },
            { id: 'history', label: t('searchHistory'), icon: Clock },
            { id: 'cities', label: t('cities'), icon: Globe },
            { id: 'trends', label: t('trends'), icon: TrendingUp },
            { id: 'stats', label: t('statistics'), icon: Settings }
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

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-8 h-8 text-blue-400" />
                <span className="text-2xl font-bold">{weatherStats.totalSearches}</span>
              </div>
              <h3 className="text-lg font-semibold">{t('totalSearches')}</h3>
              <p className="text-sm text-white/60">{weatherStats.todaySearches} {t('today')}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <Globe className="w-8 h-8 text-green-400" />
                <span className="text-2xl font-bold">{weatherStats.uniqueCities}</span>
              </div>
              <h3 className="text-lg font-semibold">{t('uniqueCities')}</h3>
              <p className="text-sm text-white/60">{weatherStats.popularCity}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <Globe className="w-8 h-8 text-purple-400" />
                <span className="text-2xl font-bold">{weatherStats.favoriteCities}</span>
              </div>
              <h3 className="text-lg font-semibold">{t('favoriteCities')}</h3>
              <p className="text-sm text-white/60">{t('saved')}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <Clock className="w-8 h-8 text-orange-400" />
                <span className="text-sm font-bold">{weatherStats.lastSearch}</span>
              </div>
              <h3 className="text-lg font-semibold">{t('lastSearch')}</h3>
              <p className="text-sm text-white/60">{t('recent')}</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white border border-white/20">
            <h3 className="text-xl font-semibold mb-4">
              {t('recentActivity')}
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
                    {search.success ? t('success') : t('error')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Search History Tab */}
      {selectedTab === 'history' && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white border border-white/20">
          <h3 className="text-xl font-semibold mb-6">
            {t('searchHistory')}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4">{t('city')}</th>
                  <th className="text-left py-3 px-4">{t('date')}</th>
                  <th className="text-left py-3 px-4">{t('temperature')}</th>
                  <th className="text-left py-3 px-4">{t('status')}</th>
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
                        {search.success ? t('success') : t('error')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cities Tab */}
      {selectedTab === 'cities' && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white border border-white/20">
          <h3 className="text-xl font-semibold mb-6">
            {t('cityStatistics')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center">
                <Globe className="w-4 h-4 mr-2" />
                {t('popularCities')}
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
                      <span>{count as number} {t('times')}</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                {t('searchTrend')}
              </h4>
              <p className="text-white/60">
                {weatherStats.searchTrend === 'up' 
                  ? t('increasing')
                  : weatherStats.searchTrend === 'down'
                  ? t('decreasing')
                  : t('stable')
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {selectedTab === 'trends' && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white border border-white/20">
          <h3 className="text-xl font-semibold mb-6">
            {t('searchTrends')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold mb-2">{weatherStats.totalSearches}</div>
              <div className="text-sm text-white/60">{t('totalSearches')}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold mb-2">{weatherStats.todaySearches}</div>
              <div className="text-sm text-white/60">{t('today')}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold mb-2">{weatherStats.uniqueCities}</div>
              <div className="text-sm text-white/60">{t('uniqueCities')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Tab */}
      {selectedTab === 'stats' && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white border border-white/20">
          <h3 className="text-xl font-semibold mb-6">
            {t('detailedStatistics')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-semibold mb-3">{t('searchPerformance')}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t('successRate')}</span>
                  <span>
                    {searchHistory.length > 0 
                      ? `${Math.round((searchHistory.filter(s => s.success).length / searchHistory.length) * 100)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t('avgTemperature')}</span>
                  <span>
                    {searchHistory.length > 0 && searchHistory.some(s => s.temperature)
                      ? Math.round(searchHistory.filter(s => s.temperature).reduce((acc, s) => acc + (s.temperature || 0), 0) / searchHistory.filter(s => s.temperature).length)
                      : 'N/A'}°C
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-semibold mb-3">{t('timeAnalysis')}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t('firstSearch')}</span>
                  <span>
                    {searchHistory.length > 0 
                      ? new Date(searchHistory[searchHistory.length - 1].timestamp).toLocaleDateString()
                      : 'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t('lastSearch')}</span>
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
