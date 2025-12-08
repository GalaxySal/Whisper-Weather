import { Info, Code, Globe, Monitor, Github, Cpu } from 'lucide-react'
import { useLanguage } from '@/hooks/use-language'
import { translations } from '@/lib/translations'
import { useTauri } from '@/hooks/use-tauri'
import { useState, useEffect } from 'react'

export default function About() {
  const { language } = useLanguage()
  const t = translations[language]
  const { getSystemInfo } = useTauri()
  const [systemInfo, setSystemInfo] = useState<string | null>(null)

  useEffect(() => {
    const loadSystemInfo = async () => {
      const info = await getSystemInfo()
      if (info) {
        // Temiz ve kullanıcı dostu format
        const infoObj = info as any
        const cleanInfo = {
          platform: infoObj.platform || 'Bilinmeyen',
          desktop: infoObj.desktop || 'Bilinmeyen',
          kernel: infoObj.kernel || 'Bilinmeyen',
          locale: infoObj.locale || 'Bilinmeyen',
          theme: infoObj.theme ? infoObj.theme.replace(/['"]/g, '') : 'Bilinmeyen',
          arch: infoObj.arch || 'Bilinmeyen',
          online: infoObj.online || false
        }
        setSystemInfo(JSON.stringify(cleanInfo, null, 2))
      }
    }
    loadSystemInfo()
  }, [getSystemInfo])

  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass-effect rounded-2xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Info className="w-6 h-6 mr-2" />
          {t.about.title}
        </h2>
        
        <div className="space-y-6">
          {/* Açıklama */}
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">{t.about.description}</h3>
            <p className="text-white/80">
              Modern, hızlı ve kullanıcı dostu hava durumu uygulaması.
            </p>
          </div>

          {/* Teknolojiler */}
          <div>
            <h4 className="text-lg font-semibold mb-4 flex items-center">
              <Code className="w-5 h-5 mr-2" />
              {t.about.technologies}
            </h4>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Web Sürümü */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <div className="flex items-center mb-3">
                  <Globe className="w-5 h-5 mr-2" />
                  <h5 className="font-semibold">{t.about.webVersion}</h5>
                </div>
                <p className="text-sm text-white/80 mb-2">
                  Tarayıcıda çalışan modern web uygulaması
                </p>
                <div className="bg-black/20 rounded-lg p-3">
                  <code className="text-xs text-green-300">
                    {t.about.webTech}
                  </code>
                </div>
              </div>

              {/* Masaüstü Sürümü */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <div className="flex items-center mb-3">
                  <Monitor className="w-5 h-5 mr-2" />
                  <h5 className="font-semibold">{t.about.desktopVersion}</h5>
                </div>
                <p className="text-sm text-white/80 mb-2">
                  Windows, macOS, Linux için masaüstü uygulaması
                </p>
                <div className="bg-black/20 rounded-lg p-3">
                  <code className="text-xs text-blue-300">
                    {t.about.desktopTech}
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Sistem Bilgisi */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h5 className="font-semibold flex items-center mb-3">
              <Cpu className="w-4 h-4 mr-2" />
              Sistem Bilgisi
            </h5>
            {systemInfo ? (
              <div className="bg-black/20 rounded-lg p-3">
                <code className="text-xs text-green-300 break-all">
                  {systemInfo}
                </code>
              </div>
            ) : (
              <div className="text-sm text-white/60">
                Sistem bilgisi yükleniyor...
              </div>
            )}
          </div>

          {/* Lisans ve Açık Kaynak */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-semibold flex items-center">
                  <Github className="w-4 h-4 mr-2" />
                  {t.about.openSource}
                </h5>
                <p className="text-sm text-white/80 mt-1">
                  {t.about.license}
                </p>
              </div>
              <a 
                href="https://github.com/your-username/whisper-weather"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors flex items-center"
              >
                <Github className="w-4 h-4 mr-2" />
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
