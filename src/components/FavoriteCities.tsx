import { MapPin, X } from "lucide-react";
import { useFavorites } from "../hooks/use-favorites";

export default function FavoriteCities({
  onSelectCity,
}: {
  onSelectCity: (city: string) => void;
}) {
  const { favorites, removeFavorite } = useFavorites();

  if (favorites.length === 0) return null;

  return (
    <div className="max-w-lg mx-auto mb-6">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-white border border-white/20">
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <MapPin className="w-4 h-4 mr-2" />
          Favorite Cities
        </h3>
        <div className="flex flex-wrap gap-2">
          {favorites.map((city) => (
            <div
              key={city}
              className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-colors cursor-pointer group"
              onClick={() => onSelectCity(city)}
            >
              <span className="text-sm">{city}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFavorite(city);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 hover:text-red-400" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
