import { app, shell, BrowserWindow, ipcMain, screen } from 'electron'
import path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { performTrainingIfNeeded } from '../renderer/utils/training_util'
import {
  getNeuralNetworkVisualization,
  getCompressedNeuralNetworkData,
  detectBatch
} from '../renderer/utils/network_utils'

export const OUTPUT_DIR_BASE = path.join(app.getAppPath(), '..')

function createWindow(): void {
  const display = screen.getPrimaryDisplay()
  const workArea = display.workArea

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    x: workArea.x,
    y: workArea.y,
    width: workArea.width,
    height: workArea.height,
    frame: true,
    resizable: false,
    minimizable: true,
    maximizable: false,
    fullscreenable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      devTools: true, // set to true to inspect alements
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    // Hiding menu bar
    mainWindow.setMenuBarVisibility(false)

    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('getNeuralNetworkVisualization', (_event, outputDir: string, batch: number) => {
    return getNeuralNetworkVisualization(outputDir, batch)
  })

  ipcMain.handle(
    'getCompressedNeuralNetworkData',
    (_event, sizes: number[], count?: number, outputDir?: string, batch?: number) => {
      return getCompressedNeuralNetworkData(sizes, count, outputDir, batch)
    }
  )

  ipcMain.handle('detectBatch', (_event, outputDir: string, batch: number) => {
    return detectBatch(outputDir, batch)
  })

  ipcMain.handle('performTrainingIfNeeded', (_event, outputDir: string, modelName: string) => {
    return performTrainingIfNeeded(outputDir, modelName)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
