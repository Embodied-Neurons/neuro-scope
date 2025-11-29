import { Routes, Route, HashRouter } from 'react-router-dom'
import VisualizerPage from './pages/VisualizerPage'
import DemoPage from './pages/DemoPage'
import InstructionPage from './pages/InstructionPage'
import MainPage from './pages/MainPage'
import { JSX } from 'react'

export default function App(): JSX.Element {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/visualizer" element={<VisualizerPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/instructions" element={<InstructionPage />} />
      </Routes>
    </HashRouter>
  )
}
