import { app, BrowserWindow, ipcMain, Menu, dialog } from 'electron';
import path from 'path';
import { autoUpdater } from 'electron-updater';

let mainWindow: BrowserWindow | null = null;

// Configure autoUpdater defaults
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'The Velvet Tap — Bar POS & Admin Terminal',
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

  // Check for updates when packaged application launches
  if (app.isPackaged) {
    setTimeout(() => {
      try {
        autoUpdater.checkForUpdates();
      } catch (e) {
        console.warn('[AutoUpdater] Initial check failed:', e);
      }
    }, 4000);
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
  console.log('[AutoUpdater] Update available:', info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update-available', info);
  }
});

autoUpdater.on('update-downloaded', async (info) => {
  console.log('[AutoUpdater] Update downloaded:', info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded', info);
  }

  // Native application.exe modal popup: ask user to update now or later
  try {
    const { response } = await dialog.showMessageBox(mainWindow || (undefined as any), {
      type: 'info',
      title: 'Update Ready — BarPOS Terminal',
      message: `A new version (v${info.version}) of BarPOS Terminal has been downloaded!`,
      detail: 'Would you like to restart the application now to install the update, or continue working and update later?',
      buttons: ['Update Now', 'Later'],
      defaultId: 0,
      cancelId: 1,
      noLink: true
    });

    if (response === 0) {
      // User clicked "Update Now"
      autoUpdater.quitAndInstall(false, true);
    }
    // If response === 1 ("Later"), dialog closes and app continues running normally
  } catch (err) {
    console.warn('[AutoUpdater] Dialog error:', err);
  }
});

ipcMain.handle('restart-app-for-update', () => {
  autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle('check-for-updates', async () => {
  if (!app.isPackaged) {
    return { available: false, version: app.getVersion(), message: 'Running in development mode.' };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    return {
      available: Boolean(result?.updateInfo),
      version: result?.updateInfo?.version || app.getVersion(),
      info: result?.updateInfo
    };
  } catch (err: any) {
    return { available: false, error: err.message };
  }
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
