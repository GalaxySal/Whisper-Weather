import { Heart } from 'lucide-react'
import { useFavorites } from '@/hooks/use-favorites'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface FavoriteButtonProps {
  city: string
}

export default function FavoriteButton({ city }: FavoriteButtonProps) {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites()

  const toggleFavorite = () => {
    if (isFavorite(city)) {
      removeFavorite(city)
      toast.error(`${city} favorilerden kaldırıldı`)
    } else {
      addFavorite(city)
      toast.success(`${city} favorilere eklendi`)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleFavorite}
      className="absolute right-2 top-1/2 transform -translate-y-1/2"
    >
      <Heart 
        className={`w-5 h-5 transition-colors ${
          isFavorite(city) 
            ? 'fill-red-500 text-red-500' 
            : 'text-white/60 hover:text-red-500'
        }`} 
      />
    </Button>
  )
}
