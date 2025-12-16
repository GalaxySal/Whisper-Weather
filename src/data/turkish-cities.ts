// Türkiye'nin tüm illeri
export const TURKISH_CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin",
  "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa",
  "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan",
  "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkâri", "Hatay", "Iğdır",
  "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu",
  "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir", "Kilis", "Kocaeli", "Konya", "Kütahya",
  "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde",
  "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas",
  "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van",
  "Yalova", "Yozgat", "Zonguldak"
]

// Büyük şehirler ve ilçeler
export const MAJOR_CITIES = [
  "İstanbul", "Ankara", "İzmir", "Bursa", "Adana", "Gaziantep", "Konya", "Kocaeli",
  "Antalya", "Şanlıurfa", "Diyarbakır", "Mersin", "Kayseri", "Eskişehir", "Samsun", "Denizli",
  "Malatya", "Trabzon", "Van", "Erzurum", "Elazığ", "Manisa", "Balıkesir", "Kahramanmaraş",
  "Sakarya", "Aydın", "Hatay", "Tekirdağ", "İzmit", "Muğla", "Ordu"
]

// Türkiye'deki popüler turistik şehirler
export const TOURISTIC_CITIES = [
  "İstanbul", "Ankara", "İzmir", "Antalya", "Muğla", "Bodrum", "Marmaris", "Fethiye",
  "Kapadokya", "Nevşehir", "Uçhisar", "Göreme", "Cappadocia", "Pamukkale", "Denizli",
  "Efes", "Selçuk", "İzmir", "Bodrum", "Marmaris", "Fethiye", "Kaş", "Kalkan",
  "Alanya", "Side", "Belek", "Kemer", "Antalya", "Trabzon", "Rize", "Artvin",
  "Karadeniz", "Black Sea", "Uzungöl", "Ayder", "Borçka", "Maçka"
]

// Nominatim API için şehir koordinatları
export interface CityCoordinates {
  name: string
  lat: number
  lon: number
  country: string
  state?: string
}

// Nominatim API entegrasyonu - Dünya genelinde arama
export async function searchNominatim(query: string): Promise<CityCoordinates[]> {
  if (!query || query.length < 2) return []
  
  try {
    // Türkçe karakterleri normalize et (ğ → g, ş → s, ç → c, ı → i, ö → o, ü → u)
    const normalizedQuery = query
      .replace(/ğ/g, 'g')
      .replace(/Ğ/g, 'G')
      .replace(/ç/g, 'c')
      .replace(/Ç/g, 'C')
      .replace(/ğ/g, 'g')
      .replace(/Ğ/g, 'G')
      .replace(/ş/g, 's')
      .replace(/Ş/g, 'S')
      .replace(/ı/g, 'i')
      .replace(/İ/g, 'I')
      .replace(/ö/g, 'o')
      .replace(/Ö/g, 'O')
      .replace(/ü/g, 'u')
      .replace(/Ü/g, 'U')
    
    // CORS ve rate limiting sorunları için timeout ve abort controller
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 saniye timeout
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(normalizedQuery)}&limit=10`,
      {
        headers: {
          'User-Agent': 'Whisper-Weather-App/1.0'
        },
        signal: controller.signal
      }
    )
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      // Hata durumunda sessizce fallback yap
      console.warn('Nominatim worldwide API failed silently, using fallback')
      return []
    }
    
    const data = await response.json()
    
    return data.map((item: any) => ({
      name: item.display_name.split(',')[0],
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      country: item.address?.country || 'Unknown',
      state: item.address?.state || item.address?.state_district
    }))
  } catch (error) {
    // CORS ve diğer hataları sessize al
    console.warn('Nominatim worldwide API error silenced:', error)
    return []
  }
}

// Nominatim API için Türkiye odaklı arama
export async function searchNominatimTurkey(query: string): Promise<CityCoordinates[]> {
  try {
    // Türkçe karakterleri normalize et (Nominatim UTF-8 destekliyor ama bazen sorun çıkıyor)
    const normalizedQuery = query
      .replace(/ç/g, 'c')
      .replace(/Ç/g, 'C')
      .replace(/ğ/g, 'g')
      .replace(/Ğ/g, 'G')
      .replace(/ş/g, 's')
      .replace(/Ş/g, 'S')
      .replace(/ı/g, 'i')
      .replace(/İ/g, 'I')
      .replace(/ö/g, 'o')
      .replace(/Ö/g, 'O')
      .replace(/ü/g, 'u')
      .replace(/Ü/g, 'U')
    
    // CORS ve rate limiting sorunları için proxy kullan veya isteği sessize al
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 saniye timeout
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(normalizedQuery)}&countrycodes=tr&limit=10`,
      {
        headers: {
          'User-Agent': 'Whisper-Weather-App/1.0'
        },
        signal: controller.signal
      }
    )
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      // Hata durumunda sessizce fallback yap
      console.warn('Nominatim API failed silently, using fallback')
      return []
    }
    
    const data = await response.json()
    
    return data.map((item: any) => ({
      name: item.display_name.split(',')[0],
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      country: item.address?.country || 'Turkey',
      state: item.address?.state || item.address?.state_district
    }))
  } catch (error) {
    // CORS ve diğer hataları sessize al
    console.warn('Nominatim API error silenced:', error)
    return []
  }
}

