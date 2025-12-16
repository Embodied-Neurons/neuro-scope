import Graph from 'graphology'
import Sigma from 'sigma'
import { JSX, useCallback, useEffect, useRef, useState } from 'react'
import { buildGraph } from '../../utils/graph_building'
import { getAllNodesByLayers, getNodesPosInfo } from '../../utils/node_manipulation'
import {
  colorGraphNodes,
  highlightByActivation,
  initializeRendererAndCamera,
  registerClickNodeListener,
  restrictCameraMovement
} from '../../utils/neural_graph_utils'
import { NeuralGraphProps, NeuralNetworkData, Node } from '../../utils/types'
import { useModel } from '@renderer/context/useModel'

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

  const nodeLayersRef = useRef<Node[][]>(null)
  const layerSizesRef = useRef<number[]>([])

  const { epochs } = useModel()

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

      const detected = epochs
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
          registerClickNodeListener(renderer, graphRef, selectedNodeRef, onNodeSelect, nodes, data)
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
  }, [epoch, onNodeSelect, outputDir, epochs])

  const applyEpochColors = useCallback(
    async (epochNumber: number) => {
      if (!graphRef.current) return

      const graph = graphRef.current
      const data = await window.api.getNeuralNetworkVisualization(outputDir, epochNumber)

      const activations = data.activations
      const firstLayerSize = layerSizesRef.current[0]

      let counter = 0

      graph.forEachNode((nodeId) => {
        if (counter < firstLayerSize) {
          counter++
          return
        }

        const act = activations[counter]

        graph.setNodeAttribute(nodeId, 'weight', act?.norm ?? 0)
        graph.setNodeAttribute(nodeId, 'activation', act?.raw ?? 0)

        counter++
      })

      colorGraphNodes(graph)
      rendererRef.current?.refresh()
    },
    [outputDir]
  )


  useEffect(() => {
    isAnimatingRef.current = isAnimating

    if (!isAnimating || epochCount === 0) {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
        animationTimeoutRef.current = null
      }
      return
    }

    async function loop(): Promise<void> {
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
  }, [isAnimating, speed, epochCount, applyEpochColors])

  function toggleAnimation(): null {
    setIsAnimating((prev) => {
      const next = !prev
      if (next) {
        setCurrentEpoch(epoch)
      }
      return next
    })
    return null
  }

  useEffect(() => {
    if (!graphRef.current) return

    highlightByActivation(graphRef.current, highlightTop, highlightBottom, highlightPercent)

    if (rendererRef.current) {
      rendererRef.current.refresh()
    }
  }, [highlightTop, highlightBottom, highlightPercent])

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />

      <div className="absolute bottom-4 left-4 bg-white/80 p-4 rounded shadow-lg space-y-3">
        <button onClick={toggleAnimation} className="px-3 py-1 bg-black text-white rounded">
          {isAnimating ? 'Pause' : 'Start'}
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
            className="accent-black"
          />
        </div>

        <div>
          Epoch: {currentEpoch} / {epochCount}
        </div>
      </div>
    </div>
  )
}
