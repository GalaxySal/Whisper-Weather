import { invoke } from '@tauri-apps/api/core';

export interface LoginRequest {
  email: string;
  password: string;
  deviceInfo?: DeviceInfo;
}

export interface DeviceInfo {
  userAgent: string;
  ipAddress?: string;
  timestamp: number;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  requiresCaptcha: boolean;
  message: string;
}

export interface CaptchaRequest {
  token: string;
  userIp?: string;
}

class AuthService {
  private failedAttempts: Map<string, number> = new Map();
  private lastAttempt: Map<string, number> = new Map();

  async login(request: LoginRequest): Promise<LoginResponse> {
    const deviceInfo = await this.getDeviceInfo();
    const fullRequest = {
      ...request,
      deviceInfo
    };

    try {
      const response = await invoke<LoginResponse>('login_user', { 
        request: fullRequest 
      });

      if (response.success) {
        this.clearFailedAttempts(request.email);
        console.log('Login successful');
      } else if (response.requiresCaptcha) {
        this.recordFailedAttempt(request.email);
        console.log('CAPTCHA required');
      }

      return response;
    } catch (error) {
      this.recordFailedAttempt(request.email);
      console.error('Login failed:', error);
      throw error;
    }
  }

  async verifyCaptcha(token: string, userIp?: string): Promise<boolean> {
    try {
      const result = await invoke<boolean>('verify_captcha', { 
        captchaToken: token,
        userIp 
      });
      return result;
    } catch (error) {
      console.error('CAPTCHA verification failed:', error);
      return false;
    }
  }

  async checkCloudflareHealth(): Promise<boolean> {
    try {
      return await invoke<boolean>('check_cloudflare_health');
    } catch (error) {
      console.error('Cloudflare health check failed:', error);
      return false;
    }
  }

  triggerCaptchaIfNeeded(email: string): boolean {
    const attempts = this.failedAttempts.get(email) || 0;
    const lastAttempt = this.lastAttempt.get(email) || 0;
    const now = Date.now();

    // Check if user had 3 failed attempts in last 5 minutes
    if (attempts >= 3 && (now - lastAttempt) < 300000) {
      return true;
    }

    return false;
  }

  isSuspiciousBehavior(email: string): boolean {
    const attempts = this.failedAttempts.get(email) || 0;
    const lastAttempt = this.lastAttempt.get(email) || 0;
    const now = Date.now();

    // Multiple failed attempts
    if (attempts >= 3) {
      return true;
    }

    // Rapid successive attempts
    if (attempts >= 2 && (now - lastAttempt) < 5000) {
      return true;
    }

    return false;
  }

  private recordFailedAttempt(email: string): void {
    const attempts = this.failedAttempts.get(email) || 0;
    this.failedAttempts.set(email, attempts + 1);
    this.lastAttempt.set(email, Date.now());
  }

  private clearFailedAttempts(email: string): void {
    this.failedAttempts.delete(email);
    this.lastAttempt.delete(email);
  }

  private async getDeviceInfo(): Promise<DeviceInfo> {
    const deviceInfo: DeviceInfo = {
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    };

    // Get IP address (optional, requires external service)
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      deviceInfo.ipAddress = data.ip;
    } catch (error) {
      // IP detection failed, continue without it
      console.warn('Could not detect IP address');
    }

    return deviceInfo;
  }
}

export const authService = new AuthService();
