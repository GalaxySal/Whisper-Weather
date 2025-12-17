import { useState } from "react";
import {
  Search,
  Wind,
  Droplets,
  Eye,
  MapPin,
  Clock,
  Sunrise,
  Sunset,
  Heart,
} from "lucide-react";
import { getWeatherByCity, type WeatherData } from "../lib/api";
import { useTheme } from "../hooks/use-theme";
import { useTranslation } from "../hooks/use-translation";
import { useFavorites } from "../hooks/use-favorites";
import { apiService } from "../services/api";
import {
  searchTurkishCities,
  searchCitiesWithAPIs,
  searchTurkeyWithAPIs,
} from "../data/turkish-cities";
import { toast } from "sonner";

export default function HomePage() {
  const [searchCity, setSearchCity] = useState("");
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { getWeatherGradient } = useTheme();
  const { t, language } = useTranslation();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  const handleSearch = async () => {
    if (!searchCity.trim()) return;

    setLoading(true);
    setError("");

    try {
      const data = await getWeatherByCity(searchCity);
      setWeatherData(data);

      // Başarılı bildirim
      toast.success(
        language === "tr" ? "Hava durumu bulundu!" : "Weather found!",
        {
          description: `${data.city}: ${data.temperature}°C`,
          duration: 3000,
          position: "bottom-right",
        },
      );
    } catch (error) {
      console.error("HomePage: Error in handleSearch:", error);

      // Önce toast ile hatayı göster
      const errorMessage =
        error instanceof Error ? error.message : "Bilinmeyen hata";

      toast.error(
        language === "tr" ? "Hava durumu alınamadı" : "Weather fetch failed",
        {
          description: errorMessage,
          duration: 5000,
          position: "bottom-right",
        },
      );

      // Sonra error state'ini güncelle
      const errorMsg =
        language === "tr"
          ? `Şehir bulunamadı: ${errorMessage}. Lütfen tekrar deneyin.`
          : `City not found: ${errorMessage}. Please try again.`;
      setError(errorMsg);
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCityInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setSearchCity(value);

    if (value.length > 1) {
      try {
        let allSuggestions: string[] = [];

        // Production Tauri için API service kullan
        const isTauri =
          typeof window !== "undefined" && (window as any).__TAURI__;

        if (isTauri) {
          // Tauri environment - API service kullan
          try {
            const response = await apiService.searchCities(value);
            if (response.success && response.data) {
              allSuggestions = response.data.slice(0, 8);
            }
          } catch (apiError) {
            console.log("Tauri API failed, using local data");
          }
        } else {
          // Web environment - web API'leri kullan
          try {
            const apiResults = await searchTurkeyWithAPIs(value);

            if (apiResults.nominatim.length === 0) {
              console.log("No Turkey results, searching worldwide...");
              const worldwideResults = await searchCitiesWithAPIs(value);
              allSuggestions = [
                ...worldwideResults.nominatim
                  .map((city: any) => city.name)
                  .slice(0, 5),
              ];
            } else {
              allSuggestions = [
                ...apiResults.nominatim
                  .map((city: any) => city.name)
                  .slice(0, 5),
              ];
            }
          } catch (apiError) {
            console.log("Web APIs failed, using local data");
          }
        }

        // Her zaman local Türk şehirlerini ekle (Tauri ve Web için)
        const turkishCities = searchTurkishCities(value);
        if (allSuggestions.length === 0) {
          allSuggestions = turkishCities.slice(0, 8);
        } else {
          // API sonuçları varsa, local sonuçları ekle ama limiti koru
          const combined = [...allSuggestions, ...turkishCities];
          allSuggestions = [...new Set(combined)].slice(0, 8);
        }

        setSuggestions(allSuggestions);
        setShowSuggestions(true);
      } catch (error) {
        console.warn("Search error:", error);
        // Son çare: sadece Türk şehirlerini göster
        const turkishCities = searchTurkishCities(value);
        setSuggestions(turkishCities.slice(0, 8));
        setShowSuggestions(turkishCities.length > 0);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (city: string) => {
    setSearchCity(city);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="text-white">
      <h1 className="text-4xl font-bold mb-8 text-center">{t("appTitle")}</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="mb-8"
      >
        <div className="relative max-w-md mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchCity}
              onChange={handleCityInputChange}
              placeholder={t("searchPlaceholder")}
              className="flex-1 px-4 py-2 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Search className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* City Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-white/20 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
              {suggestions.map((city, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(city)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 text-gray-900"
                >
                  <div className="font-medium">{city}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </form>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-center">
          {t("weatherNotFound")}
        </div>
      )}

      {weatherData && (
        <div
          className={`bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 bg-gradient-to-br ${getWeatherGradient(weatherData.condition)}`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-2">
                <MapPin className="w-6 h-6" />
                {weatherData.city}
              </h2>
              <p className="text-white/70">{t("realTimeData")}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() =>
                  isFavorite(weatherData.city)
                    ? removeFavorite(weatherData.city)
                    : addFavorite(weatherData.city)
                }
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Heart
                  className={`w-5 h-5 ${isFavorite(weatherData.city) ? "fill-red-500 text-red-500" : "text-white"}`}
                />
              </button>
              <div className="text-right">
                <div className="text-sm text-white/60 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatTime(weatherData.timestamp)}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Main Weather */}
            <div className="text-center">
              <div className="text-6xl font-bold mb-2">
                {Math.round(weatherData.temperature)}°C
              </div>
              <div className="text-xl capitalize mb-2">
                {weatherData.condition}
              </div>
              <div className="text-white/70">
                {t("feelsLike")} {Math.round(weatherData.feels_like)}
                {t("celsius")}
              </div>
            </div>

            {/* Weather Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <Wind className="w-5 h-5" />
                  <span>{t("wind")}</span>
                </div>
                <div className="text-right">
                  <div>{weatherData.wind_speed.toFixed(1)} m/s</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5" />
                  <span>{t("humidity")}</span>
                </div>
                <span>{weatherData.humidity}%</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  <span>{t("visibility")}</span>
                </div>
                <span>{(weatherData.visibility / 1000).toFixed(1)} km</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <Sunrise className="w-5 h-5" />
                  <span>{t("sunrise")}</span>
                </div>
                <span>{formatTime(weatherData.sunrise)}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <Sunset className="w-5 h-5" />
                  <span>{t("sunset")}</span>
                </div>
                <span>{formatTime(weatherData.sunset)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
