import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getVersion: () => ipcRenderer.invoke('get-app-version'),
  toggleFullScreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  printReceipt: (options?: any) => ipcRenderer.invoke('print-receipt', options),
  onUpdateAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update-available', (_event, value) => callback(value));
  },
  onUpdateDownloaded: (callback: (info: any) => void) => {
    ipcRenderer.on('update-downloaded', (_event, value) => callback(value));
  },
  onDownloadProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('download-progress', (_event, value) => callback(value));
  },
  startDownloadUpdate: () => ipcRenderer.invoke('start-download-update'),
  restartAppForUpdate: () => ipcRenderer.invoke('restart-app-for-update'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates')
});
