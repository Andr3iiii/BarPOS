import { app, BrowserWindow, ipcMain, Menu, dialog } from 'electron';
import path from 'path';
import { autoUpdater } from 'electron-updater';

let mainWindow: BrowserWindow | null = null;

// Configure autoUpdater defaults
autoUpdater.autoDownload = false; // Do not download automatically in the background
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

autoUpdater.on('download-progress', (progressObj) => {
  console.log('[AutoUpdater] Download progress:', Math.round(progressObj.percent) + '%');
  if (mainWindow) {
    mainWindow.webContents.send('download-progress', progressObj);
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
      buttons: ['Restart & Install Now', 'Later'],
      defaultId: 0,
      cancelId: 1,
      noLink: true
    });

    if (response === 0) {
      // User clicked "Restart & Install Now"
      autoUpdater.quitAndInstall(false, true);
    }
  } catch (err) {
    console.warn('[AutoUpdater] Dialog error:', err);
  }
});

ipcMain.handle('start-download-update', async () => {
  try {
    console.log('[AutoUpdater] Manual download initiated by user');
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (err: any) {
    console.error('[AutoUpdater] Download error:', err);
    return { success: false, error: err.message };
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
    const remoteVersion = result?.updateInfo?.version;
    const currentVersion = app.getVersion();
    const isNewer = Boolean(remoteVersion && remoteVersion !== currentVersion);
    return {
      available: isNewer,
      version: remoteVersion || currentVersion,
      info: result?.updateInfo,
      message: isNewer
        ? `Found update v${remoteVersion}! Ready to download.`
        : `BarPOS is up-to-date (v${currentVersion}).`
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
