import Graph from 'graphology'
import Sigma from 'sigma'
import { JSX, useEffect, useRef, useState } from 'react'
import { buildGraph } from '../../utils/graph_building'
import { getAllNodesByLayers, getNodesPosInfo } from '../../utils/node_manipulation'
import {
  colorGraphNodes,
  highlightByActivation,
  initializeRendererAndCamera,
  createClickNodeListener,
  createClickStageListener,
  restrictCameraMovement
} from '../../utils/neural_graph_utils'
import { NeuralImageInputProps, NeuralNetworkData } from '../../utils/types'

export default function NeuralImageInput({
  imagePath,
  onNodeSelect,
  outputDir,
  highlightTop,
  highlightBottom,
  highlightPercent,
  graphRef
}: NeuralImageInputProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rendererRef = useRef<Sigma | null>(null)
  const selectedNodeRef = useRef<string | null>(null)
  const clickNodeListenerRef = useRef<({ node }) => void>((): void => {})
  const clickStageListenerRef = useRef<() => void>((): void => {})

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let destroyed = false

    async function init(): Promise<void> {
      if (!containerRef.current) return

      setLoading(true)
      try {
        const data: NeuralNetworkData = await window.api.getActivationsFromImageInput(outputDir)
        if (destroyed) return

        const nodes = getAllNodesByLayers(data.nodes, data.layerSizes)
        const posInfo = getNodesPosInfo(nodes)

        const graph = new Graph()
        graphRef.current = graph

        buildGraph(graph, nodes, data.activations)
        colorGraphNodes(graph)

        if (destroyed) return

        const { renderer, camera } = initializeRendererAndCamera(graph, containerRef.current)
        rendererRef.current = renderer

        restrictCameraMovement(camera, renderer, containerRef.current, posInfo)
        clickNodeListenerRef.current = createClickNodeListener(
          graphRef,
          selectedNodeRef,
          onNodeSelect,
          nodes,
          data
        )

        clickStageListenerRef.current = createClickStageListener(
          graphRef,
          selectedNodeRef,
          onNodeSelect,
          nodes,
          data
        )

        // Register event listeners
        renderer.on('clickNode', clickNodeListenerRef.current)
        renderer.on('clickStage', clickStageListenerRef.current)
      } finally {
        if (!destroyed) setLoading(false)
      }
    }

    init()

    return () => {
      destroyed = true
      rendererRef.current?.kill()
      graphRef.current?.clear()
      onNodeSelect(null)
    }
  }, [imagePath, outputDir, onNodeSelect, graphRef])

  useEffect(() => {
    if (!graphRef.current) return

    // Disable event listeners
    rendererRef.current?.off('clickNode', clickNodeListenerRef.current)
    rendererRef.current?.off('clickStage', clickStageListenerRef.current)

    if (highlightBottom || highlightTop) {
      // Clear edges if there is any selected node
      if (selectedNodeRef.current) {
        graphRef.current.edges().forEach((edge) => {
          graphRef.current!.dropEdge(edge)
        })
      }

      // Clear node selection
      onNodeSelect(null)
    } else {
      // Restore event listeners
      rendererRef.current?.on('clickNode', clickNodeListenerRef.current)
      rendererRef.current?.on('clickStage', clickStageListenerRef.current)
    }

    highlightByActivation(graphRef.current, highlightTop, highlightBottom, highlightPercent)
    rendererRef.current?.refresh()
  }, [highlightTop, highlightBottom, highlightPercent, onNodeSelect, graphRef])

  // Set of really funny messages that can be displayed during loading
  const loadingMessages = [
    'Calculating the zeroes of the Riemann-Zeta function...',
    'Searching for the Ark of the Covenant...',
    'Proving that P=NP or actually not...',
    'Iterating over all prime numbers...',
    'Optimizing linear search algorithms...'
  ]

  // Randomly chosen index
  const idx = Math.floor(Math.random() * loadingMessages.length)

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-black" />
          <span className="text-black font-medium text-lg">{loadingMessages[idx]}</span>
        </div>
      )}
    </div>
  )
}
