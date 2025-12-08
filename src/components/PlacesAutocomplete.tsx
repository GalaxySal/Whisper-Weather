import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useTauri } from '@/hooks/use-tauri'

interface PlaceAutocompleteProps {
  onPlaceSelect: (place: string) => void
  placeholder?: string
  className?: string
}

export default function PlacesAutocomplete({ onPlaceSelect, placeholder = 'Şehir ara...', className = '' }: PlaceAutocompleteProps) {
  const [inputValue, setInputValue] = useState('')
  const [predictions, setPredictions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showPredictions, setShowPredictions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { searchCities } = useTauri()

  const fetchPredictions = async (input: string) => {
    if (!input.trim()) {
      setPredictions([])
      setShowPredictions(false)
      return
    }

    setIsLoading(true)
    try {
      const cities = await searchCities(input.trim())
      const citiesArray = Array.isArray(cities) ? cities : []
      setPredictions(citiesArray.slice(0, 10))
      setShowPredictions(true)
    } catch (error) {
      console.error('Error fetching predictions:', error)
      setPredictions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    if (value.length > 2) {
      fetchPredictions(value)
    } else {
      setPredictions([])
      setShowPredictions(false)
    }
  }

  const handlePredictionClick = (prediction: string) => {
    console.log('Prediction clicked:', prediction)
    setInputValue(prediction)
    setShowPredictions(false)
    console.log('Calling onPlaceSelect with:', prediction)
    onPlaceSelect(prediction)
  }

  const handleClear = () => {
    setInputValue('')
    setPredictions([])
    setShowPredictions(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowPredictions(false)
    }
  }

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const autocompleteElement = inputRef.current?.parentElement?.parentElement
      
      if (autocompleteElement && !autocompleteElement.contains(target)) {
        setShowPredictions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debug için
  console.log('PlacesAutocomplete state:', {
    inputValue,
    showPredictions,
    predictionsLength: predictions.length,
    isLoading
  })

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
        {inputValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showPredictions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-white/20 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-600">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : predictions.length > 0 ? (
            predictions.map((prediction, index) => (
              <button
                key={index}
                onClick={(e) => {
                  console.log('Dropdown button clicked:', prediction)
                  e.preventDefault()
                  e.stopPropagation()
                  handlePredictionClick(prediction)
                }}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="text-gray-900 font-medium">{prediction}</div>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              Şehir bulunamadı
            </div>
          )}
        </div>
      )}
    </div>
  )
}
