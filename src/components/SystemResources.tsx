import { useState, useEffect } from 'react'
import { useTauri } from '@/hooks/use-tauri'
import { useLanguage } from '@/hooks/use-language'
import { translations } from '@/lib/translations'
import { Cpu, Activity, Monitor } from 'lucide-react'

interface SystemData {
  process: {
    pid: number | string
    memory_mb: number
    cpu_percent: number
    name: string
  }
  system: {
    total_memory_mb: number
    used_memory_mb: number
    available_memory_mb: number
    cpu_usage: number
    cpu_count: number
    process_count: number
  }
  timestamp: number
}

export default function SystemResources() {
  const { getSystemResources, isTauri } = useTauri()
  const { language } = useLanguage()
  const t = translations[language]
  const [systemData, setSystemData] = useState<SystemData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSystemData = async () => {
    try {
      const data = await getSystemResources()
      setSystemData(data as SystemData)
    } catch (error) {
      console.error('System data fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemData()
    
    // Her 2 saniyede bir güncelle
    const interval = setInterval(fetchSystemData, 2000)
    
    return () => clearInterval(interval)
  }, [])

  if (!isTauri) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Monitor className="w-5 h-5 mr-2" />
          {t.systemResources.title}
        </h3>
        <div className="text-white/60">{t.systemResources.notAvailable}</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Monitor className="w-5 h-5 mr-2" />
          {t.systemResources.title}
        </h3>
        <div className="text-white/60">{t.systemResources.loading}</div>
      </div>
    )
  }

  if (!systemData) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Monitor className="w-5 h-5 mr-2" />
          {t.systemResources.title}
        </h3>
        <div className="text-white/60">{t.messages.noDataFound}</div>
      </div>
    )
  }

  const memoryUsagePercent = systemData.system.total_memory_mb > 0 
    ? (systemData.system.used_memory_mb / systemData.system.total_memory_mb) * 100 
    : 0

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Monitor className="w-5 h-5 mr-2" />
        {t.systemResources.title}
      </h3>
      
      <div className="space-y-4">
        {/* {t.systemResources.processInfo} */}
        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="text-sm font-medium text-white/80 mb-3 flex items-center">
            <Activity className="w-4 h-4 mr-2" />
            {t.systemResources.processInfo}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-white/60">{t.systemResources.processId}</div>
              <div className="text-sm text-white font-mono">{systemData.process.pid}</div>
            </div>
            <div>
              <div className="text-xs text-white/60">{t.systemResources.processName}</div>
              <div className="text-sm text-white">{systemData.process.name}</div>
            </div>
            <div>
              <div className="text-xs text-white/60">{t.systemResources.processMemory}</div>
              <div className="text-sm text-white font-mono">{systemData.process.memory_mb} MB</div>
            </div>
            <div>
              <div className="text-xs text-white/60">{t.systemResources.processCpu}</div>
              <div className="text-sm text-white font-mono">{systemData.process.cpu_percent.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* Sistem Bilgileri */}
        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="text-sm font-medium text-white/80 mb-3 flex items-center">
            <Cpu className="w-4 h-4 mr-2" />
            {t.systemResources.title}
          </h4>
          <div className="space-y-3">
            {/* CPU */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/60">{t.systemResources.cpuUsage}</span>
                <span className="text-white">{systemData.system.cpu_usage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(systemData.system.cpu_usage, 100)}%` }}
                />
              </div>
            </div>

            {/* RAM */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/60">{t.systemResources.memoryUsage}</span>
                <span className="text-white">
                  {systemData.system.used_memory_mb} / {systemData.system.total_memory_mb} MB
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${memoryUsagePercent}%` }}
                />
              </div>
            </div>

            {/* Diğer bilgiler */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <div className="text-xs text-white/60">{t.systemResources.cpuCores}</div>
                <div className="text-sm text-white">{systemData.system.cpu_count}</div>
              </div>
              <div>
                <div className="text-xs text-white/60">{t.systemResources.processCount}</div>
                <div className="text-sm text-white">{systemData.system.process_count}</div>
              </div>
              <div>
                <div className="text-xs text-white/60">{t.systemResources.availableMemory}</div>
                <div className="text-sm text-white">{systemData.system.available_memory_mb} MB</div>
              </div>
              <div>
                <div className="text-xs text-white/60">Platform</div>
                <div className="text-sm text-white">{isTauri ? 'Tauri' : 'Web'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Son güncelleme */}
        <div className="text-xs text-white/40 text-center">
          {t.systemResources.lastUpdate}: {new Date(systemData.timestamp * 1000).toLocaleTimeString(language === 'tr' ? 'tr-TR' : 'en-US')}
        </div>
      </div>
    </div>
  )
}
