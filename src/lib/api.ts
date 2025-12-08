// Web API functions for production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.whisperweather.com'

export const searchCitiesWeb = async (query: string): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/search-cities?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data.cities || []
  } catch (error) {
    console.error('Web API search error:', error)
    // Fallback to Turkish cities
    const turkishCities = [
      "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin",
      "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur",
      "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan",
      "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul",
      "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir",
      "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş",
      "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Şanlıurfa", "Siirt", "Sinop",
      "Sivas", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat",
      "Zonguldak"
    ].filter(city => 
      city.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10)
    return turkishCities
  }
}

export const getWeatherWeb = async (city: string) => {
  try {
    const apiKey = import.meta.env.VITE_OPENWEATHERMAP_API_KEY
    if (!apiKey) {
      throw new Error('OpenWeatherMap API key not found')
    }
    
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=tr`
    )
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Weather API error:', error)
    throw error
  }
}
