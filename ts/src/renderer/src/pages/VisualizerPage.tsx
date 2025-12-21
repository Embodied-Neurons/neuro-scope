import { useNavigate } from 'react-router-dom'
import { JSX, useState } from 'react'
import NeuralGraph from '../components/NeuralGraph'
import StatsPanel from '../components/StatsPanel'
import EpochControls from '../components/EpochControls'
import AnomalySlider from '../components/AnomalySlider'
import NeuralImageInput from '../components/NeuralImageInput'
import ImageFileSelector from '../components/ImageFileSelector'
import NeuralAnimation from '../components/NeuralAnimation'
import { useModel } from '../context/useModel'

export default function VisualizerPage(): JSX.Element {
  const navigate = useNavigate()
  const { modelName, outputDir, epochs } = useModel()

  const [tab, setTab] = useState<'visualization' | 'image-input' | 'animation'>('visualization')

  const [selectedNode, setSelectedNode] = useState<Record<string, unknown> | null>(null)
  const [epoch, setEpoch] = useState(0)
  const [imagePath, setImagePath] = useState('')

  const [highlightTop, setHighlightTop] = useState(false)
  const [highlightBottom, setHighlightBottom] = useState(false)
  const [highlightPercent, setHighlightPercent] = useState(10)

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

      {/* Div containing buttons for different tabs */}
      <div className="flex border-b bg-gray-50 px-4">
        <button
          onClick={() => setTab('visualization')}
          className={`px-4 py-2 border-b-2 transition ${
            tab === 'visualization'
              ? 'border-black font-semibold bg-white'
              : 'border-transparent text-gray-500 hover:text-black'
          }`}
        >
          Visualization
        </button>

        <button
          onClick={() => setTab('image-input')}
          className={`px-4 py-2 border-b-2 transition ${
            tab === 'image-input'
              ? 'border-black font-semibold bg-white'
              : 'border-transparent text-gray-500 hover:text-black'
          }`}
        >
          Image input
        </button>

        <button
          onClick={() => setTab('animation')}
          className={`px-4 py-2 border-b-2 transition ${
            tab === 'animation'
              ? 'border-black font-semibold bg-white'
              : 'border-transparent text-gray-500 hover:text-black'
          }`}
        >
          Animation
        </button>
      </div>

      {/* Visualization tab */}
      {tab === 'visualization' && (
        <div className="flex flex-1 overflow-hidden p-4 gap-4">
          <div className="w-2/3 h-full bg-blue-950 rounded-xl shadow overflow-hidden">
            <NeuralGraph
              epoch={epoch}
              onNodeSelect={setSelectedNode}
              outputDir={outputDir}
              highlightTop={highlightTop}
              highlightBottom={highlightBottom}
              highlightPercent={highlightPercent}
            />
          </div>

          <div className="w-1/3 flex flex-col gap-4 h-full overflow-y-auto">
            <div className="bg-white p-4 rounded-xl shadow">
              <h3 className="font-semibold mb-2 text-black">Epoch Controls</h3>
              <EpochControls maxEpoch={epochs} onSelectEpoch={setEpoch} outputDir={outputDir} />
            </div>

            <div className="bg-white p-4 rounded-xl shadow">
              <h3 className="font-semibold mb-2 text-black">Activation Highlights</h3>
              <AnomalySlider
                highlightTop={highlightTop}
                highlightBottom={highlightBottom}
                percent={highlightPercent}
                onToggleTop={setHighlightTop}
                onToggleBottom={setHighlightBottom}
                onChangePercent={setHighlightPercent}
              />
            </div>

            <div className="bg-white p-4 rounded-xl shadow flex-1">
              <h3 className="font-semibold mb-2 text-black">Node Stats</h3>
              <StatsPanel nodeData={selectedNode} />
            </div>
          </div>
        </div>
      )}

      {/* Image input tab */}
      {tab === 'image-input' && (
        <div className="flex flex-1 overflow-hidden p-4 gap-4">
          {imagePath && (
            <div className="w-2/3 h-full bg-blue-950 rounded-xl shadow overflow-hidden">
              <NeuralImageInput
                imagePath={imagePath}
                onNodeSelect={setSelectedNode}
                outputDir={outputDir}
                highlightTop={highlightTop}
                highlightBottom={highlightBottom}
                highlightPercent={highlightPercent}
              />
            </div>
          )}

          {!imagePath && (
            <div className="w-2/3 h-full flex items-center justify-center bg-blue-950 rounded-xl shadow overflow-hidden">
              <p className="text-white text-lg italic">
                No image selected. Please select an image.
              </p>
            </div>
          )}

          <div className="w-1/3 flex flex-col gap-4 h-full overflow-y-auto">
            <div className="bg-white p-4 rounded-xl shadow">
              <h3 className="font-semibold mb-2 text-black">Feed Image to Model</h3>
              <ImageFileSelector
                outputDir={outputDir}
                modelName={modelName}
                onSelect={setImagePath}
              />
            </div>

            {imagePath && (
              <div className="bg-white p-4 rounded-xl shadow">
                <h3 className="font-semibold mb-2 text-black">Activation Highlights</h3>
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
              <div className="bg-white p-4 rounded-xl shadow flex-1">
                <h3 className="font-semibold mb-2 text-black">Node Stats</h3>
                <StatsPanel nodeData={selectedNode} />
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
