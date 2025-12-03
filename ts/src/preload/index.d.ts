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
      detectEpoch(outputDir: string, epoch: number): Promise<null>
      performTrainingIfNeeded(outputDir: string, modelName: string): void
      showImageFileDialog(): string | undefined
      runImageInput(outputDir: string, modelName: string, imagePath: string): void
    }
  }
}
