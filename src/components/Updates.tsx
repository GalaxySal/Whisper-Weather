import { useState, useEffect } from 'react'
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

  // Mevcut version'u al
  useEffect(() => {
    if (isTauri) {
      // Tauri app version
      const getVersion = async () => {
        try {
          const { invoke } = await import('@tauri-apps/api/core')
          const version = await invoke('get_app_version')
          setCurrentVersion(version as string)
        } catch (error) {
          console.error('Version alınamadı:', error)
        }
      }
      getVersion()
    } else {
      // Web version
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
      const response = await fetch('https://api.github.com/repos/GalaxySal/Whisper-Weather/releases/latest')
      const release = await response.json()
      
      setLatestRelease(release)
      
      // Version karşılaştırması
      const current = currentVersion.replace('v', '')
      const latest = release.tag_name.replace('v', '')
      
      if (current !== latest) {
        setUpdateAvailable(true)
        
        // Sessiz bildirim (kullanıcıyı rahatsız etmeyen)
        toast.info('Yeni güncelleme mevcut!', {
          description: `Versiyon ${release.tag_name} yayınlandı`,
          duration: 5000,
          position: 'bottom-right',
          action: {
            label: 'İndir',
            onClick: () => downloadUpdate()
          }
        })
      } else {
        setUpdateAvailable(false)
        toast.success('Güncel!', {
          description: 'En son sürümü kullanıyorsunuz',
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
    if (!latestRelease) return
    
    setIsDownloading(true)
    
    try {
      // Platforma uygun dosyayı bul
      const asset = latestRelease.assets.find(asset => {
        if (isTauri) {
          // Tauri için platform spesifik dosya
          return asset.name.includes('.exe') || asset.name.includes('.dmg') || asset.name.includes('.deb')
        }
        // Web için source kodu
        return asset.name.includes('source')
      })
      
      if (!asset) {
        // Asset yoksa GitHub sayfasına yönlendir
        window.open(latestRelease.html_url, '_blank')
        return
      }
      
      if (isTauri) {
        // Tauri'de doğrudan indir
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('download_and_install_update', {
          url: asset.browser_download_url,
          filename: asset.name
        })
        
        toast.success('İndirme başladı!', {
          description: 'Güncelleme indiriliyor ve kurulacak...',
          duration: 5000,
          position: 'bottom-right'
        })
      } else {
        // Web'de doğrudan indir
        const link = document.createElement('a')
        link.href = asset.browser_download_url
        link.download = asset.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast.success('İndirme başladı!', {
          description: `${asset.name} indiriliyor...`,
          duration: 5000,
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

  // Format dosya boyutu
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
                        {latestRelease.tag_name}
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
                      <pre className="text-sm text-white/80 whitespace-pre-wrap">
                        {latestRelease.body}
                      </pre>
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
                      onClick={downloadUpdate}
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
