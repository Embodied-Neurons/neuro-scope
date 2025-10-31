import { ElectronAPI } from '@electron-toolkit/preload'
import * as types from '../renderer/utils/types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getNeuralNetworkVisualization(batch: number): Promise<types.NeuralNetworkData>
      getCompressedNeuralNetworkData(
        sizes: number[],
        count?: number,
        batch?: number
      ): Promise<types.CompressedData>
      detectBatch(batch: number): Promise<null>
    }
  }
}
