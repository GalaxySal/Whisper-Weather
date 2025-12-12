import { Moon, Sun, Monitor, Cloud, Languages, Home, User, Settings, Info, Cpu, Globe, Bug, BarChart3, Zap } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'
import { useLanguage } from '@/hooks/use-language'
import { translations } from '@/lib/translations'
import { TunnelStatus } from '@/components/TunnelStatus'
import { isTauri } from '@/lib/platform'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarProvider,
} from '@/components/ui/sidebar'

interface AppSidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
}

export default function AppSidebar({ currentPage, onPageChange }: AppSidebarProps) {
  const { theme, setTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const t = translations[language]

  console.log('AppSidebar rendering, isTauri:', isTauri());

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Home className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {t.navigation.home}
                </span>
                <span className="truncate text-xs">Whisper Weather</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarTrigger className="p-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t.navigation.home}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={currentPage === 'home'}
                  onClick={() => onPageChange('home')}
                >
                  <Home />
                  <span>{t.navigation.home}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={currentPage === 'profile'}
                  onClick={() => onPageChange('profile')}
                >
                  <User />
                  <span>{t.navigation.profile}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={currentPage === 'settings'}
                  onClick={() => onPageChange('settings')}
                >
                  <Settings />
                  <span>{t.navigation.settings}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={currentPage === 'about'}
                  onClick={() => onPageChange('about')}
                >
                  <Info />
                  <span>{t.about.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={currentPage === 'system'}
                  onClick={() => onPageChange('system')}
                >
                  <Cpu />
                  <span>{t.command.systemResources}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={currentPage === 'zentaira'}
                  onClick={() => onPageChange('zentaira')}
                >
                  <Globe />
                  <span>Zentaira</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={currentPage === 'explorer'}
                  onClick={() => onPageChange('explorer')}
                >
                  <BarChart3 />
                  <span>Weather Explorer</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={currentPage === 'bugreport'}
                  onClick={() => onPageChange('bugreport')}
                >
                  <Bug />
                  <span>{t.command.bugReport}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={currentPage === 'updates'}
                  onClick={() => onPageChange('updates')}
                >
                  <Zap />
                  <span>Updates</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t.navigation.theme}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={theme === 'light'}
                  onClick={() => setTheme('light')}
                >
                  <Sun />
                  <span>{t.settings.light}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={theme === 'dark'}
                  onClick={() => setTheme('dark')}
                >
                  <Moon />
                  <span>{t.settings.dark}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={theme === 'system'}
                  onClick={() => setTheme('system')}
                >
                  <Monitor />
                  <span>{t.settings.system}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={theme === 'weather'}
                  onClick={() => setTheme('weather')}
                >
                  <Cloud />
                  <span>{t.settings.weather}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t.navigation.language}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={language === 'tr'}
                  onClick={() => setLanguage('tr')}
                >
                  <Languages />
                  <span>{t.settings.turkish}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={language === 'en'}
                  onClick={() => setLanguage('en')}
                >
                  <Languages />
                  <span>{t.settings.english}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {/* {isTauri() && ( */}
            <SidebarMenuItem>
              <div className="px-2 py-1">
                <TunnelStatus />
              </div>
            </SidebarMenuItem>
          {/* )} */}
        </SidebarMenu>
      </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  )
}