// OpenWeatherMap API için koordinat bazlı arama
export async function searchOpenWeatherMap(lat: number, lon: number): Promise<any> {
  try {
    const API_KEY = import.meta.env.VITE_OPENWEATHERMAP_API_KEY
    
    // CORS ve rate limiting sorunları için timeout ve abort controller
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 saniye timeout
    
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`,
      {
        signal: controller.signal
      }
    )
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      // Hata durumunda sessizce fallback yap
      console.warn('OpenWeatherMap API failed silently, using fallback')
      return null
    }
    
    return await response.json()
  } catch (error) {
    // CORS ve diğer hataları sessize al
    console.warn('OpenWeatherMap API error silenced:', error)
    return null
  }
}

// Birleşik arama fonksiyonu - Dünya genelinde
export async function searchCitiesWithAPIs(query: string): Promise<{
  local: string[]
  nominatim: CityCoordinates[]
  weather: any[]
}> {
  const [localResults, nominatimResults] = await Promise.all([
    Promise.resolve(searchTurkishCities(query)),
    searchNominatim(query) // Dünya genelinde arama
  ])
  
  // Nominatim sonuçları için hava durumu bilgisi getir
  const weatherResults = await Promise.all(
    nominatimResults.slice(0, 3).map(city => 
      searchOpenWeatherMap(city.lat, city.lon)
    )
  )
  
  return {
    local: localResults,
    nominatim: nominatimResults,
    weather: weatherResults.filter(Boolean)
  }
}

// Birleşik arama fonksiyonu - Sadece Türkiye için
export async function searchTurkeyWithAPIs(query: string): Promise<{
  local: string[]
  nominatim: CityCoordinates[]
  weather: any[]
}> {
  const [localResults, nominatimResults] = await Promise.all([
    Promise.resolve(searchTurkishCities(query)),
    searchNominatimTurkey(query) // Sadece Türkiye
  ])
  
  // Nominatim sonuçları için hava durumu bilgisi getir
  const weatherResults = await Promise.all(
    nominatimResults.slice(0, 3).map(city => 
      searchOpenWeatherMap(city.lat, city.lon)
    )
  )
  
  return {
    local: localResults,
    nominatim: nominatimResults,
    weather: weatherResults.filter(Boolean)
  }
}

// Şehir arama fonksiyonu (orijinal)
export function searchTurkishCities(query: string): string[] {
  if (!query || query.length < 2) return []
  
  const lowerQuery = query.toLowerCase()
  const allCities = [...new Set([...TURKISH_CITIES, ...MAJOR_CITIES, ...TOURISTIC_CITIES])]
  
  return allCities
    .filter(city => city.toLowerCase().includes(lowerQuery))
    .slice(0, 10) // En fazla 10 sonuç
    .sort((a, b) => {
      // Tam eşleşenleri önce getir
      const aExact = a.toLowerCase() === lowerQuery
      const bExact = b.toLowerCase() === lowerQuery
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      
      // Başlangıçta eşleşenleri önce getir
      const aStart = a.toLowerCase().startsWith(lowerQuery)
      const bStart = b.toLowerCase().startsWith(lowerQuery)
      if (aStart && !bStart) return -1
      if (!aStart && bStart) return 1
      
      // Alfabetik sıralama
      return a.localeCompare(b, 'tr')
    })
}
