import { ElectronAPI } from '@electron-toolkit/preload'
import * as types from '../renderer/utils/types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getNeuralNetworkVisualization(
        outputDir: string,
        batch: number
      ): Promise<types.NeuralNetworkData>
      getCompressedNeuralNetworkData(
        sizes: number[],
        count?: number,
        outputDir?: string,
        batch?: number
      ): Promise<types.CompressedData>
      detectBatch(outputDir: string, batch: number): Promise<null>
      performTrainingIfNeeded(outputDir: string, modelName: string): void
    }
  }
}
