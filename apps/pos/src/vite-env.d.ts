/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    isElectron: boolean;
    getVersion: () => Promise<string>;
    toggleFullScreen: () => Promise<boolean>;
    printReceipt: (options?: any) => Promise<{ success: boolean; failureReason?: string }>;
    onUpdateAvailable: (callback: (info: any) => void) => void;
    onUpdateDownloaded: (callback: (info: any) => void) => void;
    onDownloadProgress: (callback: (progress: {
      bytesPerSecond: number;
      percent: number;
      total: number;
      transferred: number;
    }) => void) => void;
    startDownloadUpdate: () => Promise<{ success: boolean; error?: string }>;
    restartAppForUpdate: () => Promise<void>;
    checkForUpdates: () => Promise<{ available?: boolean; version?: string; message?: string; error?: string; info?: any }>;
  };
}
