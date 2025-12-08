import { useState, useEffect, Suspense, lazy } from "react";
import { Wind, Droplets, Eye, Search } from "lucide-react";
import axios from "axios";
import { supabase } from "./lib/supabase";
import FavoriteCities from "./components/FavoriteCities";
import { useLanguage } from "./hooks/use-language";
import { useTheme } from "./hooks/use-theme";
import { translations } from "./lib/translations";
import { translateWeatherCondition } from "./lib/weather-translations";
import { Toaster, toast } from "sonner";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { CommandMenu } from "./components/CommandMenu";
import { PageTransition, MotionItem } from "./components/ui/motion";
import { tunnelService } from "./services/tunnel";
import { isTauri } from "./lib/platform";
import "./App.css";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Lazy loaded components
const Auth = lazy(() => import("./components/Auth"));
const AppSidebar = lazy(() => import("./components/AppSidebar"));
const Profile = lazy(() => import("./components/Profile"));
const Settings = lazy(() => import("./components/Settings"));
const About = lazy(() => import("./components/About"));
const SystemResources = lazy(() => import("./components/SystemResources"));
const Zentaira = lazy(() => import("./components/Zentaira"));
const BugReport = lazy(() => import("./components/BugReport"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));

// Main App component
export function AppContent() {
  const [user, setUser] = useState<any>(null);
  const [searchCity, setSearchCity] = useState("");
  const [weatherData, setWeatherData] = useState<any>(null);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState("home");
  const { language } = useLanguage();
  const { theme, applyWeatherTheme, isThemeReady } = useTheme();
  const t = translations[language];

  // Hava durumuna göre tema değiştirme
  useEffect(() => {
    // Sadece "weather" teması seçiliyken uygula
    if (theme === 'weather' && weatherData) {
      const condition = weatherData.weather?.[0]?.description || weatherData.condition || 'clear'
      const temperature = weatherData.main?.temp || weatherData.temperature || 20
      applyWeatherTheme(condition.toLowerCase(), Math.round(temperature))
    } else if (theme !== 'weather') {
      // Weather teması değilse weather class'larını temizle
      const root = window.document.documentElement
      root.classList.remove(
        'weather-clear', 'weather-clouds', 'weather-rain', 'weather-snow', 
        'weather-thunderstorm', 'weather-drizzle', 'weather-mist', 
        'weather-fog', 'weather-haze', 'weather-hot', 'weather-cold'
      )
    }
  }, [theme, weatherData, applyWeatherTheme])

  // Dil değişimini algıla ve component'i yeniden render et
  useEffect(() => {
    // Boş useEffect - dil değişiminde yeniden render tetikler
  }, [language])

  useEffect(() => {
    // Initialize tunnel service only in Tauri
    if (isTauri()) {
      tunnelService.initialize().catch(console.error);
    }
    
    // Check auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Tema hazır değilse loading göster - hook'lardan sonra!
  if (!isThemeReady) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Yükleniyor...</div>
      </div>
    )
  }

  const handleCitySelect = (city: string) => {
    setSearchCity(city)
    // Hava durumunu doğrudan ara
    searchWeather({ preventDefault: () => {} } as React.FormEvent)
  }

  const searchWeather = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchCity.trim()) return

    setError("")

    try {
      const apiKey = import.meta.env.VITE_OPENWEATHERMAP_API_KEY
      
      // Türkiye şehirleri için ülke kodu ekle
      let searchQuery = searchCity
      
      const turkishCities = ['istanbul', 'ankara', 'izmir', 'bursa', 'adana', 'antalya', 'konya', 'samsun', 'gaziantep', 'kocaeli']
      
      if (turkishCities.includes(searchCity.toLowerCase().replace('ı', 'i').replace('ş', 's').replace('ğ', 'g').replace('ü', 'u').replace('ö', 'o').replace('ç', 'c'))) {
        searchQuery = `${searchCity},TR`
      }
      
      // API sorgusunu logla (Tauri backend'de)
      if (isTauri()) {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('log_api_query_command', {
          endpoint: `/weather?q=${searchQuery}`,
          method: 'GET',
          status: 200,
          error: null
        })
      }
      
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${searchQuery}&appid=${apiKey}&units=metric&lang=${language === 'tr' ? 'tr' : 'en'}`
      )
      
      const data = response.data
      
      // Hava durumu verilerini işle
      setWeatherData(data)
      
      const condition = data.weather[0].description
      const temp = Math.round(data.main.temp)
      
      // Kullanıcıyı rahatsız etmeyen başarı bildirimi
      toast.success(t.messages.citySearchSuccess, {
        description: `${data.name}: ${temp}°C, ${translateWeatherCondition(condition, language)}`,
        duration: 3000,
        position: 'bottom-right',
      })
      
      // Weather theme'ini uygula
      applyWeatherTheme(data.weather[0].main.toLowerCase(), temp)
      
    } catch (err: any) {
      console.error('Weather search error:', err)
      
      // Hatalı sorguyu da logla
      if (isTauri()) {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('log_api_query_command', {
          endpoint: `/weather?q=${searchCity}`,
          method: 'GET',
          status: 500,
          error: err.message
        })
      }
      
      setError(t.weather.cityNotFound)
      setWeatherData(null)
      
      // Hata bildirimi
      toast.error(t.messages.error, {
        description: t.weather.cityNotFound,
        duration: 4000,
        position: 'bottom-right',
      })
    }
  }

  return (
    <>
      {!user ? (
        <div className="min-h-screen weather-gradient">
          <div className="min-h-screen backdrop-blur-sm bg-black/10">
            <div className="container mx-auto px-4 py-8">
              <Suspense fallback={<div className="text-white text-center">Yükleniyor...</div>}>
                <Auth />
              </Suspense>
            </div>
          </div>
        </div>
      ) : (
        <SidebarProvider>
          <SidebarInset className="min-h-screen weather-gradient">
            <Suspense fallback={<div className="text-white text-center">Yükleniyor...</div>}>
              <AppSidebar user={user} currentPage={currentPage} onPageChange={setCurrentPage} />
            </Suspense>
            <CommandMenu onPageChange={setCurrentPage} onCitySearch={setSearchCity} />
            <div className="min-h-screen backdrop-blur-sm bg-black/10">
              <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Header */}
                <header className="text-center mb-8">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
                    {t.app.title}
                  </h1>
                  <p className="text-sm sm:text-base md:text-lg text-white/80">
                    {t.app.welcome}, {user.user_metadata?.display_name || user.email}!
                  </p>
                </header>

                {/* Favorite Cities - Her zaman göster */}
                <FavoriteCities onSelectCity={handleCitySelect} />

                {/* Page Content */}
                <PageTransition>
                  {currentPage === 'home' && (
                    <>
                      {/* Search Form */}
                      <MotionItem delay={0.1}>
                        <form onSubmit={searchWeather} className="max-w-md mx-auto mb-8">
                          <div className="relative">
                            <input
                              id="city-search"
                              name="city-search"
                              type="text"
                              value={searchCity}
                              onChange={(e) => setSearchCity(e.target.value)}
                              placeholder={t.weather.searchPlaceholder}
                              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
                          </div>
                          <div className="flex justify-center mt-4">
                            <button
                              type="submit"
                              className="px-6 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white/30 transition-all duration-200"
                            >
                              {t.weather.searchButton}
                            </button>
                          </div>
                        </form>
                      </MotionItem>

                      {/* Error Message */}
                      {error && (
                        <MotionItem delay={0.2}>
                          <div className="max-w-md mx-auto mb-6">
                            <div className="glass-effect rounded-lg p-4 text-red-200 text-center">
                              {error}
                            </div>
                          </div>
                        </MotionItem>
                      )}

                      {/* Weather Display */}
                      {weatherData && (
                        <MotionItem delay={0.3}>
                          <div className="max-w-md mx-auto">
                            <div className="glass-effect rounded-2xl p-8 text-white">
                              <div className="text-center mb-6">
                                <h2 className="text-2xl font-semibold mb-2">{weatherData.name || weatherData.location}</h2>
                                <div className="text-5xl font-bold mb-4">{Math.round(weatherData.main?.temp || weatherData.temperature || 0)}°C</div>
                                <div className="text-lg mb-4">{weatherData.weather?.[0]?.description || weatherData.condition}</div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center">
                                  <Wind className="w-5 h-5 mr-2" />
                                  <span className="text-sm">{t.weather.wind}: {weatherData.wind?.speed || weatherData.windSpeed} km/h</span>
                                </div>
                                <div className="flex items-center">
                                  <Droplets className="w-5 h-5 mr-2" />
                                  <span className="text-sm">{t.weather.humidity}: {weatherData.main?.humidity || weatherData.humidity}%</span>
                                </div>
                                <div className="flex items-center">
                                  <Eye className="w-5 h-5 mr-2" />
                                  <span className="text-sm">{t.weather.visibility}: {(weatherData.visibility ? weatherData.visibility / 1000 : weatherData.visibility || 0)} km</span>
                                </div>
                                <div className="flex items-center">
                                  <span className="text-sm">{t.weather.feelsLike}: {Math.round(weatherData.main?.feels_like || weatherData.feelsLike || 0)}°C</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </MotionItem>
                      )}
                    </>
                  )}

                  {currentPage === 'profile' && (
                    <Suspense fallback={<div className="text-white text-center">Yükleniyor...</div>}>
                      <Profile user={user} />
                    </Suspense>
                  )}
                  {currentPage === 'settings' && (
                    <Suspense fallback={<div className="text-white text-center">Yükleniyor...</div>}>
                      <Settings user={user} />
                    </Suspense>
                  )}
                  {currentPage === 'about' && (
                    <Suspense fallback={<div className="text-white text-center">Yükleniyor...</div>}>
                      <About />
                    </Suspense>
                  )}
                  {currentPage === 'system' && (
                    <Suspense fallback={<div className="text-white text-center">Yükleniyor...</div>}>
                      <SystemResources />
                    </Suspense>
                  )}
                  {currentPage === 'zentaira' && (
                    <Suspense fallback={<div className="text-white text-center">Yükleniyor...</div>}>
                      <Zentaira />
                    </Suspense>
                  )}
                  {currentPage === 'bugreport' && (
                    <Suspense fallback={<div className="text-white text-center">Yükleniyor...</div>}>
                      <BugReport />
                    </Suspense>
                  )}
                  {currentPage === 'admin' && (
                    <Suspense fallback={<div className="text-white text-center">Yükleniyor...</div>}>
                      <AdminDashboard />
                    </Suspense>
                  )}
                </PageTransition>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      )}
      <Toaster 
        richColors 
        position="bottom-right"
        expand={false}
        closeButton
        duration={3000}
      />
    </>
  );
}

// Export with ErrorBoundary
export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  )
};
