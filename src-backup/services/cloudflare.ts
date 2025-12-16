import { invoke } from '@tauri-apps/api/core';

export interface CloudflareStatus {
  isHealthy: boolean;
  tunnelUrl?: string;
  directMode: boolean;
  lastCheck: Date;
}

class CloudflareService {
  private status: CloudflareStatus = {
    isHealthy: true,
    directMode: false,
    lastCheck: new Date()
  };
  
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

  async initialize(): Promise<void> {
    // Start health check monitoring
    this.startHealthCheckMonitoring();
    
    // Initial health check
    await this.checkHealth();
  }

  async checkHealth(): Promise<boolean> {
    try {
      const isHealthy = await invoke<boolean>('check_cloudflare_health');
      
      this.status = {
        isHealthy,
        directMode: !isHealthy,
        lastCheck: new Date()
      };

      console.log(`Cloudflare health check: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
      
      return isHealthy;
    } catch (error) {
      console.error('Cloudflare health check failed:', error);
      this.status.directMode = true;
      this.status.lastCheck = new Date();
      return false;
    }
  }

  async switchToDirectMode(): Promise<void> {
    try {
      await invoke('safe_direct_mode');
      this.status.directMode = true;
      this.status.isHealthy = false;
      console.log('Switched to direct mode');
    } catch (error) {
      console.error('Failed to switch to direct mode:', error);
    }
  }

  private startHealthCheckMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.checkHealth();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  getStatus(): CloudflareStatus {
    return { ...this.status };
  }

  isDirectMode(): boolean {
    return this.status.directMode;
  }

  isHealthy(): boolean {
    return this.status.isHealthy;
  }

  stopMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  // Get appropriate API URL based on connection status
  getApiUrl(): string {
    if (this.status.directMode) {
      return import.meta.env.VITE_SUPABASE_URL || 'https://ombbxzpyawyyzurhrrjg.supabase.co';
    } else {
      return import.meta.env.VITE_CLOUDFLARE_TUNNEL_URL || 'https://your-app.trycloudflare.com';
    }
  }

  // Make API requests with automatic fallback
  async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const apiUrl = this.getApiUrl();
    const fullUrl = url.startsWith('http') ? url : `${apiUrl}${url}`;

    try {
      const response = await fetch(fullUrl, options);
      
      // If Cloudflare fails, switch to direct mode and retry
      if (!this.status.directMode && !response.ok) {
        console.warn('Cloudflare request failed, switching to direct mode');
        await this.switchToDirectMode();
        
        // Retry with direct URL
        const directUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ombbxzpyawyyzurhrrjg.supabase.co';
        const retryUrl = url.startsWith('http') ? url : `${directUrl}${url}`;
        return fetch(retryUrl, options);
      }
      
      return response;
    } catch (error) {
      // If Cloudflare fails, switch to direct mode and retry
      if (!this.status.directMode) {
        console.warn('Cloudflare request failed, switching to direct mode');
        await this.switchToDirectMode();
        
        const directUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ombbxzpyawyyzurhrrjg.supabase.co';
        const retryUrl = url.startsWith('http') ? url : `${directUrl}${url}`;
        return fetch(retryUrl, options);
      }
      
      throw error;
    }
  }
}

export const cloudflareService = new CloudflareService();
