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

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function init(): Promise<void> {
      if (!containerRef.current) return
      setLoading(true)

      try {
        const data: NeuralNetworkData = await window.api.getActivationsFromImageInput(outputDir)

        if (!isMounted) return

        const nodes = getAllNodesByLayers(data.nodes, data.layerSizes)
        const posInfo = getNodesPosInfo(nodes)

        const graph = new Graph()
        graphRef.current = graph

        buildGraph(graph, nodes, data.activations)
        colorGraphNodes(graph)

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

        renderer.on('clickNode', clickNodeListenerRef.current)
        renderer.on('clickStage', clickStageListenerRef.current)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    init()

    return () => {
      isMounted = false

      if (rendererRef.current) {
        rendererRef.current.kill()
        rendererRef.current = null
      }

      if (graphRef.current) {
        graphRef.current.clear()
        graphRef.current = null
      }
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
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-white">
          <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-b-4 border-black" />
          <span className="text-lg font-medium text-black">{loadingMessages[idx]}</span>
        </div>
      )}
    </div>
  )
}
