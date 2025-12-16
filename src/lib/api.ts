// Weather API integration with Rust backend
import { invoke } from '@tauri-apps/api/core'

export interface WeatherData {
  city: string
  temperature: number
  condition: string
  humidity: number
  wind_speed: number
  feels_like: number
  pressure: number
  visibility: number
  uv_index: number
  sunrise: number
  sunset: number
  timestamp: number
}

export interface WeatherRequest {
  city: string
  units?: string // metric, imperial, kelvin
}

// OpenWeatherMap API key - Env dosyasından oku
const OPENWEATHERMAP_API_KEY = import.meta.env.VITE_OPENWEATHERMAP_API_KEY

export async function getWeatherByCity(city: string, units: string = 'metric'): Promise<WeatherData> {
  try {
    // Önce Tauri backend'i dene
    const request: WeatherRequest = { city, units }
    const response = await invoke<any>('get_weather', { request })
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch weather data')
    }
    
    return response.data
  } catch (error) {
    // Tauri başarısız olursa OpenWeatherMap API'sini dene
    console.warn('Tauri API failed, trying OpenWeatherMap:', error)
    
    try {
      // OpenWeatherMap API ile doğrudan veri çek
      const geoResponse = await fetch(
        `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${OPENWEATHERMAP_API_KEY}`
      )
      
      if (!geoResponse.ok) throw new Error('Geocoding failed')
      const geoData = await geoResponse.json()
      
      if (geoData.length === 0) throw new Error('City not found')
      
      const { lat, lon } = geoData[0]
      
      // Hava durumu verisini çek
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}&units=${units}`
      )
      
      if (!weatherResponse.ok) throw new Error('Weather API failed')
      const weatherData = await weatherResponse.json()
      
      return {
        city: weatherData.name,
        temperature: Math.round(weatherData.main.temp),
        condition: weatherData.weather[0].main,
        humidity: weatherData.main.humidity,
        wind_speed: weatherData.wind.speed,
        feels_like: Math.round(weatherData.main.feels_like),
        pressure: weatherData.main.pressure,
        visibility: weatherData.visibility || 10000,
        uv_index: 0, // OpenWeatherMap free plan'de UV index yok
        sunrise: weatherData.sys.sunrise,
        sunset: weatherData.sys.sunset,
        timestamp: Math.floor(Date.now() / 1000)
      }
    } catch (apiError) {
      console.warn('OpenWeatherMap API failed, using mock data:', apiError)
      // Son çare: mock data
      return {
        city,
        temperature: Math.floor(Math.random() * 30) + 10,
        condition: ['Clear', 'Clouds', 'Rain'][Math.floor(Math.random() * 3)],
        humidity: Math.floor(Math.random() * 40) + 40,
        wind_speed: Math.random() * 10 + 1,
        feels_like: Math.floor(Math.random() * 30) + 10,
        pressure: Math.floor(Math.random() * 50) + 980,
        visibility: 10000,
        uv_index: Math.floor(Math.random() * 10) + 1,
        sunrise: Math.floor(Date.now() / 1000) - 3600,
        sunset: Math.floor(Date.now() / 1000) + 3600,
        timestamp: Math.floor(Date.now() / 1000)
      }
    }
  }
}

export async function searchCitiesWeb(query: string): Promise<string[]> {
  try {
    const response = await invoke<any>('search_weather_cities', { query })
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to search cities')
    }
    
    return response.data
  } catch (error) {
    // Fallback cities for web environment
    const turkishCities = [
      'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Adana', 'Gaziantep',
      'Konya', 'Antalya', 'Diyarbakır', 'Mersin', 'Kayseri', 'Eskişehir'
    ]
    return turkishCities.filter(city => 
      city.toLowerCase().includes(query.toLowerCase())
    )
  }
}
