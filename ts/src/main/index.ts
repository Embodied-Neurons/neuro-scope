import { app, shell, BrowserWindow, ipcMain, dialog, screen } from 'electron'
import path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { performTrainingIfNeeded } from '../renderer/utils/training_util'
import { runImageInput } from '../renderer/utils/image_input_util'
import {
  getNeuralNetworkVisualization,
  getActivationsFromImageInput
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

  ipcMain.handle('getNeuralNetworkVisualization', (_event, outputDir: string, epoch: number) => {
    return getNeuralNetworkVisualization(outputDir, epoch)
  })

  ipcMain.handle('getActivationsFromImageInput', (_event, outputDir: string) => {
    return getActivationsFromImageInput(outputDir)
  })

  ipcMain.handle(
    'performTrainingIfNeeded',
    (_event, outputDir: string, modelName: string, epochs: number) => {
      return performTrainingIfNeeded(outputDir, modelName, epochs)
    }
  )

  ipcMain.handle('showImageFileDialog', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)!
    const result = await dialog.showOpenDialog(window, {
      title: 'Select image file',
      properties: ['openFile'],
      filters: [
        { name: 'Supported image files', extensions: ['jpg', 'jpeg', 'png', 'bmp'] },
        { name: 'All files', extensions: ['*'] }
      ]
    })

    if (result.canceled) {
      return
    } else {
      return result.filePaths[0]
    }
  })

  ipcMain.handle(
    'runImageInput',
    (_event, outputDir: string, modelName: string, imagePath: string) => {
      return runImageInput(outputDir, modelName, imagePath)
    }
  )

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
