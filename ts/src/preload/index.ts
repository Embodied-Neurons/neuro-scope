import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
// Custom APIs for renderer
const api = {
  getNeuralNetworkVisualization: (outputDir: string, batch: number) =>
    ipcRenderer.invoke('getNeuralNetworkVisualization', outputDir, batch),

  getCompressedNeuralNetworkData: (
    sizes: number[],
    count?: number,
    outputDir?: string,
    batch?: number
  ) => ipcRenderer.invoke('getCompressedNeuralNetworkData', sizes, count, outputDir, batch),
  detectBatch: (outputDir: string, batch: number) =>
    ipcRenderer.invoke('detectBatch', outputDir, batch)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
