import { useState, useEffect } from 'react'
import { AlertTriangle, X, Shield, ExternalLink } from 'lucide-react'

interface SecurityAlertProps {
  onClose: () => void
}

export function SecurityAlert({ onClose }: SecurityAlertProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if alert was already shown
    const hasSeenAlert = localStorage.getItem('security-alert-seen')
    if (hasSeenAlert) return

    // Show alert after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(true)
      localStorage.setItem('security-alert-seen', 'true')
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300) // Wait for animation
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-2xl mx-auto animate-in slide-in-from-bottom duration-300">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4 dark:bg-yellow-900/20 dark:border-yellow-800">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                Güvenlik Bildirimi
              </h3>
              <Shield className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
              React uygulamalarında CVE-2025-55182 güvenlik açığı tespit edildi. 
              Whisper Weather bu açıktan etkilenmez, ancak lütfen dikkatli olun.
            </p>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="inline-flex items-center px-2 py-1 text-xs border border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-900/30 rounded transition-colors"
                onClick={() => window.open('https://redguard.com.tr/blog/cve-2025-55182-react2shell', '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                RedGuard
              </button>
              
              <button
                className="inline-flex items-center px-2 py-1 text-xs border border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-900/30 rounded transition-colors"
                onClick={() => window.open('https://www.wiz.io/blog/critical-vulnerability-in-react-cve-2025-55182', '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Wiz.io
              </button>
              
              <button
                className="inline-flex items-center px-2 py-1 text-xs text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200 rounded transition-colors"
                onClick={handleClose}
              >
                Anladım
              </button>
            </div>
          </div>
          
          <button
            className="inline-flex items-center justify-center h-6 w-6 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200 rounded transition-colors"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
