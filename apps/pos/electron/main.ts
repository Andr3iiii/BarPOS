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
    autoHideMenuBar: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (process.env.ELECTRON_START_URL) {
    console.log(`[Electron Main] Loading Dev URL: ${process.env.ELECTRON_START_URL}`);
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log(`[Electron Main] Loading File: ${indexPath}`);
    mainWindow.loadFile(indexPath);
  }

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

// POS Hardware / System IPC Handlers
ipcMain.handle('print-receipt', async (_event, options) => {
  if (mainWindow) {
    return new Promise((resolve) => {
      mainWindow?.webContents.print(
        {
          silent: false,
          printBackground: true,
          ...options
        },
        (success, failureReason) => {
          resolve({ success, failureReason });
        }
      );
    });
  }
  return { success: false, failureReason: 'No window available' };
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('toggle-fullscreen', () => {
  if (mainWindow) {
    const current = mainWindow.isFullScreen();
    mainWindow.setFullScreen(!current);
    return !current;
  }
  return false;
});

// Auto-updater event handlers
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
