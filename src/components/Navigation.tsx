import { Moon, Sun, Monitor, Cloud, Languages, Heart, LogOut, Info } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'
import { useLanguage } from '@/hooks/use-language'
import { useFavorites } from '@/hooks/use-favorites'
import { supabase } from '@/lib/supabase'
import { translations } from '@/lib/translations'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarTrigger,
} from '@/components/ui/menubar'

interface NavigationProps {
  user: any
  onPageChange: (page: string) => void
}

export default function Navigation({ user, onPageChange }: NavigationProps) {
  const { theme, setTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const { favorites } = useFavorites()
  const t = translations[language]

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <Menubar className="glass-effect border-white/20 bg-white/10">
      <MenubarMenu>
        <MenubarTrigger className="text-white hover:bg-white/20">
          {user.email}
        </MenubarTrigger>
        <MenubarContent className="glass-effect border-white/20 bg-white/10">
          <MenubarItem className="text-white hover:bg-white/20">
            <Heart className="mr-2 h-4 w-4" />
            {t.settings.favorites} ({favorites.length})
          </MenubarItem>
          <MenubarSeparator className="bg-white/20" />
          <MenubarItem 
            className="text-white hover:bg-white/20 cursor-pointer"
            onClick={() => onPageChange('about')}
          >
            <Info className="mr-2 h-4 w-4" />
            {t.about.title}
          </MenubarItem>
          <MenubarSeparator className="bg-white/20" />
          <MenubarItem 
            className="text-white hover:bg-white/20 cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t.navigation.logout}
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-white hover:bg-white/20">
          {t.navigation.theme}
        </MenubarTrigger>
        <MenubarContent className="glass-effect border-white/20 bg-white/10">
          <MenubarRadioGroup value={theme}>
            <MenubarRadioItem 
              value="light" 
              className="text-white hover:bg-white/20"
              onClick={() => setTheme('light')}
            >
              <Sun className="mr-2 h-4 w-4" />
              {t.settings.light}
            </MenubarRadioItem>
            <MenubarRadioItem 
              value="dark" 
              className="text-white hover:bg-white/20"
              onClick={() => setTheme('dark')}
            >
              <Moon className="mr-2 h-4 w-4" />
              {t.settings.dark}
            </MenubarRadioItem>
            <MenubarRadioItem 
              value="system" 
              className="text-white hover:bg-white/20"
              onClick={() => setTheme('system')}
            >
              <Monitor className="mr-2 h-4 w-4" />
              {t.settings.system}
            </MenubarRadioItem>
            <MenubarRadioItem 
              value="weather" 
              className="text-white hover:bg-white/20"
              onClick={() => setTheme('weather')}
            >
              <Cloud className="mr-2 h-4 w-4" />
              {t.settings.weather}
            </MenubarRadioItem>
          </MenubarRadioGroup>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-white hover:bg-white/20">
          <Languages className="mr-2 h-4 w-4" />
          {t.navigation.language}
        </MenubarTrigger>
        <MenubarContent className="glass-effect border-white/20 bg-white/10">
          <MenubarRadioGroup value={language}>
            <MenubarRadioItem 
              value="tr" 
              className="text-white hover:bg-white/20"
              onClick={() => setLanguage('tr')}
            >
              {t.settings.turkish}
            </MenubarRadioItem>
            <MenubarRadioItem 
              value="en" 
              className="text-white hover:bg-white/20"
              onClick={() => setLanguage('en')}
            >
              {t.settings.english}
            </MenubarRadioItem>
          </MenubarRadioGroup>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
}
