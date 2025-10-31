import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getNeuralNetworkVisualization(batch: number): Promise<any>
      getCompressedNeuralNetworkData(sizes: number[], count?: number, batch?: number): Promise<any>
      detectBatch(batch: Number): Promise<any>
    }
  }
}
