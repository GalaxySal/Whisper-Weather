import React, { useEffect, useState } from 'react';
import { Globe, AlertTriangle, CheckCircle, Server, Activity } from 'lucide-react';
import { tunnelService } from '@/services/tunnel';
import type { TunnelStatus as TunnelStatusType } from '@/services/tunnel';
import { useLanguage } from '@/hooks/use-language';
import { translations } from '@/lib/translations';
import { toast } from 'sonner';
import { isTauri } from '@/lib/platform';

const TunnelStatusComponent: React.FC = () => {
  const [status, setStatus] = useState<TunnelStatusType | null>(null);
  const [lastAlertTime, setLastAlertTime] = useState<number>(0);
  const { language } = useLanguage();
  const t = translations[language];
  const ALERT_COOLDOWN = 30000; // 30 seconds between alerts

  useEffect(() => {
    // Only show tunnel status in Tauri
    if (!isTauri()) {
      return;
    }

    const updateStatus = () => {
      const currentStatus = tunnelService.getCurrentStatus();
      console.log('Tunnel status update:', currentStatus);
      setStatus(currentStatus);
      
      // Check for slow connection and show toast
      if (currentStatus && currentStatus.response_time_ms > 500) {
        const now = Date.now();
        if (now - lastAlertTime > ALERT_COOLDOWN) {
          toast.error(t.tunnel.title, {
            description: `${t.tunnel.responseTime}: ${currentStatus.response_time_ms}ms\n${t.tunnel.description}`,
            duration: 5000,
            action: {
              label: 'OK',
              onClick: () => console.log('Alert dismissed'),
            },
          });
          setLastAlertTime(now);
        }
      }
    };

    // Initial status
    updateStatus();

    // Update status every 5 seconds
    const interval = setInterval(updateStatus, 5000);

    return () => clearInterval(interval);
  }, [lastAlertTime, t]);

  const formatLastCheck = (timestamp: number) => {
    if (!timestamp || timestamp === 0) return t.tunnel.checking;
    return new Date(timestamp * 1000).toLocaleTimeString();
  };

  const getStatusIcon = () => {
    if (!status) return <Server className="w-4 h-4 text-gray-500" />;
    
    if (!status.is_active) {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }

    switch (status.current_mode) {
      case 'MainDomain':
        return <Globe className="w-4 h-4 text-green-500" />;
      case 'Fallback':
        return <Activity className="w-4 h-4 text-yellow-500" />;
      case 'Direct':
        return <Server className="w-4 h-4 text-blue-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getStatusText = () => {
    if (!status) return 'Checking...';
    
    if (!status.is_active) {
      return t.tunnel.offline;
    }

    switch (status.current_mode) {
      case 'MainDomain':
        return t.tunnel.zentairaConnected;
      case 'Fallback':
        return t.tunnel.backupServer;
      case 'Direct':
        return t.tunnel.localServer;
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = () => {
    if (!status) return 'text-gray-500';
    
    if (!status.is_active) {
      return 'text-red-500';
    }

    switch (status.current_mode) {
      case 'MainDomain':
        return 'text-green-500';
      case 'Fallback':
        return 'text-yellow-500';
      case 'Direct':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const getResponseTimeColor = () => {
    if (!status) return 'text-gray-400';
    
    if (status.response_time_ms < 200) return 'text-green-400';
    if (status.response_time_ms < 500) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="flex items-center space-x-3 text-xs">
      {getStatusIcon()}
      <div className="flex flex-col">
        <span className={getStatusColor()}>
          {getStatusText()}
        </span>
        <div className="flex items-center space-x-2 text-gray-400">
          <span className={getResponseTimeColor()}>{status?.response_time_ms || 0}ms</span>
          <span>•</span>
          <span>{formatLastCheck(status?.last_check || 0)}</span>
        </div>
      </div>
    </div>
  );
};

export const TunnelStatus = TunnelStatusComponent;
