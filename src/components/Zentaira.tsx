import { ExternalLink, ArrowRight, AlertTriangle, Wrench, Gamepad2, Trophy, Star, Wifi, WifiOff } from 'lucide-react'
import { useTranslation } from '../hooks/use-translation'
import { invoke } from '@tauri-apps/api/core'
import { useState, useEffect } from 'react'
import { tunnelService } from '../services/tunnel'
import type { TunnelStatus as TunnelStatusType } from '../services/tunnel'

export default function Zentaira() {
  const { language } = useTranslation()
  const [tunnelStatus, setTunnelStatus] = useState<TunnelStatusType | null>(null)

  useEffect(() => {
    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined
    
    if (!isTauri) return; // Only run tunnel status in Tauri
    
    const updateTunnelStatus = () => {
      const status = tunnelService.getCurrentStatus()
      setTunnelStatus(status)
    }

    updateTunnelStatus()
    const interval = setInterval(updateTunnelStatus, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [])

  const getConnectionStatus = () => {
    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined
    
    if (!isTauri) {
      return { 
        text: language === 'tr' ? 'Web Tarayıcısı' : 'Web Browser', 
        icon: Wifi, 
        color: 'text-blue-400' 
      }
    }
    
    if (!tunnelStatus) return { text: language === 'tr' ? 'Kontrol ediliyor...' : 'Checking...', icon: WifiOff, color: 'text-gray-400' }
    
    if (!tunnelStatus.is_active) {
      return { text: language === 'tr' ? 'Bağlantı Kesik' : 'Disconnected', icon: WifiOff, color: 'text-red-400' }
    }

    if (tunnelStatus.response_time_ms < 300) {
      return { text: language === 'tr' ? 'Mükemmel Bağlantı' : 'Excellent Connection', icon: Wifi, color: 'text-green-400' }
    } else if (tunnelStatus.response_time_ms < 600) {
      return { text: language === 'tr' ? 'İyi Bağlantı' : 'Good Connection', icon: Wifi, color: 'text-yellow-400' }
    } else {
      return { text: language === 'tr' ? 'Yavaş Bağlantı' : 'Slow Connection', icon: Wifi, color: 'text-orange-400' }
    }
  }

  const handleRedirect = async () => {
    const url = 'https://zentaira.com'
    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined
    
    if (isTauri) {
      try {
        await invoke('open_url', { url })
      } catch (error) {
        console.error('Failed to open URL via Tauri:', error)
        window.open(url, '_blank')
      }
    } else {
      // Browser fallback
      window.open(url, '_blank')
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Connection Status - Only show in Tauri */}
      {typeof window !== 'undefined' && (window as any).__TAURI__ && (
        <div className="mb-8">
          <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4 text-blue-100">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {(() => {
                  const status = getConnectionStatus()
                  const Icon = status.icon
                  return <Icon className={`w-6 h-6 ${status.color}`} />
                })()}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-100 mb-1">
                  {language === 'tr' ? 'Bağlantı Durumu' : 'Connection Status'}
                </h3>
                <p className="text-sm text-blue-200/80">
                  {getConnectionStatus().text}
                  {tunnelStatus && tunnelStatus.response_time_ms > 0 && (
                    <span className="ml-2">
                      ({language === 'tr' ? 'Yanıt süresi' : 'Response time'}: {tunnelStatus.response_time_ms}ms)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Alert */}
      <div className="mb-8">
        <div className="bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-4 text-yellow-100">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Wrench className="w-6 h-6 text-yellow-300" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-100 mb-1">
                {language === 'tr' ? 'Bakım Modu' : 'Under Maintenance'}
              </h3>
              <p className="text-sm text-yellow-200/80">
                {language === 'tr' 
                  ? 'Zentaira.com yakında yenilenecek. Şu anda bakım çalışmaları yapıyoruz.'
                  : 'Zentaira.com will be renewed soon. We are currently performing maintenance work.'
                }
              </p>
            </div>
            <div className="flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-yellow-300 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-white text-center border border-white/20">
        {/* Logo/Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
            <Gamepad2 className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-4">Zentaira</h1>
        
        {/* Description */}
        <p className="text-white/80 mb-8 max-w-md mx-auto">
          {language === 'tr' 
            ? 'Oyun dünyasının yeni adresi! Ücretsiz ve eğlenceli oyunlarla dolu platform.'
            : 'The new address of the gaming world! A platform full of free and fun games.'
          }
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <Gamepad2 className="w-6 h-6 mb-2 text-purple-300" />
            <h3 className="font-semibold mb-2">
              {language === 'tr' ? 'Ücretsiz Oyunlar' : 'Free Games'}
            </h3>
            <p className="text-sm text-white/70">
              {language === 'tr' 
                ? 'Bubble Shooter, Tetris, Snake ve daha fazlası!'
                : 'Bubble Shooter, Tetris, Snake and more!'
              }
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <Trophy className="w-6 h-6 mb-2 text-yellow-300" />
            <h3 className="font-semibold mb-2">
              {language === 'tr' ? 'Oyun Haberleri' : 'Game News'}
            </h3>
            <p className="text-sm text-white/70">
              {language === 'tr' 
                ? 'En güncel oyun haberleri ve incelemeler.'
                : 'Latest game news and reviews.'
              }
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <Star className="w-6 h-6 mb-2 text-pink-300" />
            <h3 className="font-semibold mb-2">
              {language === 'tr' ? 'Eğlence' : 'Fun'}
            </h3>
            <p className="text-sm text-white/70">
              {language === 'tr' 
                ? 'Sınırsız eğlence ve keyifli zaman geçirme.'
                : 'Unlimited fun and enjoyable time.'
              }
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleRedirect}
          className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
        >
          <ExternalLink className="w-5 h-5 mr-2" />
          {language === 'tr' ? 'Zentaira.com\'u Ziyaret Et' : 'Visit Zentaira.com'}
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>

        {/* Additional Info */}
        <div className="mt-8 text-sm text-white/60">
          {language === 'tr' 
            ? 'Yeni bir sekmede açılacaktır'
            : 'Opens in a new tab'
          }
        </div>
      </div>

      {/* Additional Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white border border-white/20">
          <h3 className="text-lg font-semibold mb-3">
            {language === 'tr' ? 'Popüler Oyunlar' : 'Popular Games'}
          </h3>
          <ul className="space-y-2 text-sm text-white/80">
            <li>• {language === 'tr' ? 'Bubble Shooter' : 'Bubble Shooter'}</li>
            <li>• {language === 'tr' ? 'Ping Pong' : 'Ping Pong'}</li>
            <li>• {language === 'tr' ? 'Tetris' : 'Tetris'}</li>
            <li>• {language === 'tr' ? 'Snake' : 'Snake'}</li>
          </ul>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white border border-white/20">
          <h3 className="text-lg font-semibold mb-3">
            {language === 'tr' ? 'Neden Zentaira?' : 'Why Zentaira?'}
          </h3>
          <p className="text-sm text-white/80 mb-4">
            {language === 'tr' 
              ? 'En güncel oyun haberleri, incelemeler ve ücretsiz oyunlar için doğru adres.'
              : 'The right address for the latest game news, reviews and free games.'
            }
          </p>
          <button
            onClick={handleRedirect}
            className="text-sm text-purple-300 hover:text-purple-200 underline"
          >
            zentaira.com
          </button>
        </div>
      </div>
    </div>
  )
}
