import { useState, useEffect, useCallback } from 'react'
import { useTauri } from './use-tauri'

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([])
  const { saveFavoriteCities, loadFavoriteCities } = useTauri()

  // İlk yükleme - Tauri backend'den yükle
  const loadFavorites = useCallback(async () => {
    try {
      const cities = await loadFavoriteCities()
      setFavorites(cities)
    } catch (error) {
      console.error('Error loading favorites from Tauri:', error)
    }
  }, [loadFavoriteCities])

  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  // Sadece favorites değiştiğinde Tauri backend'e kaydet
  useEffect(() => {
    if (favorites.length > 0) {
      saveFavoriteCities(favorites)
    }
  }, [favorites, saveFavoriteCities])

  const addFavorite = (city: string) => {
    setFavorites(prev => {
      if (!prev.includes(city)) {
        const newFavorites = [...prev, city]
        return newFavorites
      }
      return prev
    })
  }

  const removeFavorite = (city: string) => {
    setFavorites(prev => prev.filter(f => f !== city))
  }

  const isFavorite = (city: string) => favorites.includes(city)

  return { favorites, addFavorite, removeFavorite, isFavorite }
}
