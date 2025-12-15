import Graph from 'graphology'
import Sigma from 'sigma'
import { JSX, useEffect, useRef, useState } from 'react'
import { buildGraph } from '../../utils/graph_building'
import { getAllNodesByLayers, getNodesPosInfo } from '../../utils/node_manipulation'
import {
  colorGraphNodes,
  highlightByActivation,
  initializeRendererAndCamera,
  registerClickNodeListener,
  restrictCameraMovement
} from '../../utils/neural_graph_utils'
import { NeuralGraphProps, NeuralNetworkData } from '../../utils/types'

export function NeuralGraph({
  epoch,
  onNodeSelect,
  outputDir,
  highlightTop,
  highlightBottom,
  highlightPercent
}: NeuralGraphProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rendererRef = useRef<Sigma | null>(null)
  const graphRef = useRef<Graph | null>(null)
  const selectedNodeRef = useRef<string | null>(null)

  const [isAnimating, setIsAnimating] = useState(false)
  const [speed, setSpeed] = useState(500)
  const [epochCount, setEpochCount] = useState(0)
  const [currentEpoch, setCurrentEpoch] = useState(0)
  const animationTimeoutRef = useRef<number | null>(null)
  const currentEpochRef = useRef<number>(0)
  const isAnimatingRef = useRef(false)
  

  const nodeLayersRef = useRef<any>(null)
  const layerSizesRef = useRef<number[]>([])

  async function detectMaxEpoch(): Promise<number> {
    let epoch = 0
    while (true) {
      try {
        let result = await window.api.detectEpoch(outputDir, epoch)
        if (result == -1){
          break
        }
        epoch++
      } catch {
        break
      }
    }
    return epoch
  }


  useEffect(() => {
    let destroyed = false

    async function init(): Promise<void> {
      if (!containerRef.current) return

      const container = containerRef.current
      let data: NeuralNetworkData

      // temporary workaround
      if (epoch >= 0) {
        data = await window.api.getNeuralNetworkVisualization(outputDir, epoch)
      } else {
        data = await window.api.getActivationsFromImageInput(outputDir)
      }

      layerSizesRef.current = data.layerSizes

      const detected = await detectMaxEpoch()
      console.log('detected: %d', detected)
      setEpochCount(detected)

      const nodes = getAllNodesByLayers(data.nodes, data.layerSizes)
      nodeLayersRef.current = nodes

      const posInfo = getNodesPosInfo(nodes)

      const graph = new Graph()
      graphRef.current = graph

      buildGraph(graph, nodes, data.activations)
      colorGraphNodes(graph)

      if (destroyed) return

      const { renderer, camera } = initializeRendererAndCamera(graph, container, rendererRef)
      restrictCameraMovement(camera, renderer, container, posInfo)

      currentEpochRef.current = epoch

      if (!isAnimatingRef.current) {
        if (epoch >= 0) {
          registerClickNodeListener(renderer, graphRef, selectedNodeRef, onNodeSelect, nodes, data)
        } else {
          registerClickNodeListener(renderer, graphRef, selectedNodeRef, onNodeSelect, null, null)
        }
      }
    }

    init()

    return () => {
      destroyed = true

      if (rendererRef.current) {
        rendererRef.current.kill()
        rendererRef.current = null
      }

      if (graphRef.current) {
        graphRef.current.clear()
        graphRef.current = null
      }
    }
  }, [epoch, onNodeSelect, outputDir])


  async function applyEpochColors(epochNumber: number) {
    if (!graphRef.current) return

    const graph = graphRef.current
    const data = await window.api.getNeuralNetworkVisualization(outputDir, epochNumber)

    const activations = data.activations
    const firstLayer = layerSizesRef.current[0]

    let counter = 0
    graph.forEachNode((node) => {
      const newWeight =
        counter >= firstLayer
          ? activations[counter - firstLayer].norm
          : 0

      const newActivation =
        counter >= firstLayer
          ? activations[counter - firstLayer].raw
          : 0

      graph.setNodeAttribute(node, "weight", newWeight)
      graph.setNodeAttribute(node, "activation", newActivation)

      counter++
    })

    graph.forEachEdge((edge) => {
      graph.dropEdge(edge)
    })

    colorGraphNodes(graph)
  }




  useEffect(() => {
    isAnimatingRef.current = isAnimating

    if (!isAnimating || epochCount === 0) {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
        animationTimeoutRef.current = null
      }
      return
    }

    async function loop() {
      await applyEpochColors(currentEpochRef.current)

      const next = (currentEpochRef.current + 1) % epochCount
      currentEpochRef.current = next
      setCurrentEpoch(next)
      animationTimeoutRef.current = window.setTimeout(loop, speed)
    }

    loop()

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
    }
  }, [isAnimating, speed, epochCount])

  function toggleAnimation() {
    setIsAnimating((prev) => {
      const next = !prev
      if (next) {
        currentEpochRef.current = currentEpochRef.current
        setCurrentEpoch(epoch)
      }
      return next
    })
  }

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />

      {/* Animation Controls */}
      <div className="absolute bottom-4 left-4 bg-white/80 p-4 rounded shadow-lg space-y-3">
        <button
          onClick={toggleAnimation}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          {isAnimating ? "Pause" : "Start"}
        </button>

        <div>
          <label>Speed: {speed}</label>
          <input
            type="range"
            min={200}
            max={1000}
            step={50}
            value={1200 - speed}
            onChange={(e) => setSpeed(1200 - Number(e.target.value))}
          />
        </div>

        <div>Epoch: {currentEpoch} / {epochCount}</div>
      </div>
    </div>
  )
}
