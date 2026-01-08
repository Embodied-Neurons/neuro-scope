import NeuralGraph from '@renderer/components/visualization/NeuralGraph'
import EpochControls from '@renderer/components/visualization/EpochControls'
import AnomalySlider from '@renderer/components/visualization/AnomalySlider'
import StatsPanel from '@renderer/components/visualization/StatsPanel'
import { useModel } from '@renderer/context/model/useModel'
import { JSX, useState } from 'react'
import { useVisualization } from '@renderer/context/visualization/useVisualization'

export default function VisualizationView(): JSX.Element {
  const { outputDir, epochs } = useModel()
  const { epoch, setEpoch, graphRefVis } = useVisualization()

  const [highlightTop, setHighlightTop] = useState(false)
  const [highlightBottom, setHighlightBottom] = useState(false)
  const [highlightPercent, setHighlightPercent] = useState(10)
  const [selectedNodeVis, setSelectedNodeVis] = useState<Record<string, unknown> | null>(null)

  return (
    <div className="flex flex-1 gap-4 overflow-hidden p-4">
      <div className="bg-primary h-full w-2/3 overflow-hidden rounded-xl shadow">
        <NeuralGraph
          epoch={epoch}
          onNodeSelect={setSelectedNodeVis}
          outputDir={outputDir}
          highlightTop={highlightTop}
          highlightBottom={highlightBottom}
          highlightPercent={highlightPercent}
          graphRef={graphRefVis}
          onToggleTop={setHighlightTop}
          onToggleBottom={setHighlightBottom}
        />
      </div>

      <div className="flex h-full w-1/3 flex-col gap-4 overflow-y-auto">
        <div className="rounded-xl bg-white p-4 shadow">
          <h3 className="text-primary mb-2 font-semibold">Epoch Controls</h3>
          <EpochControls currentEpoch={epoch} maxEpoch={epochs} onSelectEpoch={setEpoch} />
        </div>

        <div className="rounded-xl bg-white p-4 shadow">
          <h3 className="text-primary mb-2 font-semibold">Activation Highlights</h3>
          <AnomalySlider
            highlightTop={highlightTop}
            highlightBottom={highlightBottom}
            percent={highlightPercent}
            onToggleTop={setHighlightTop}
            onToggleBottom={setHighlightBottom}
            onChangePercent={setHighlightPercent}
          />
        </div>

        <div className="flex-1 rounded-xl bg-white p-4 shadow">
          <h3 className="text-primary mb-2 font-semibold">Neuron Stats</h3>
          <StatsPanel nodeData={selectedNodeVis} graphRef={graphRefVis} allowGrads={true} />
        </div>
      </div>
    </div>
  )
}
