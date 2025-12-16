import { Heart } from 'lucide-react'
import { useFavorites } from '../hooks/use-favorites'

interface FavoriteButtonProps {
  city: string
  className?: string
}

export default function FavoriteButton({ city, className }: FavoriteButtonProps) {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites()

  const toggleFavorite = () => {
    if (isFavorite(city)) {
      removeFavorite(city)
    } else {
      addFavorite(city)
    }
  }

  return (
    <button
      onClick={toggleFavorite}
      className={`p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors ${className || ''}`}
    >
      <Heart 
        className={`w-5 h-5 transition-colors ${
          isFavorite(city) 
            ? 'fill-red-500 text-red-500' 
            : 'text-white/60 hover:text-red-500'
        }`} 
      />
    </button>
  )
}
