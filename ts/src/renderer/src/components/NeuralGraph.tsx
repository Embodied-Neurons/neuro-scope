import Graph from 'graphology'
import Sigma from 'sigma'
import { JSX, useEffect, useRef } from 'react'
import { buildGraph } from '../../utils/graph_building'
import { getAllNodesByLayers, getNodesPosInfo } from '../../utils/node_manipulation'
import {
  colorGraphNodes,
  highlightByActivation,
  initializeRendererAndCamera,
  registerClickNodeListener,
  registerClickStageListener,
  restrictCameraMovement
} from '../../utils/neural_graph_utils'
import { NeuralGraphProps, NeuralNetworkData } from '../../utils/types'
import { useModel } from '../context/useModel'

export default function NeuralGraph({
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

      const { renderer, camera } = initializeRendererAndCamera(
        graph,
        containerRef.current,
        rendererRef
      )

      restrictCameraMovement(camera, renderer, containerRef.current, posInfo)
      registerClickNodeListener(renderer, graphRef, selectedNodeRef, onNodeSelect, nodes, data)
      registerClickStageListener(renderer, graphRef, selectedNodeRef, onNodeSelect, nodes, data)
    }

    init()

    return () => {
      destroyed = true
      rendererRef.current?.kill()
      graphRef.current?.clear()

      // Reset selected node
      onNodeSelect(null)
    }
  }, [epoch, outputDir, onNodeSelect, epochs])

  useEffect(() => {
    if (!graphRef.current) return
    highlightByActivation(graphRef.current, highlightTop, highlightBottom, highlightPercent)
    rendererRef.current?.refresh()
  }, [highlightTop, highlightBottom, highlightPercent])

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
