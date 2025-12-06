import { useNavigate } from 'react-router-dom'
import { JSX, useState } from 'react'
import { NeuralGraph } from '../components/NeuralGraph'
import { StatsPanel } from '../components/StatsPanel'
import ImageFileSelector from '../components/ImageFileSelector'
import EpochControls from '../components/EpochControls'
import { useModel } from '@renderer/context/useModel'

export default function VisualizerPage(): JSX.Element {
  const navigate = useNavigate()
  const { modelName, outputDir, epochs } = useModel()

  const [selectedNode, setSelectedNode] = useState<Record<string, unknown> | null>(null)
  const [epoch, setEpoch] = useState(0)

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100">
      <div className="flex justify-between items-center p-4 bg-white shadow border-b border-gray-200">
        <h2 className="text-xl font-semibold">Neural Graph Visualization</h2>
        <button
          onClick={() => navigate('/')}
          className="bg-black text-white rounded-lg px-3 py-1 hover:bg-gray-700 transition"
        >
          Back to Home
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden p-4 gap-4">
        <div className="w-2/3 h-full bg-white rounded-xl shadow overflow-hidden">
          <NeuralGraph epoch={epoch} onNodeSelect={setSelectedNode} outputDir={outputDir} />
        </div>

        <div className="w-1/3 flex flex-col gap-4 h-full overflow-y-auto">
          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="font-semibold mb-2 text-black">Epoch Controls</h3>
            <EpochControls maxEpoch={epochs} onSelectEpoch={setEpoch} outputDir={outputDir} />
          </div>

          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="font-semibold mb-2 text-black">Feed Image to Model</h3>
            <ImageFileSelector outputDir={outputDir} modelName={modelName} onSelect={setEpoch} />
          </div>

          <div className="bg-white p-4 rounded-xl shadow flex-1">
            <h3 className="font-semibold mb-2 text-black">Node Stats</h3>
            <StatsPanel nodeData={selectedNode} />
          </div>
        </div>
      </div>
    </div>
  )
}
