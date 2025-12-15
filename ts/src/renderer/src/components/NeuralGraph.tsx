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

      const nodes = getAllNodesByLayers(data.nodes, data.layerSizes)
      const posInfo = getNodesPosInfo(nodes)

      const graph = new Graph()
      graphRef.current = graph
      buildGraph(graph, nodes, data.activations)
      colorGraphNodes(graph)

      if (destroyed) return

      const { renderer, camera } = initializeRendererAndCamera(graph, container, rendererRef)
      restrictCameraMovement(camera, renderer, container, posInfo)

      // temporary workaround
      if (epoch >= 0) {
        registerClickNodeListener(renderer, graphRef, selectedNodeRef, onNodeSelect, nodes, data)
      } else {
        registerClickNodeListener(renderer, graphRef, selectedNodeRef, onNodeSelect, nodes, data)
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

  useEffect(() => {
    if (!graphRef.current) return

    highlightByActivation(graphRef.current, highlightTop, highlightBottom, highlightPercent)

    if (rendererRef.current) {
      rendererRef.current.refresh()
    }
  }, [highlightTop, highlightBottom, highlightPercent])

  return <div ref={containerRef} className="w-full h-full" />
}
