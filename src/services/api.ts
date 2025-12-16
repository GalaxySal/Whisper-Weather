import { invoke } from '@tauri-apps/api/core';

export interface WeatherRequest {
  city: string;
  units?: string; // metric, imperial, kelvin
}

export interface WeatherData {
  city: string;
  temperature: number;
  condition: string;
  humidity: number;
  wind_speed: number;
  feels_like: number;
  pressure: number;
  visibility: number;
  uv_index: number;
  sunrise: number;
  sunset: number;
  timestamp: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
}

class ApiService {
  async getWeather(request: WeatherRequest): Promise<ApiResponse<WeatherData>> {
    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;
    
    if (!isTauri) {
      // Fallback for browser - simulate data
      return {
        success: true,
        data: {
          city: request.city,
          temperature: 22.5,
          condition: 'Partly Cloudy',
          humidity: 65,
          wind_speed: 12.3,
          feels_like: 21,
          pressure: 1013,
          visibility: 10000,
          uv_index: 5,
          sunrise: Math.floor(Date.now() / 1000) - 21600,
          sunset: Math.floor(Date.now() / 1000) + 21600,
          timestamp: Math.floor(Date.now() / 1000),
        },
        message: 'Success (Browser Mode)',
      };
    }

    try {
      const response = await invoke<ApiResponse<WeatherData>>('get_weather', { request });
      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async searchCities(query: string): Promise<ApiResponse<string[]>> {
    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;
    
    if (!isTauri) {
      // Fallback for browser - simulate city search
      return {
        success: true,
        data: [
          `${query} (Main City)`,
          `${query} (North District)`,
          `${query} (South District)`,
          `${query} (East District)`,
          `${query} (West District)`,
        ],
        message: 'Success (Browser Mode)',
      };
    }

    try {
      const response = await invoke<ApiResponse<string[]>>('search_weather_cities', { query });
      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async checkAuthStatus(): Promise<ApiResponse<{ authenticated: boolean; user_id?: string; session_expires?: number }>> {
    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;
    
    if (!isTauri) {
      return {
        success: true,
        data: {
          authenticated: false,
          user_id: undefined,
          session_expires: undefined,
        },
        message: 'Success (Browser Mode)',
      };
    }

    try {
      const response = await invoke('check_auth_status') as ApiResponse<{ authenticated: boolean; user_id?: string; session_expires?: number }>;
      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async refreshSession(): Promise<ApiResponse<string>> {
    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;
    
    if (!isTauri) {
      return {
        success: true,
        message: 'Session refreshed (Browser Mode)',
      };
    }

    try {
      const response = await invoke('refresh_session') as ApiResponse<string>;
      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async healthCheck(): Promise<ApiResponse<Record<string, string>>> {
    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;
    
    if (!isTauri) {
      return {
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          uptime: '0s',
          platform: 'browser',
        },
        message: 'Success (Browser Mode)',
      };
    }

    try {
      const response = await invoke('api_health_check') as ApiResponse<Record<string, string>>;
      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getApiConfig(): Promise<ApiResponse<Record<string, string>>> {
    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;
    
    if (!isTauri) {
      return {
        success: true,
        data: {
          api_version: 'v1',
          rate_limit: '100/hour',
          features: 'weather,auth',
          platform: 'browser',
        },
        message: 'Success (Browser Mode)',
      };
    }

    try {
      const response = await invoke('get_api_config') as ApiResponse<Record<string, string>>;
      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const apiService = new ApiService();
