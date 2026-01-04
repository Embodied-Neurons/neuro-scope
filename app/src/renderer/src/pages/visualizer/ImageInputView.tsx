import StatsPanel from '@renderer/components/visualization/StatsPanel'
import AnomalySlider from '@renderer/components/visualization/AnomalySlider'
import ImageFileSelector from '@renderer/components/ImageFileSelector'
import NeuralImageInput from '@renderer/components/NeuralImageInput'
import { JSX, useState } from 'react'
import { useModel } from '@renderer/context/model/useModel'
import { useVisualization } from '@renderer/context/visualization/useVisualization'

export default function ImageInputView(): JSX.Element {
  const { modelName, outputDir } = useModel()
  const { graphRefImg, imagePath, setImagePath } = useVisualization()

  const [highlightTop, setHighlightTop] = useState(false)
  const [highlightBottom, setHighlightBottom] = useState(false)
  const [highlightPercent, setHighlightPercent] = useState(10)
  const [selectedNodeImg, setSelectedNodeImg] = useState<Record<string, unknown> | null>(null)

  return (
    <div className="flex flex-1 gap-4 overflow-hidden p-4">
      {imagePath && (
        <div className="bg-primary h-full w-2/3 overflow-hidden rounded-xl shadow">
          <NeuralImageInput
            imagePath={imagePath}
            onNodeSelect={setSelectedNodeImg}
            outputDir={outputDir}
            highlightTop={highlightTop}
            highlightBottom={highlightBottom}
            highlightPercent={highlightPercent}
            graphRef={graphRefImg}
          />
        </div>
      )}

      {!imagePath && (
        <div className="bg-primary flex h-full w-2/3 items-center justify-center overflow-hidden rounded-xl shadow">
          <p className="text-lg text-white italic">No image selected. Please select an image.</p>
        </div>
      )}

      <div className="flex h-full w-1/3 flex-col gap-4 overflow-y-auto">
        <div className="rounded-xl bg-white p-4 shadow">
          <h3 className="text-primary mb-2 font-semibold">Feed Image to Model</h3>
          <ImageFileSelector outputDir={outputDir} modelName={modelName} onSelect={setImagePath} />
        </div>

        {imagePath && (
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
        )}

        {imagePath && (
          <div className="flex-1 rounded-xl bg-white p-4 shadow">
            <h3 className="text-primary mb-2 font-semibold">Node Stats</h3>
            <StatsPanel nodeData={selectedNodeImg} graphRef={graphRefImg} allowGrads={false} />
          </div>
        )}
      </div>
    </div>
  )
}
