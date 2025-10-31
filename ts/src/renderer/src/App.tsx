import { JSX, useState } from 'react'
import BatchControls from './components/BatchControls'
import { NeuralGraph } from './components/NeuralGraph'
import { StatsPanel } from './components/StatsPanel'

export default function App(): JSX.Element {
  const [batch, setBatch] = useState(0)
  const [selectedNode, setSelectedNode] = useState<Record<string, unknown> | null>(null)

  return (
    <div className="flex h-screen">
      <div className="w-36 p-4">
        <BatchControls onSelectBatch={setBatch} maxBatch={10} />
      </div>
      <div className="flex-1">
        <NeuralGraph batch={batch} onNodeSelect={setSelectedNode} />
      </div>
      <div className="flex-1 p-4 overflow-auto">
        <StatsPanel nodeData={selectedNode} />
      </div>
    </div>
  )
}
