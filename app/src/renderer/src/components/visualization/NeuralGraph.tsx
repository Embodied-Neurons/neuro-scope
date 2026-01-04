import Graph from 'graphology'
import Sigma from 'sigma'
import { JSX, useEffect, useRef } from 'react'
import { buildGraph } from '../../../utils/graph_building'
import { getAllNodesByLayers, getNodesPosInfo } from '../../../utils/node_manipulation'
import {
  colorGraphNodes,
  highlightByActivation,
  initializeRendererAndCamera,
  createClickNodeListener,
  createClickStageListener,
  restrictCameraMovement
} from '../../../utils/neural_graph_utils'
import { NeuralGraphProps, NeuralNetworkData } from '../../../utils/types'
import { useModel } from '../../context/model/useModel'

export default function NeuralGraph({
  epoch,
  onNodeSelect,
  outputDir,
  highlightTop,
  highlightBottom,
  highlightPercent,
  graphRef
}: NeuralGraphProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rendererRef = useRef<Sigma | null>(null)
  const selectedNodeRef = useRef<string | null>(null)
  const clickNodeListenerRef = useRef<({ node }) => void>((): void => {})
  const clickStageListenerRef = useRef<() => void>((): void => {})

  const { epochs } = useModel()

  useEffect(() => {
    let destroyed = false

    async function init(): Promise<void> {
      if (!containerRef.current) return

      const data: NeuralNetworkData = await window.api.getNeuralNetworkVisualization(
        outputDir,
        epoch
      )

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
    }

    init()

    return () => {
      destroyed = true
      rendererRef.current?.kill()
      graphRef.current?.clear()
      onNodeSelect(null)
    }
  }, [epoch, outputDir, onNodeSelect, epochs, graphRef])

  useEffect(() => {
    if (!graphRef.current) return

    // Disable event listeners
    rendererRef.current?.off('clickNode', clickNodeListenerRef.current)
    rendererRef.current?.off('clickStage', clickStageListenerRef.current)

    if (highlightBottom || highlightTop) {
      // Clear edges if there are any
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

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  )
}
