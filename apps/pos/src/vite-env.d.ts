/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    isElectron: boolean;
    getVersion: () => Promise<string>;
    toggleFullScreen: () => Promise<boolean>;
    printReceipt: (options?: any) => Promise<{ success: boolean; failureReason?: string }>;
    onUpdateAvailable: (callback: (info: any) => void) => void;
    onUpdateDownloaded: (callback: (info: any) => void) => void;
    restartAppForUpdate: () => Promise<void>;
  };
}
