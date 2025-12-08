import { invoke } from '@tauri-apps/api/core';

export interface TunnelConfig {
  main_domain: string;
  subdomain: string;
  target_port: number;
  health_check_path: string;
  fallback_urls: string[];
}

export interface TunnelStatus {
  is_active: boolean;
  current_mode: 'MainDomain' | 'Fallback' | 'Direct';
  main_domain_status: boolean;
  fallback_status: boolean;
  last_check: number;
  response_time_ms: number;
}

export enum TunnelMode {
  MainDomain = 'MainDomain',
  Fallback = 'Fallback',
  Direct = 'Direct'
}

class TunnelService {
  private config: TunnelConfig | null = null;
  private status: TunnelStatus | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

  async initialize(): Promise<void> {
    try {
      // Get initial config and status
      this.config = await this.getConfig();
      this.status = await this.getStatus();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      console.log('Tunnel service initialized', { config: this.config, status: this.status });
    } catch (error) {
      console.error('Failed to initialize tunnel service:', error);
      
      // Fallback config for single domain
      this.config = {
        main_domain: 'https://www.zentaira.com', // www yönlendirmesi
        subdomain: 'whisper-weather',
        target_port: 3000,
        health_check_path: '/', // Ana sayfayı kontrol et
        fallback_urls: ['https://zentaira.com']
      };
    }
  }

  async getConfig(): Promise<TunnelConfig> {
    try {
      return await invoke<TunnelConfig>('get_tunnel_config');
    } catch (error) {
      console.error('Failed to get tunnel config:', error);
      throw error;
    }
  }

  async updateConfig(config: TunnelConfig): Promise<void> {
    try {
      await invoke('update_tunnel_config', { config });
      this.config = config;
      console.log('Tunnel config updated', config);
    } catch (error) {
      console.error('Failed to update tunnel config:', error);
      throw error;
    }
  }

  async getStatus(): Promise<TunnelStatus> {
    try {
      const status = await invoke<TunnelStatus>('get_tunnel_status');
      this.status = status;
      return status;
    } catch (error) {
      console.error('Failed to get tunnel status:', error);
      throw error;
    }
  }

  async checkHealth(): Promise<TunnelStatus> {
    try {
      const status = await invoke<TunnelStatus>('check_tunnel_health');
      this.status = status;
      return status;
    } catch (error) {
      console.error('Failed to check tunnel health:', error);
      throw error;
    }
  }

  async switchMode(mode: TunnelMode): Promise<void> {
    try {
      await invoke('switch_tunnel_mode', { mode });
      console.log('Switched to tunnel mode:', mode);
      
      // Refresh status after mode switch
      await this.getStatus();
    } catch (error) {
      console.error('Failed to switch tunnel mode:', error);
      throw error;
    }
  }

  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.checkHealth();
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, this.HEALTH_CHECK_INTERVAL);
  }

  // Get the best available URL for general API requests
  getApiUrl(): string {
    // Only use tunnel for health checks, not for API requests
    // API requests should go directly to the backend
    const port = this.config?.target_port || 1420;
    
    // In production Tauri, use tauri://localhost for API calls
    if (typeof window !== 'undefined' && window.__TAURI__) {
      return 'tauri://localhost/api';
    }
    
    return `http://localhost:${port}/api`;
  }

  // Get the weather API URL (direct to weather service)
  getWeatherApiUrl(): string {
    // Weather API should go directly to weather service, not through Zentaira
    const port = this.config?.target_port || 1420;
    
    // In production Tauri, use tauri://localhost for API calls
    if (typeof window !== 'undefined' && window.__TAURI__) {
      return 'tauri://localhost/api/weather';
    }
    
    return `http://localhost:${port}/api/weather`;
  }

  // Get the auth API URL (direct to auth service)
  getAuthApiUrl(): string {
    // Auth API should go directly to auth service, not through Zentaira
    const port = this.config?.target_port || 1420;
    
    // In production Tauri, use tauri://localhost for API calls
    if (typeof window !== 'undefined' && window.__TAURI__) {
      return 'tauri://localhost/api/auth';
    }
    
    return `http://localhost:${port}/api/auth`;
  }

  // Make API requests with automatic fallback
  async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    // For API requests, always use the appropriate backend URL
    // Tunnel is only for health checks and routing status
    const port = this.config?.target_port || 1420;
    
    // In production Tauri, use tauri://localhost for API calls
    let fullUrl: string;
    if (typeof window !== 'undefined' && window.__TAURI__) {
      fullUrl = url.startsWith('http') || url.startsWith('tauri://') ? url : `tauri://localhost${url}`;
    } else {
      fullUrl = url.startsWith('http') ? url : `http://localhost:${port}${url}`;
    }

    try {
      const response = await fetch(fullUrl, options);
      
      // If request fails and we're not already in fallback mode, try fallback
      if (!response.ok && this.status?.current_mode !== TunnelMode.Fallback) {
        console.warn('Main domain request failed, trying fallback');
        await this.switchMode(TunnelMode.Fallback);
        
        // Retry with fallback URL
        const fallbackUrl = url.startsWith('http') || url.startsWith('tauri://') ? url : 
          (typeof window !== 'undefined' && window.__TAURI__ ? `tauri://localhost${url}` : `http://localhost:${port}${url}`);
        return await fetch(fallbackUrl, options);
      }
      
      return response;
    } catch (error) {
      // If request fails and we're not already in fallback mode, try fallback
      if (this.status?.current_mode !== TunnelMode.Fallback) {
        console.warn('Main domain request failed, trying fallback');
        await this.switchMode(TunnelMode.Fallback);
        
        const fallbackUrl = url.startsWith('http') || url.startsWith('tauri://') ? url : 
          (typeof window !== 'undefined' && window.__TAURI__ ? `tauri://localhost${url}` : `http://localhost:${port}${url}`);
        return await fetch(fallbackUrl, options);
      }
      
      throw error;
    }
  }

  // Get current status for UI display
  getCurrentStatus(): TunnelStatus | null {
    return this.status;
  }

  // Get current config for UI display
  getCurrentConfig(): TunnelConfig | null {
    return this.config;
  }

  // Check if tunnel is healthy
  isHealthy(): boolean {
    return this.status?.is_active ?? false;
  }

  // Get current mode for UI
  getCurrentMode(): TunnelMode {
    return this.status?.current_mode as TunnelMode ?? TunnelMode.MainDomain;
  }

  // Get response time for UI
  getResponseTime(): number {
    return this.status?.response_time_ms ?? 0;
  }

  stopMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

export const tunnelService = new TunnelService();
