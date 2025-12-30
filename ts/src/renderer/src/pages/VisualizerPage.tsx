import { useNavigate } from 'react-router-dom'
import { JSX, useRef, useState } from 'react'
import NeuralGraph from '../components/visualization/NeuralGraph'
import StatsPanel from '../components/visualization/StatsPanel'
import EpochControls from '../components/visualization/EpochControls'
import AnomalySlider from '../components/visualization/AnomalySlider'
import NeuralImageInput from '../components/NeuralImageInput'
import ImageFileSelector from '../components/ImageFileSelector'
import NeuralAnimation from '../components/animation/NeuralAnimation'
import { useModel } from '../context/model/useModel'
import Graph from 'graphology'

export default function VisualizerPage(): JSX.Element {
  const navigate = useNavigate()
  const { modelName, outputDir, epochs } = useModel()

  const [tab, setTab] = useState<'visualization' | 'image-input' | 'animation'>('visualization')

  const [epoch, setEpoch] = useState(0)
  const [imagePath, setImagePath] = useState('')

  const [highlightTop, setHighlightTop] = useState(false)
  const [highlightBottom, setHighlightBottom] = useState(false)
  const [highlightPercent, setHighlightPercent] = useState(10)

  // Distinct selected nodes and graph refs for visualization and image input tabs
  const [selectedNodeVis, setSelectedNodeVis] = useState<Record<string, unknown> | null>(null)
  const [selectedNodeImg, setSelectedNodeImg] = useState<Record<string, unknown> | null>(null)

  const graphRefVis = useRef<Graph | null>(null)
  const graphRefImg = useRef<Graph | null>(null)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-100">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4 shadow">
        <h2 className="text-xl font-semibold">Neural Graph Visualization</h2>
        <button
          onClick={() => navigate('/')}
          className="rounded-lg bg-black px-3 py-1 text-white transition hover:bg-gray-700"
        >
          Back to Home
        </button>
      </div>

      {/* Div containing buttons for different tabs */}
      <div className="flex border-b bg-gray-50 px-4">
        <button
          onClick={() => setTab('visualization')}
          className={`border-b-2 px-4 py-2 transition ${
            tab === 'visualization'
              ? 'border-black bg-white font-semibold'
              : 'border-transparent text-gray-500 hover:text-black'
          }`}
        >
          Visualization
        </button>

        <button
          onClick={() => setTab('image-input')}
          className={`border-b-2 px-4 py-2 transition ${
            tab === 'image-input'
              ? 'border-black bg-white font-semibold'
              : 'border-transparent text-gray-500 hover:text-black'
          }`}
        >
          Image input
        </button>

        <button
          onClick={() => setTab('animation')}
          className={`border-b-2 px-4 py-2 transition ${
            tab === 'animation'
              ? 'border-black bg-white font-semibold'
              : 'border-transparent text-gray-500 hover:text-black'
          }`}
        >
          Animation
        </button>
      </div>

      {/* Visualization tab */}
      {tab === 'visualization' && (
        <div className="flex flex-1 gap-4 overflow-hidden p-4">
          <div className="h-full w-2/3 overflow-hidden rounded-xl bg-blue-950 shadow">
            <NeuralGraph
              epoch={epoch}
              onNodeSelect={setSelectedNodeVis}
              outputDir={outputDir}
              highlightTop={highlightTop}
              highlightBottom={highlightBottom}
              highlightPercent={highlightPercent}
              graphRef={graphRefVis}
            />
          </div>

          <div className="flex h-full w-1/3 flex-col gap-4 overflow-y-auto">
            <div className="rounded-xl bg-white p-4 shadow">
              <h3 className="mb-2 font-semibold text-black">Epoch Controls</h3>
              <EpochControls currentEpoch={epoch} maxEpoch={epochs} onSelectEpoch={setEpoch} />
            </div>

            <div className="rounded-xl bg-white p-4 shadow">
              <h3 className="mb-2 font-semibold text-black">Activation Highlights</h3>
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
              <h3 className="mb-2 font-semibold text-black">Node Stats</h3>
              <StatsPanel nodeData={selectedNodeVis} graphRef={graphRefVis} allowGrads={true} />
            </div>
          </div>
        </div>
      )}

      {/* Image input tab */}
      {tab === 'image-input' && (
        <div className="flex flex-1 gap-4 overflow-hidden p-4">
          {imagePath && (
            <div className="h-full w-2/3 overflow-hidden rounded-xl bg-blue-950 shadow">
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
            <div className="flex h-full w-2/3 items-center justify-center overflow-hidden rounded-xl bg-blue-950 shadow">
              <p className="text-lg text-white italic">
                No image selected. Please select an image.
              </p>
            </div>
          )}

          <div className="flex h-full w-1/3 flex-col gap-4 overflow-y-auto">
            <div className="rounded-xl bg-white p-4 shadow">
              <h3 className="mb-2 font-semibold text-black">Feed Image to Model</h3>
              <ImageFileSelector
                outputDir={outputDir}
                modelName={modelName}
                onSelect={setImagePath}
              />
            </div>

            {imagePath && (
              <div className="rounded-xl bg-white p-4 shadow">
                <h3 className="mb-2 font-semibold text-black">Activation Highlights</h3>
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
                <h3 className="mb-2 font-semibold text-black">Node Stats</h3>
                <StatsPanel nodeData={selectedNodeImg} graphRef={graphRefImg} allowGrads={false} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Animation tab */}
      {tab === 'animation' && <NeuralAnimation outputDir={outputDir} />}
    </div>
  )
}
