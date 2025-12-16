import { invoke } from '@tauri-apps/api/core';
import { isTauri } from '@/lib/platform';

export interface UpdateInfo {
  version: string;
  body?: string;
  date: string;
}

export class UpdaterService {
  async checkForUpdates(): Promise<string | null> {
    if (!isTauri()) return null;
    
    try {
      const result = await invoke<string | null>('check_for_updates');
      return result;
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return null;
    }
  }

  async installUpdate(): Promise<string> {
    if (!isTauri()) {
      throw new Error('Updater not available in browser');
    }
    
    try {
      const result = await invoke<string>('install_update');
      return result;
    } catch (error) {
      console.error('Failed to install update:', error);
      throw error;
    }
  }

  // Auto updater runs in background, this is just for manual checks
  async isAutoUpdaterEnabled(): Promise<boolean> {
    return isTauri();
  }
}

export const updaterService = new UpdaterService();
