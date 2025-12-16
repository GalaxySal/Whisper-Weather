"use client"

import * as React from "react"
import { Home, User, Settings, LogOut, Search, Sun, Moon, Monitor, Cloud, Languages, Heart } from "lucide-react"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command"
import { useLanguage } from '@/hooks/use-language'
import { useTheme } from '@/hooks/use-theme'
import { useFavorites } from '@/hooks/use-favorites'
import { translations } from '@/lib/translations'
import { supabase } from '@/lib/supabase'

interface CommandMenuProps {
  onPageChange: (page: string) => void
  onCitySearch: (city: string) => void
}

export function CommandMenu({ onPageChange, onCitySearch }: CommandMenuProps) {
  const [open, setOpen] = React.useState(false)
  const { language } = useLanguage()
  const { theme, setTheme } = useTheme()
  const { favorites } = useFavorites()
  const t = translations[language]

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || 
          (e.key === " " && e.ctrlKey && !e.metaKey && !e.altKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleNavigation = (page: string) => {
    onPageChange(page)
    setOpen(false)
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as any)
    setOpen(false)
  }

  const { setLanguage } = useLanguage()

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage as 'tr' | 'en')
    setOpen(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setOpen(false)
  }

  const handleCitySelect = (city: string) => {
    onCitySearch(city)
    setOpen(false)
  }

  const popularCities = [
    { name: 'Istanbul', country: 'Turkey' },
    { name: 'Ankara', country: 'Turkey' },
    { name: 'Izmir', country: 'Turkey' },
    { name: 'London', country: 'UK' },
    { name: 'New York', country: 'USA' },
    { name: 'Paris', country: 'France' },
    { name: 'Tokyo', country: 'Japan' },
    { name: 'Berlin', country: 'Germany' }
  ]

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={t.command.searchPlaceholder} />
      <CommandList>
        <CommandEmpty>
          {t.command.noResults}
        </CommandEmpty>
        
        <CommandGroup heading={t.command.navigation}>
          <CommandItem onSelect={() => handleNavigation('home')}>
            <Home className="mr-2 h-4 w-4" />
            <span>{t.navigation.home}</span>
            <CommandShortcut>⌘H</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigation('profile')}>
            <User className="mr-2 h-4 w-4" />
            <span>{t.navigation.profile}</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigation('settings')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>{t.navigation.settings}</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t.command.theme}>
          <CommandItem onSelect={() => handleThemeChange('light')} disabled={theme === 'light'}>
            <Sun className="mr-2 h-4 w-4" />
            <span>{t.settings.light}</span>
            {theme === 'light' && <span className="ml-auto text-xs text-green-500">✓</span>}
          </CommandItem>
          <CommandItem onSelect={() => handleThemeChange('dark')} disabled={theme === 'dark'}>
            <Moon className="mr-2 h-4 w-4" />
            <span>{t.settings.dark}</span>
            {theme === 'dark' && <span className="ml-auto text-xs text-green-500">✓</span>}
          </CommandItem>
          <CommandItem onSelect={() => handleThemeChange('system')} disabled={theme === 'system'}>
            <Monitor className="mr-2 h-4 w-4" />
            <span>{t.settings.system}</span>
            {theme === 'system' && <span className="ml-auto text-xs text-green-500">✓</span>}
          </CommandItem>
          <CommandItem onSelect={() => handleThemeChange('weather')} disabled={theme === 'weather'}>
            <Cloud className="mr-2 h-4 w-4" />
            <span>{t.settings.weather}</span>
            {theme === 'weather' && <span className="ml-auto text-xs text-green-500">✓</span>}
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t.command.language}>
          <CommandItem onSelect={() => handleLanguageChange('tr')} disabled={language === 'tr'}>
            <Languages className="mr-2 h-4 w-4" />
            <span>{t.settings.turkish}</span>
            {language === 'tr' && <span className="ml-auto text-xs text-green-500">✓</span>}
          </CommandItem>
          <CommandItem onSelect={() => handleLanguageChange('en')} disabled={language === 'en'}>
            <Languages className="mr-2 h-4 w-4" />
            <span>{t.settings.english}</span>
            {language === 'en' && <span className="ml-auto text-xs text-green-500">✓</span>}
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t.command.popularCities}>
          {popularCities.map((city) => (
            <CommandItem key={city.name} onSelect={() => handleCitySelect(city.name)}>
              <Search className="mr-2 h-4 w-4" />
              <span>{city.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">{city.country}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {favorites.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={t.command.favoriteCities}>
              {favorites.map((city, index) => (
                <CommandItem key={`${city}-${index}`} onSelect={() => handleCitySelect(city)}>
                  <Heart className="mr-2 h-4 w-4" />
                  <span>{city}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />

        <CommandGroup heading={t.command.system}>
          <CommandItem onSelect={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>{t.navigation.logout}</span>
            <CommandShortcut>⌘Q</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
