import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path from 'path';
import { autoUpdater } from 'electron-updater';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'The Velvet Tap — Bar POS Terminal',
    backgroundColor: '#0c0e17',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;

  console.log(`[Electron Main] Loading URL: ${startUrl}`);
  mainWindow.loadURL(startUrl);

  // Open DevTools in dev mode
  if (process.env.ELECTRON_START_URL) {
    // mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Setup auto updater checks if in production
  if (app.isPackaged) {
    try {
      autoUpdater.checkForUpdatesAndNotify();
    } catch (e) {
      console.warn('Auto updater check failed:', e);
    }
  }
}

// Auto-updater event handlers (Section 28)
autoUpdater.on('update-available', (info) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-available', info);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded', info);
  }
});

ipcMain.handle('restart-app-for-update', () => {
  autoUpdater.quitAndInstall(false, true);
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
