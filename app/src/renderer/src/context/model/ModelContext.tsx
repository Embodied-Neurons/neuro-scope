import { createContext } from 'react'

export type ModelContextType = {
  outputDir: string
  setOutputDir: React.Dispatch<React.SetStateAction<string>>
  modelName: string
  setModelName: React.Dispatch<React.SetStateAction<string>>
  epochs: number
  setEpochs: React.Dispatch<React.SetStateAction<number>>
}

export const ModelContext = createContext<ModelContextType>({
  outputDir: '',
  setOutputDir: () => {},
  modelName: '',
  setModelName: () => {},
  epochs: 0,
  setEpochs: () => {}
})
