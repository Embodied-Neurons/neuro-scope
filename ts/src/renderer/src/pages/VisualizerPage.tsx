import { useLocation, useNavigate } from 'react-router-dom'
import { JSX, useState } from 'react'
import { NeuralGraph } from '../components/NeuralGraph'
import { StatsPanel } from '../components/StatsPanel'
import ImageFileSelector from '../components/ImageFileSelector'
import EpochControls from '../components/EpochControls'

export default function VisualizerPage(): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const outputDir = location.state?.outputDir || ''
  const modelName = location.state?.modelName || ''

  const [selectedNode, setSelectedNode] = useState<Record<string, unknown> | null>(null)
  const [epoch, setEpoch] = useState(0)

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold">Neural Graph Visualization</h2>
        <button
          onClick={() => navigate('/')}
          className="bg-white text-black rounded-lg px-3 py-1 hover:bg-gray-200 transition"
        >
          Back to Home
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[70vw] overflow-hidden">
          <NeuralGraph epoch={epoch} onNodeSelect={setSelectedNode} outputDir={outputDir} />
        </div>
        <div className="w-[30vw] p-2 shrink-0 overflow-y-auto">
          <EpochControls maxEpoch={10} onSelectEpoch={setEpoch} outputDir={outputDir} />
          <ImageFileSelector outputDir={outputDir} modelName={modelName} onSelect={setEpoch} />
          <StatsPanel nodeData={selectedNode} />
        </div>
      </div>
    </div>
  )
}
