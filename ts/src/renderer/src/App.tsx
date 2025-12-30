import { Routes, Route, HashRouter } from 'react-router-dom'
import DemoPage from './pages/DemoPage'
import InstructionPage from './pages/InstructionPage'
import MainPage from './pages/MainPage'
import { JSX } from 'react'
import VisualizationView from '@renderer/pages/visualizer/VisualizationView'
import VisualizerLayout from '@renderer/pages/visualizer/VisualizerLayout'
import ImageInputView from '@renderer/pages/visualizer/ImageInputView'
import AnimationView from '@renderer/pages/visualizer/AnimationView'

export default function App(): JSX.Element {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/instructions" element={<InstructionPage />} />

        <Route path="/visualizer" element={<VisualizerLayout />}>
          <Route index element={<VisualizationView />} />
          <Route path="image-input" element={<ImageInputView />} />
          <Route path="animation" element={<AnimationView />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
