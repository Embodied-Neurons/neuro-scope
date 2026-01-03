import { useContext } from 'react'
import {
  VisualizationContext,
  VisualizationState
} from '@renderer/context/visualization/VisualizationContext'

export const useVisualization = (): VisualizationState => {
  const ctx = useContext(VisualizationContext)
  if (!ctx) throw new Error('useVisualizer must be used inside VisualizerProvider')
  return ctx
}
