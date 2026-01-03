import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ModelProvider } from '@renderer/context/model/ModelProvider'
import { VisualizationProvider } from '@renderer/context/visualization/VisualizationProvider'
import { NeuralAnimationProvider } from '@renderer/context/animation/NeuralAnimationProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ModelProvider>
      <VisualizationProvider>
        <NeuralAnimationProvider>
          <App />
        </NeuralAnimationProvider>
      </VisualizationProvider>
    </ModelProvider>
  </StrictMode>
)
