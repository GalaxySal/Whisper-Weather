import React, { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { SecurityAlert } from './SecurityAlert'
import { 
  Users, 
  Bug, 
  AlertTriangle, 
  Database, 
  Activity,
  Settings,
  Trash2,
  Shield,
  RefreshCw,
  Download,
  BarChart3,
  Eye,
  Globe
} from 'lucide-react'

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AdminDashboard Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
          <div className="glass-effect rounded-xl p-6 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Admin Dashboard Error</h2>
            <p className="mb-4">Something went wrong loading the admin dashboard.</p>
            <details className="text-left">
              <summary className="cursor-pointer">Error Details</summary>
              <pre className="mt-2 text-sm bg-red-500/20 p-2 rounded">
                {this.state.error?.stack}
              </pre>
            </details>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

import { useLanguage } from '@/hooks/use-language'
import { MotionItem } from '@/components/ui/motion'

interface BugReport {
  id: string
  title: string
  description: string
  bug_type: string
  severity: string
  status: string
  email?: string
  created_at: string
  updated_at: string
}

interface ApiQuery {
  id: string
  endpoint: string
  method: string
  status: number
  response_time: number
  user_id?: string
  ip_address?: string
  user_agent?: string
  timestamp: string
  error?: string
}

interface SystemStats {
  totalUsers: number
  activeUsers: number
  newUsersThisMonth: number
  totalBugs: number
  resolvedBugs: number
  criticalBugs: number
  systemUptime: string
  lastUpdate: string
  apiQueriesCount: number
  avgApiResponseTime: number
}

function AdminDashboard() {
  const { language } = useLanguage()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showSecurityAlert, setShowSecurityAlert] = useState(true)
  const [bugReports, setBugReports] = useState<BugReport[]>([])
  const [apiQueries, setApiQueries] = useState<ApiQuery[]>([])
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    totalBugs: 0,
    resolvedBugs: 0,
    criticalBugs: 0,
    systemUptime: '',
    lastUpdate: '',
    apiQueriesCount: 0,
    avgApiResponseTime: 0
  })
  const [systemInfo, setSystemInfo] = useState<any>(null)
  const [selectedTab, setSelectedTab] = useState('overview')
  const [selectedBug, setSelectedBug] = useState<BugReport | null>(null)

  // Admin kontrolü
  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    setIsLoading(true)
    
    try {
      // Session'ı yenile
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !sessionData.session) {
        console.log('DEBUG: No valid session, redirecting to login')
        setIsAdmin(false)
        setIsLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setIsAdmin(false)
        setIsLoading(false)
        return
      }

      // Admin email kontrolü
      const adminEmails = ['admin@zentaira.com', 'developer@zentaira.com', 'support@zentaira.com', 'nazimpala5170@gmail.com']
      const isAdminUser = adminEmails.includes(user.email || '') || 
                        user.user_metadata?.role === 'admin' ||
                        user.user_metadata?.role === 'developer'

      setIsAdmin(isAdminUser)
      
      if (isAdminUser) {
        loadDashboardData()
      }
    } catch (error) {
      console.error('Admin check failed:', error)
      setIsAdmin(false)
    } finally {
      setIsLoading(false)
    }
  }

  const loadDashboardData = async () => {
    try {
      console.log('DEBUG: Loading dashboard data...')
      
      // Backend'den verileri çek
      const [statsData, bugsData, systemData, apiQueriesData] = await Promise.all([
        invoke('get_user_stats'),
        invoke('get_bug_reports'),
        invoke('get_system_info'),
        invoke('get_api_queries') // Yeni API queries endpoint
      ])

      console.log('DEBUG: Stats data:', statsData)
      console.log('DEBUG: Bugs data:', bugsData)
      console.log('DEBUG: System data:', systemData)
      console.log('DEBUG: API queries data:', apiQueriesData)

      // Data validation - handle ApiResponse format
      if (bugsData && typeof bugsData === 'object' && 'data' in bugsData && Array.isArray(bugsData.data)) {
        setBugReports(bugsData.data as BugReport[])
      } else {
        console.error('DEBUG: bugsData is not an array:', bugsData)
        setBugReports([])
      }

      if (apiQueriesData && typeof apiQueriesData === 'object' && 'data' in apiQueriesData && Array.isArray(apiQueriesData.data)) {
        setApiQueries(apiQueriesData.data as ApiQuery[])
      } else {
        console.error('DEBUG: apiQueriesData is not an array:', apiQueriesData)
        setApiQueries([])
      }

      if (statsData && typeof statsData === 'object' && 'data' in statsData) {
        setSystemStats(statsData.data as SystemStats)
      } else {
        setSystemStats({
          totalUsers: 0,
          activeUsers: 0,
          newUsersThisMonth: 0,
          totalBugs: 0,
          resolvedBugs: 0,
          criticalBugs: 0,
          systemUptime: '',
          lastUpdate: '',
          apiQueriesCount: 0,
          avgApiResponseTime: 0
        })
      }

      setSystemInfo(systemData)
      
      console.log('DEBUG: Dashboard data loaded successfully')
    } catch (error) {
      console.error('DEBUG: Failed to load dashboard data:', error)
      console.error('DEBUG: Error details:', JSON.stringify(error, null, 2))
      
      // Fallback to empty data
      setBugReports([])
      setApiQueries([])
      setSystemStats({
        totalUsers: 0,
        activeUsers: 0,
        newUsersThisMonth: 0,
        totalBugs: 0,
        resolvedBugs: 0,
        criticalBugs: 0,
        systemUptime: '',
        lastUpdate: '',
        apiQueriesCount: 0,
        avgApiResponseTime: 0
      })
    }
  }

  const updateBugStatus = async (bugId: string, newStatus: string) => {
    try {
      await invoke('update_bug_status', { bugId, newStatus })
      
      setBugReports(prev => 
        prev.map(bug => 
          bug.id === bugId 
            ? { ...bug, status: newStatus, updated_at: new Date().toISOString() }
            : bug
        )
      )
      
      toast.success(
        language === 'tr' ? 'Durum güncellendi' : 'Status updated'
      )
    } catch (error) {
      toast.error(
        language === 'tr' ? 'Güncelleme başarısız' : 'Update failed'
      )
    }
  }

  const deleteBug = async (bugId: string) => {
    try {
      await invoke('delete_bug_report', { bugId })
      setBugReports(prev => prev.filter(bug => bug.id !== bugId))
      toast.success(
        language === 'tr' ? 'Hata silindi' : 'Bug deleted'
      )
    } catch (error) {
      toast.error(
        language === 'tr' ? 'Silme başarısız' : 'Delete failed'
      )
    }
  }

  const exportData = () => {
    const data = {
      bugReports,
      systemStats,
      exportDate: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `admin-dashboard-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success(
      language === 'tr' ? 'Veriler dışa aktarıldı' : 'Data exported'
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="glass-effect rounded-2xl p-8 text-white text-center">
          <div className="w-12 h-12 mx-auto border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>{language === 'tr' ? 'Yükleniyor...' : 'Loading...'}</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto">
        <MotionItem delay={0.1}>
          <div className="glass-effect rounded-2xl p-8 text-white text-center">
            <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center mb-6">
              <Shield className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold mb-4">
              {language === 'tr' ? 'Erişim Reddedildi' : 'Access Denied'}
            </h2>
            <p className="text-white/80 mb-6">
              {language === 'tr' 
                ? 'Bu sayfaya sadece admin ve geliştiriciler erişebilir.'
                : 'This page is accessible only to admins and developers.'
              }
            </p>
          </div>
        </MotionItem>
      </div>
    )
  }

  const getSeverityColor = (severity?: string) => {
    if (!severity) return 'text-gray-400 bg-gray-500/20'
    
    switch (severity?.toLowerCase()) {
      case 'critical': return 'text-red-400 bg-red-500/20'
      case 'high': return 'text-orange-400 bg-orange-500/20'
      case 'medium': return 'text-yellow-400 bg-yellow-500/20'
      case 'low': return 'text-green-400 bg-green-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getStatusColor = (status?: string) => {
    if (!status) return 'text-gray-400 bg-gray-500/20'
    
    switch (status?.toLowerCase()) {
      case 'open': return 'text-red-400 bg-red-500/20'
      case 'in_progress': return 'text-blue-400 bg-blue-500/20'
      case 'resolved': return 'text-green-400 bg-green-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <MotionItem delay={0.1}>
        <div className="glass-effect rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="w-8 h-8 mr-3 text-blue-400" />
              <h1 className="text-3xl font-bold">
                {language === 'tr' ? 'Admin Paneli' : 'Admin Dashboard'}
              </h1>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadDashboardData}
                className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white/20 transition-all duration-200 flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {language === 'tr' ? 'Yenile' : 'Refresh'}
              </button>
              <button
                onClick={exportData}
                className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white/20 transition-all duration-200 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                {language === 'tr' ? 'Dışa Aktar' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      </MotionItem>

      {/* Tabs */}
      <MotionItem delay={0.2}>
        <div className="glass-effect rounded-xl p-2 text-white">
          <div className="flex space-x-2">
            {[
              { id: 'overview', label: language === 'tr' ? 'Genel Bakış' : 'Overview', icon: BarChart3 },
              { id: 'bugs', label: language === 'tr' ? 'Hata Raporları' : 'Bug Reports', icon: Bug },
              { id: 'users', label: language === 'tr' ? 'Kullanıcılar' : 'Users', icon: Users },
              { id: 'api', label: language === 'tr' ? 'API Sorguları' : 'API Queries', icon: Globe },
              { id: 'system', label: language === 'tr' ? 'Sistem' : 'System', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg transition-all duration-200 ${
                  selectedTab === tab.id 
                    ? 'bg-white/20 text-white' 
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </MotionItem>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MotionItem delay={0.3}>
              <div className="glass-effect rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-blue-400" />
                  <span className="text-2xl font-bold">{systemStats.totalUsers}</span>
                </div>
                <h3 className="text-lg font-semibold">{language === 'tr' ? 'Toplam Kullanıcı' : 'Total Users'}</h3>
                <p className="text-sm text-white/60">{systemStats.activeUsers} {language === 'tr' ? 'aktif' : 'active'}</p>
              </div>
            </MotionItem>

            <MotionItem delay={0.4}>
              <div className="glass-effect rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <Bug className="w-8 h-8 text-red-400" />
                  <span className="text-2xl font-bold">{systemStats.totalBugs}</span>
                </div>
                <h3 className="text-lg font-semibold">{language === 'tr' ? 'Toplam Hata' : 'Total Bugs'}</h3>
                <p className="text-sm text-white/60">{systemStats.resolvedBugs} {language === 'tr' ? 'çözüldü' : 'resolved'}</p>
              </div>
            </MotionItem>

            <MotionItem delay={0.5}>
              <div className="glass-effect rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <AlertTriangle className="w-8 h-8 text-orange-400" />
                  <span className="text-2xl font-bold">{systemStats.criticalBugs}</span>
                </div>
                <h3 className="text-lg font-semibold">{language === 'tr' ? 'Kritik Hatalar' : 'Critical Bugs'}</h3>
                <p className="text-sm text-white/60">{language === 'tr' ? 'İlgilenmeli' : 'Needs attention'}</p>
              </div>
            </MotionItem>

            <MotionItem delay={0.6}>
              <div className="glass-effect rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <Activity className="w-8 h-8 text-green-400" />
                  <span className="text-sm font-bold">{systemStats.systemUptime}</span>
                </div>
                <h3 className="text-lg font-semibold">{language === 'tr' ? 'Sistem Çalışma Süresi' : 'System Uptime'}</h3>
                <p className="text-sm text-white/60">{language === 'tr' ? 'Stabil' : 'Stable'}</p>
              </div>
            </MotionItem>
          </div>

          {/* Recent Activity */}
          <MotionItem delay={0.7}>
            <div className="glass-effect rounded-xl p-6 text-white">
              <h3 className="text-xl font-semibold mb-4">
                {language === 'tr' ? 'Son Aktiviteler' : 'Recent Activity'}
              </h3>
              <div className="space-y-3">
                {bugReports.slice(0, 5).map(bug => (
                  <div key={bug.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Bug className="w-4 h-4 text-red-400" />
                      <div>
                        <p className="font-medium">{bug.title}</p>
                        <p className="text-sm text-white/60">{new Date(bug.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(bug.status)}`}>
                      {bug.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </MotionItem>
        </>
      )}

      {/* Bugs Tab */}
      {selectedTab === 'bugs' && (
        <MotionItem delay={0.3}>
          <div className="glass-effect rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">
                {language === 'tr' ? 'Hata Raporları' : 'Bug Reports'}
              </h3>
              <span className="text-sm text-white/60">
                {bugReports.length} {language === 'tr' ? 'rapor' : 'reports'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-4">{language === 'tr' ? 'Başlık' : 'Title'}</th>
                    <th className="text-left py-3 px-4">{language === 'tr' ? 'Tür' : 'Type'}</th>
                    <th className="text-left py-3 px-4">{language === 'tr' ? 'Önem' : 'Severity'}</th>
                    <th className="text-left py-3 px-4">{language === 'tr' ? 'Durum' : 'Status'}</th>
                    <th className="text-left py-3 px-4">{language === 'tr' ? 'Tarih' : 'Date'}</th>
                    <th className="text-left py-3 px-4">{language === 'tr' ? 'İşlemler' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {bugReports.map(bug => (
                    <tr key={bug.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{bug.title}</p>
                          <p className="text-sm text-white/60">{bug.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize">{bug.bug_type}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(bug.severity)}`}>
                          {bug.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={bug.status}
                          onChange={(e) => updateBugStatus(bug.id, e.target.value)}
                          className="bg-white/10 text-white px-2 py-1 rounded border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="open" className="bg-gray-800">Open</option>
                          <option value="in_progress" className="bg-gray-800">In Progress</option>
                          <option value="resolved" className="bg-gray-800">Resolved</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <p>{new Date(bug.created_at).toLocaleDateString()}</p>
                          <p className="text-white/60">{new Date(bug.created_at).toLocaleTimeString()}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedBug(bug)}
                            className="p-1 hover:bg-white/10 rounded"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteBug(bug.id)}
                            className="p-1 hover:bg-white/10 rounded text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </MotionItem>
      )}

      {/* Users Tab */}
      {selectedTab === 'users' && (
        <MotionItem delay={0.3}>
          <div className="glass-effect rounded-xl p-6 text-white">
            <h3 className="text-xl font-semibold mb-6">
              {language === 'tr' ? 'Kullanıcı İstatistikleri' : 'User Statistics'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold mb-3">{language === 'tr' ? 'Kullanıcı Dağılımı' : 'User Distribution'}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>{language === 'tr' ? 'Aktif' : 'Active'}</span>
                    <span>{systemStats.activeUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === 'tr' ? 'Pasif' : 'Inactive'}</span>
                    <span>{systemStats.totalUsers - systemStats.activeUsers}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold mb-3">{language === 'tr' ? 'Kayıt Trendi' : 'Registration Trend'}</h4>
                <p className="text-white/60">
                  {language === 'tr' 
                    ? `Son 30 günde ${systemStats?.newUsersThisMonth || 0} yeni kullanıcı kaydoldu.`
                    : `${systemStats?.newUsersThisMonth || 0} new users registered in the last 30 days.`
                  }
                </p>
              </div>
            </div>
          </div>
        </MotionItem>
      )}

      {/* System Tab */}
      {selectedTab === 'system' && (
        <MotionItem delay={0.3}>
          <div className="glass-effect rounded-xl p-6 text-white">
            <h3 className="text-xl font-semibold mb-6">
              {language === 'tr' ? 'Sistem Bilgileri' : 'System Information'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center">
                  <Database className="w-4 h-4 mr-2" />
                  {language === 'tr' ? 'Veritabanı' : 'Database'}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{language === 'tr' ? 'Durum' : 'Status'}</span>
                    <span className="text-green-400">{language === 'tr' ? 'Sağlıklı' : 'Healthy'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === 'tr' ? 'Boyut' : 'Size'}</span>
                    <span>{systemInfo?.diskUsage || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  {language === 'tr' ? 'Performans' : 'Performance'}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{language === 'tr' ? 'CPU Kullanımı' : 'CPU Usage'}</span>
                    <span>{systemInfo?.cpuUsage || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === 'tr' ? 'Bellek Kullanımı' : 'Memory Usage'}</span>
                    <span>{systemInfo?.memoryUsage || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  {language === 'tr' ? 'Sistem' : 'System'}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{language === 'tr' ? 'Çalışma Süresi' : 'Uptime'}</span>
                    <span>{systemInfo?.uptime || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === 'tr' ? 'Process Sayısı' : 'Process Count'}</span>
                    <span>{systemInfo?.processCount || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center">
                  <Database className="w-4 h-4 mr-2" />
                  {language === 'tr' ? 'Bellek' : 'Memory'}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{language === 'tr' ? 'Toplam Bellek' : 'Total Memory'}</span>
                    <span>{systemInfo?.totalMemory || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === 'tr' ? 'Kullanılan Bellek' : 'Used Memory'}</span>
                    <span>{systemInfo?.usedMemory || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </MotionItem>
      )}

      {/* API Queries Tab */}
      {selectedTab === 'api' && (
        <MotionItem delay={0.3}>
          <div className="glass-effect rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold flex items-center">
                <Globe className="w-5 h-5 mr-2 text-blue-400" />
                {language === 'tr' ? 'API Sorguları' : 'API Queries'}
              </h3>
              <div className="text-sm text-white/60">
                {apiQueries.length} {language === 'tr' ? 'sorgu' : 'queries'}
              </div>
            </div>

            {apiQueries.length === 0 ? (
              <div className="text-center py-8 text-white/60">
                <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{language === 'tr' ? 'Henüz API sorgusu yok' : 'No API queries yet'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {apiQueries.map((query) => (
                  <div key={query.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          query.status >= 200 && query.status < 300 ? 'bg-green-400' : 
                          query.status >= 400 ? 'bg-red-400' : 'bg-yellow-400'
                        }`} />
                        <div>
                          <div className="font-medium">{query.method} {query.endpoint}</div>
                          <div className="text-sm text-white/60">
                            {new Date(query.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${
                          query.status >= 200 && query.status < 300 ? 'text-green-400' : 
                          query.status >= 400 ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {query.status}
                        </div>
                        <div className="text-sm text-white/60">
                          {query.response_time}ms
                        </div>
                      </div>
                    </div>
                    
                    {query.error && (
                      <div className="mt-3 text-sm text-red-400 bg-red-500/10 rounded p-2">
                        {query.error}
                      </div>
                    )}
                    
                    <div className="mt-3 flex items-center space-x-4 text-xs text-white/40">
                      {query.user_id && (
                        <span>User: {query.user_id}</span>
                      )}
                      {query.ip_address && (
                        <span>IP: {query.ip_address}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </MotionItem>
      )}

      {/* Bug Detail Modal */}
      {selectedBug && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="glass-effect rounded-2xl p-6 text-white max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">{selectedBug.title}</h3>
              <button
                onClick={() => setSelectedBug(null)}
                className="p-1 hover:bg-white/10 rounded"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60">{language === 'tr' ? 'Açıklama' : 'Description'}</label>
                <p className="mt-1">{selectedBug.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60">{language === 'tr' ? 'Tür' : 'Type'}</label>
                  <p className="mt-1 capitalize">{selectedBug.bug_type}</p>
                </div>
                <div>
                  <label className="text-sm text-white/60">{language === 'tr' ? 'Önem' : 'Severity'}</label>
                  <p className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(selectedBug.severity)}`}>
                      {selectedBug.severity}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60">{language === 'tr' ? 'E-posta' : 'Email'}</label>
                  <p className="mt-1">{selectedBug.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-white/60">{language === 'tr' ? 'Oluşturulma' : 'Created'}</label>
                  <p className="mt-1">{new Date(selectedBug.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showSecurityAlert && (
        <SecurityAlert onClose={() => setShowSecurityAlert(false)} />
      )}
    </div>
  )
}

// Export with Error Boundary
export default function AdminDashboardWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <AdminDashboard />
    </ErrorBoundary>
  )
}
