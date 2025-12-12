import { useState, useEffect } from "react";
import { Wind, Droplets, Eye, Search } from "lucide-react";
import axios from "axios";
import { useLanguage } from "./hooks/use-language";
import { useTheme } from "./hooks/use-theme";
import { translations } from "./lib/translations";
import { translateWeatherCondition } from "./lib/weather-translations";
import { toast } from "sonner";
import "./App.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import FavoriteCities from "./components/FavoriteCities";
import AppSidebar from "./components/AppSidebar";
import WeatherExplorerWithErrorBoundary from "./components/WeatherExplorer";
import Profile from "./components/Profile";
import Settings from "./components/Settings";
import About from "./components/About";
import SystemResources from "./components/SystemResources";
import Zentaira from "./components/Zentaira";
import BugReport from "./components/BugReport";
import Updates from "./components/Updates";

// Main App component
export function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const [searchCity, setSearchCity] = useState("");
  const [weatherData, setWeatherData] = useState<any>(null);
  const [error, setError] = useState("");
  const { language } = useLanguage();
  const { theme, applyWeatherTheme, isThemeReady } = useTheme();
  const t = translations[language];

  // Update theme based on weather
  useEffect(() => {
    if (theme === 'weather' && weatherData) {
      const condition = weatherData.weather?.[0]?.description || weatherData.condition || 'clear';
      const temperature = weatherData.main?.temp || weatherData.temperature || 20;
      applyWeatherTheme(condition.toLowerCase(), Math.round(temperature));
    } else if (theme !== 'weather') {
      const root = window.document.documentElement;
      root.classList.remove(
        'weather-clear', 'weather-clouds', 'weather-rain', 'weather-snow', 
        'weather-thunderstorm', 'weather-drizzle', 'weather-mist', 
        'weather-fog', 'weather-haze', 'weather-hot', 'weather-cold'
      );
    }
  }, [theme, weatherData, applyWeatherTheme]);

  // Re-render on language change
  useEffect(() => {
    // Empty effect to trigger re-render on language change
  }, [language]);

  // Show loading state while theme is being set up
  if (!isThemeReady) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }


  const searchWeather = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchCity.trim()) return

    setError("")

    try {
      const apiKey = import.meta.env.VITE_OPENWEATHERMAP_API_KEY;
      
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${searchCity}&appid=${apiKey}&units=metric&lang=${language === 'tr' ? 'tr' : 'en'}`
      );
      
      const data = response.data
      
      // Hava durumu verilerini işle
      setWeatherData(data)
      
      const condition = data.weather[0].description
      const temp = Math.round(data.main.temp)
      
      // Arama geçmişine kaydet
      const searchHistory = JSON.parse(localStorage.getItem('weather-search-history') || '[]');
      searchHistory.unshift({
        city: data.name,
        timestamp: new Date().toISOString(),
        success: true,
        temperature: temp,
        condition: condition
      });
      localStorage.setItem('weather-search-history', JSON.stringify(searchHistory.slice(0, 100)));
      
      // Kullanıcıyı rahatsız etmeyen başarı bildirimi
      toast.success(t.messages.citySearchSuccess, {
        description: `${data.name}: ${temp}°C, ${translateWeatherCondition(condition, language)}`,
        duration: 3000,
        position: 'bottom-right',
      })
      
      // Weather theme'ini uygula
      applyWeatherTheme(data.weather[0].main.toLowerCase(), temp)
      
    } catch (err: any) {
      console.error('Weather search error:', err);
      setError(t.weather.cityNotFound);
      setWeatherData(null);
      
      // Başarısız aramayı da kaydet
      const searchHistory = JSON.parse(localStorage.getItem('weather-search-history') || '[]');
      searchHistory.unshift({
        city: searchCity,
        timestamp: new Date().toISOString(),
        success: false
      });
      localStorage.setItem('weather-search-history', JSON.stringify(searchHistory.slice(0, 100)));
      
      toast.error(t.messages.error, {
        description: t.weather.cityNotFound,
        duration: 4000,
        position: 'bottom-right',
      });
    }
  }

  // Sayfa render fonksiyonu
  const renderPage = () => {
    switch (currentPage) {
      case 'explorer':
        return <WeatherExplorerWithErrorBoundary />;
      case 'profile':
        return <Profile />;
      case 'settings':
        return <Settings />;
      case 'about':
        return <About />;
      case 'system':
        return <SystemResources />;
      case 'zentaira':
        return <Zentaira />;
      case 'bugreport':
        return <BugReport />;
      case 'updates':
        return <Updates />;
      default:
        return (
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Favorite Cities */}
            <FavoriteCities onSelectCity={(city) => setSearchCity(city)} />
            <header className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
                {t.app.title}
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-white/80">
                {t.app.welcome}, Guest!
              </p>
            </header>

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

            {error && (
              <div className="max-w-md mx-auto mb-6">
                <div className="glass-effect rounded-lg p-4 text-red-200 text-center">
                  {error}
                </div>
              </div>
            )}

            {weatherData && (
              <div className="max-w-md mx-auto">
                <div className="glass-effect rounded-2xl p-8 text-white">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-semibold mb-2">{weatherData.name}</h2>
                    <div className="text-5xl font-bold mb-4">
                      {Math.round(weatherData.main.temp)}°C
                    </div>
                    <div className="text-lg mb-4">
                      {translateWeatherCondition(weatherData.weather[0].description, language)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <Wind className="w-5 h-5 mr-2" />
                      <span className="text-sm">
                        {t.weather.wind}: {weatherData.wind.speed} km/h
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Droplets className="w-5 h-5 mr-2" />
                      <span className="text-sm">
                        {t.weather.humidity}: {weatherData.main.humidity}%
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Eye className="w-5 h-5 mr-2" />
                      <span className="text-sm">
                        {t.weather.visibility}: {weatherData.visibility / 1000} km
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm">
                        {t.weather.feelsLike}: {Math.round(weatherData.main.feels_like)}°C
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen weather-gradient">
      {/* Sidebar */}
      <AppSidebar 
        currentPage={currentPage} 
        onPageChange={setCurrentPage} 
      />
      
      {/* Main Content */}
      <div className="flex-1 min-h-screen backdrop-blur-sm bg-black/10">
        {renderPage()}
      </div>
    </div>
  );
}

// Export with ErrorBoundary
export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};
