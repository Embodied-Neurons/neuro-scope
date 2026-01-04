import { ElectronAPI } from '@electron-toolkit/preload'
import * as types from '../renderer/utils/types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getNeuralNetworkVisualization(
        outputDir: string,
        epoch: number
      ): Promise<types.NeuralNetworkData>
      getActivationsFromImageInput(outputDir: string): Promise<types.NeuralNetworkData>
      performTrainingIfNeeded(outputDir: string, modelName: string, epochs: number): void
      showImageFileDialog(): string | undefined
      runImageInput(outputDir: string, modelName: string, imagePath: string): void
      listFilesInDirectory(dir: string): Promise<string[]>
    }
  }
}
