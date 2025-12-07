import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ModelProvider } from '@renderer/context/ModelProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ModelProvider>
      <App />
    </ModelProvider>
  </StrictMode>
)
