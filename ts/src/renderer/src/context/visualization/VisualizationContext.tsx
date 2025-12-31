import { createContext, type RefObject } from 'react'
import Graph from 'graphology'

export type VisualizationState = {
  epoch: number
  setEpoch: (epoch: number) => void
  imagePath: string
  setImagePath: (imagePath: string) => void
  graphRefVis: RefObject<Graph | null>
  graphRefImg: RefObject<Graph | null>
  clear: () => void
}

export const VisualizationContext = createContext<VisualizationState | undefined>(undefined)
