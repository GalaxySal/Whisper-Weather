/**
 * Platform detection utilities
 */

declare global {
  interface Window {
    __TAURI__?: any;
  }
}

export const isBrowser = (): boolean => {
  return typeof window !== 'undefined' && typeof window.__TAURI__ === 'undefined';
};

export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && typeof window.__TAURI__ !== 'undefined';
};

export const isWeb = (): boolean => {
  return isBrowser();
};

export const isDesktop = (): boolean => {
  return isTauri();
};

export const getPlatform = (): 'browser' | 'tauri' | 'unknown' => {
  if (isTauri()) return 'tauri';
  if (isBrowser()) return 'browser';
  return 'unknown';
};

export const canOpenExternalURL = (): boolean => {
  return isTauri();
};

export const canAccessSystemInfo = (): boolean => {
  return isTauri();
};

export const canAccessFileSystem = (): boolean => {
  return isTauri();
};

export const canShowNotifications = (): boolean => {
  return isTauri() || ('Notification' in window && Notification.permission === 'granted');
};

export const getPlatformFeatures = () => {
  const platform = getPlatform();
  
  return {
    platform,
    isBrowser: isBrowser(),
    isTauri: isTauri(),
    canOpenExternalURL: canOpenExternalURL(),
    canAccessSystemInfo: canAccessSystemInfo(),
    canAccessFileSystem: canAccessFileSystem(),
    canShowNotifications: canShowNotifications(),
    supportsTauriAPIs: isTauri(),
    supportsWebAPIs: isBrowser(),
  };
};
