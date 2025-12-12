import { useState, useEffect, useRef } from 'react'
import { Download, CheckCircle, AlertCircle, RefreshCw, ExternalLink, Zap } from 'lucide-react'
import { useLanguage } from '@/hooks/use-language'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { MotionItem } from '@/components/ui/motion'
import { useTauri } from '@/hooks/use-tauri'

interface ReleaseInfo {
  tag_name: string
  name: string
  body: string
  published_at: string
  html_url: string
  assets: Array<{
    name: string
    browser_download_url: string
    size: number
  }>
}

export default function Updates() {
  const { language } = useLanguage()
  const { isTauri } = useTauri()
  
  const [currentVersion, setCurrentVersion] = useState('1.0.3')
  const [latestRelease, setLatestRelease] = useState<ReleaseInfo | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Mevcut version'u al
  useEffect(() => {
    if (isTauri) {
      // Tauri için sabit version
      setCurrentVersion('1.0.3')
    } else {
      // Web için sabit version
      setCurrentVersion('1.0.3')
    }

    // Son kontrol zamanını al
    const lastCheck = localStorage.getItem('last-update-check')
    if (lastCheck) {
      setLastChecked(new Date(lastCheck))
    }
  }, [isTauri])

  // Güncelleme kontrolü
  const checkForUpdates = async () => {
    setIsChecking(true)
    
    try {
      // GitHub releases'ı çek
      const response = await fetch('https://api.github.com/repos/GalaxySal/Whisper-Weather/releases')
      const releases = await response.json()
      
      // En son release'ı bul (pre-release ve dev değilse)
      const latestRelease = releases.find((release: any) => {
        // Pre-release'leri atla
        if (release.prerelease) return false
        
        // Dev release'larını atla
        if (release.tag_name.includes('dev') || release.name.includes('dev')) return false
        
        // Geçerli semantik version kontrolü (v1.0.3 formatında)
        const versionPattern = /^v\d+\.\d+\.\d+$/
        return versionPattern.test(release.tag_name)
      }) || releases[0]
      
      setLatestRelease(latestRelease)
      
      // Version karşılaştırması - sadece geçerli sürümleri karşılaştır
      const current = currentVersion.replace('v', '')
      const latest = latestRelease.tag_name.replace('v', '')
      
      // Eğer latest release geçerli bir version değilse, güncelleme yok
      const isValidVersion = /^v?\d+\.\d+\.\d+$/.test(latestRelease.tag_name)
      
      console.log('Version check:', { 
        current, 
        latest, 
        available: current !== latest && isValidVersion,
        isValidVersion,
        latestTag: latestRelease.tag_name
      })
      
      if (current !== latest && isValidVersion) {
        setUpdateAvailable(true)
        
        // Sessiz bildirim (kullanıcıyı rahatsız etmeyen)
        toast.info('Yeni güncelleme mevcut!', {
          description: `Versiyon ${latestRelease.tag_name} yayınlandı`,
          duration: 5000,
          position: 'bottom-right',
          action: {
            label: 'İndir',
            onClick: () => downloadUpdate()
          }
        })
      } else {
        setUpdateAvailable(false)
        toast.success('Uygulama güncel!', {
          description: `Mevcut sürümünüz: v${current} - En son sürüm`,
          duration: 3000,
          position: 'bottom-right'
        })
      }
      
      // Kontrol zamanını kaydet
      const now = new Date()
      setLastChecked(now)
      localStorage.setItem('last-update-check', now.toISOString())
      
    } catch (error) {
      console.error('Güncelleme kontrolü başarısız:', error)
      toast.error('Güncelleme kontrolü başarısız', {
        description: 'Lütfen internet bağlantınızı kontrol edin',
        duration: 4000,
        position: 'bottom-right'
      })
    } finally {
      setIsChecking(false)
    }
  }

  // Güncelleme indir
  const downloadUpdate = async () => {
    console.log('downloadUpdate called!', { latestRelease: !!latestRelease, isDownloading })
    
    if (!latestRelease) {
      console.log('No latestRelease, returning')
      return
    }
    
    setIsDownloading(true)
    
    try {
      // Platforma uygun dosyayı bul
      const asset = latestRelease.assets.find(asset => {
        if (isTauri) {
          // Platform detection
          const platform = window.__TAURI__?.platform || 'unknown'
          
          if (platform === 'win32') {
            return asset.name.includes('.exe') || asset.name.includes('windows')
          } else if (platform === 'darwin') {
            return asset.name.includes('.dmg') || asset.name.includes('macos') || asset.name.includes('apple')
          } else if (platform === 'linux') {
            return asset.name.includes('.deb') || asset.name.includes('.rpm') || asset.name.includes('AppImage') || asset.name.includes('linux')
          }
          return false
        }
        // Web için source kodu
        return asset.name.includes('source')
      })
      
      if (!asset) {
        // Asset yoksa GitHub sayfasına yönlendir
        console.log('No asset found, opening GitHub releases page')
        window.open('https://github.com/GalaxySal/Whisper-Weather/releases', '_blank')
        
        toast.info('GitHub sayfası açıldı!', {
          description: 'Tüm sürümleri görmek için releases sayfasını ziyaret edin',
          duration: 3000,
          position: 'bottom-right'
        })
        return
      }
      
      if (isTauri) {
        // Tauri için platforma uygun dosyayı indir
        try {
          // Browser'da indirme
          const link = document.createElement('a')
          link.href = asset.browser_download_url
          link.download = asset.name
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          toast.success('İndirme başladı!', {
            description: `${asset.name} indiriliyor...`,
            duration: 3000,
            position: 'bottom-right'
          })
        } catch (error) {
          console.error('İndirme başarısız:', error)
          // Hata olursa GitHub sayfasına yönlendir
          window.open(latestRelease.html_url, '_blank')
          toast.error('İndirme başarısız!', {
            description: 'GitHub sayfası açıldı',
            duration: 3000,
            position: 'bottom-right'
          })
        }
      } else {
        // Web için indirme yapma - sadece bilgi ver
        toast.info('Web sürümü', {
          description: 'Güncellemeler için GitHub sayfasını ziyaret edin',
          duration: 3000,
          position: 'bottom-right'
        })
      }
      
    } catch (error) {
      console.error('İndirme başarısız:', error)
      toast.error('İndirme başarısız', {
        description: 'Lütfen manuel olarak indirin',
        duration: 4000,
        position: 'bottom-right'
      })
    } finally {
      setIsDownloading(false)
    }
  }

  // Buton render kontrolü
  useEffect(() => {
    if (buttonRef.current) {
      console.log('Button rendered:', buttonRef.current)
    } else {
      console.log('Button not rendered')
    }
  }, [updateAvailable])

  // Format changelog
  const formatChangelog = (body: string) => {
    if (!body) return ''
    
    // Markdown formatını temizle ve daha okunakır hale getir
    return body
      .replace(/##\s*(.+)/g, '<h3 class="font-bold text-lg mb-2 mt-4">$1</h3>')
      .replace(/###\s*(.+)/g, '<h4 class="font-semibold text-base mb-2 mt-3">$1</h4>')
      .replace(/^- (.+)/g, '<li class="ml-4 mb-1">• $1</li>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\n\n/g, '</p><p class="mb-2">')
      .replace(/\n/g, '<br />')
  }
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Format tarih
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <MotionItem delay={0.1}>
        <div className="glass-effect rounded-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <Zap className="w-8 h-8 mr-3 text-yellow-400" />
            {language === 'tr' ? 'Güncellemeler' : 'Updates'}
          </h2>

          {/* Mevcut Versiyon */}
          <div className="mb-8">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold mb-4">
                {language === 'tr' ? 'Mevcut Versiyon' : 'Current Version'}
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mr-4">
                    <CheckCircle className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">v{currentVersion}</div>
                    <div className="text-sm text-white/60">
                      {isTauri ? 'Tauri App' : 'Web App'}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={checkForUpdates}
                  disabled={isChecking}
                  className="bg-white/20 hover:bg-white/30"
                >
                  {isChecking ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      {language === 'tr' ? 'Kontrol Ediliyor...' : 'Checking...'}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {language === 'tr' ? 'Güncelleme Kontrolü' : 'Check for Updates'}
                    </>
                  )}
                </Button>
              </div>
              {lastChecked && (
                <div className="text-sm text-white/60 mt-3">
                  {language === 'tr' ? 'Son kontrol:' : 'Last checked:'} {lastChecked.toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Güncelleme Durumu */}
          {latestRelease && (
            <MotionItem delay={0.2}>
              <div className={`rounded-xl p-6 border ${
                updateAvailable 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-white/10 border-white/20'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    {updateAvailable ? (
                      <AlertCircle className="w-6 h-6 text-green-400 mr-3" />
                    ) : (
                      <CheckCircle className="w-6 h-6 text-blue-400 mr-3" />
                    )}
                    <div>
                      <h3 className="text-xl font-semibold">
                        {updateAvailable 
                          ? (language === 'tr' ? 'Yeni Güncelleme Mevcut' : 'Update Available')
                          : (language === 'tr' ? 'Güncelsiniz' : 'Up to Date')
                        }
                      </h3>
                      <div className="text-lg font-medium mt-1">
                        {latestRelease.tag_name !== 'dev' ? latestRelease.tag_name : (language === 'tr' ? 'Mevcut Sürüm' : 'Current Version')}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-white/60">
                    {formatDate(latestRelease.published_at)}
                  </div>
                </div>

                {/* Güncelleme Notları */}
                {latestRelease.body && (
                  <div className="mb-6">
                    <h4 className="font-semibold mb-3">
                      {language === 'tr' ? 'Yenilikler' : "What's New"}
                    </h4>
                    <div className="bg-black/20 rounded-lg p-4 max-h-40 overflow-y-auto">
                      <div 
                        className="text-sm text-white/80 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formatChangelog(latestRelease.body) }}
                      />
                    </div>
                  </div>
                )}

                {/* İndirme Butonu */}
                {updateAvailable && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-white/60">
                      {latestRelease.assets.length > 0 && (
                        <>
                          {latestRelease.assets.length} {language === 'tr' ? 'dosya mevcut' : 'files available'}
                          {latestRelease.assets[0] && (
                            <span className="ml-2">
                              ({formatFileSize(latestRelease.assets[0].size)})
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <Button
                      ref={buttonRef}
                      onClick={() => {
                        console.log('Button clicked!')
                        downloadUpdate()
                      }}
                      disabled={isDownloading}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      {isDownloading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          {language === 'tr' ? 'İndiriliyor...' : 'Downloading...'}
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          {language === 'tr' ? 'İndir' : 'Download'}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </MotionItem>
          )}

          {/* Debug Info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 pt-4 border-t border-white/10 text-xs text-white/40">
              <div>Debug Info:</div>
              <div>updateAvailable: {updateAvailable.toString()}</div>
              <div>latestRelease: {latestRelease ? latestRelease.tag_name : 'null'}</div>
              <div>currentVersion: {currentVersion}</div>
            </div>
          )}

          {/* GitHub Link */}
          <div className="mt-6 text-center">
            <a
              href="https://github.com/GalaxySal/Whisper-Weather/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-white/60 hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {language === 'tr' ? 'GitHub\'da Tüm Sürümler' : 'All Releases on GitHub'}
            </a>
          </div>
        </div>
      </MotionItem>
    </div>
  )
}
