import { JSX, useState } from 'react'
import BatchControls from './components/BatchControls'
import FileSelector from './components/FileSelector'
import { NeuralGraph } from './components/NeuralGraph'
import { StatsPanel } from './components/StatsPanel'

export default function App(): JSX.Element {
  const [batch, setBatch] = useState(0)
  const [selectedNode, setSelectedNode] = useState<Record<string, unknown> | null>(null)
  const [outputDir, saveOutputDir] = useState<string>('outputs')

  return (
    <div className="flex h-screen">
      <div className="w-[10vw] p-2 shrink-0">
        <BatchControls onSelectBatch={setBatch} maxBatch={10} outputDir={outputDir} />
        <FileSelector onFileSelect={saveOutputDir} />
      </div>
      <div className="w-[60vw] overflow-hidden">
        <NeuralGraph batch={batch} onNodeSelect={setSelectedNode} outputDir={outputDir} />
      </div>
      <div className="w-[30vw] p-2 overflow-auto shrink-0">
        <StatsPanel nodeData={selectedNode} />
      </div>
    </div>
  )
}
