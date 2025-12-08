import React, { useEffect, useState } from 'react';
import { Cloud, AlertTriangle, CheckCircle } from 'lucide-react';
import { cloudflareService } from '@/services/cloudflare';

export const CloudflareStatus: React.FC = () => {
  const [status, setStatus] = useState(cloudflareService.getStatus());

  useEffect(() => {
    const updateStatus = () => {
      setStatus(cloudflareService.getStatus());
    };

    // Update status every 5 seconds
    const interval = setInterval(updateStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    if (status.directMode) {
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    } else if (status.isHealthy) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else {
      return <Cloud className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    if (status.directMode) {
      return 'Direct Mode';
    } else if (status.isHealthy) {
      return 'Cloudflare Active';
    } else {
      return 'Cloudflare Error';
    }
  };

  const getStatusColor = () => {
    if (status.directMode) {
      return 'text-yellow-500';
    } else if (status.isHealthy) {
      return 'text-green-500';
    } else {
      return 'text-red-500';
    }
  };

  return (
    <div className="flex items-center space-x-2 text-xs">
      {getStatusIcon()}
      <span className={getStatusColor()}>
        {getStatusText()}
      </span>
      <span className="text-gray-400">
        ({status.lastCheck.toLocaleTimeString()})
      </span>
    </div>
  );
};
