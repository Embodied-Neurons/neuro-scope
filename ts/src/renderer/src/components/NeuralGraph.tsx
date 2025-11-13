import Graph from 'graphology'
import Sigma from 'sigma'
import { JSX, useEffect, useRef } from 'react'
import { groupNeurons, buildGraph } from '../../utils/graph_building'
import { calculateDynamicBounds, getVisibilityRanges } from '../../utils/graph_bounding'
import {
  getAllNodesByLayers,
  getNodesPosInfo,
  visibleNodesChanged,
  anyNodeVisible,
  getVisibleNodes
} from '../../utils/node_manipulation'
import { NeuralGraphProps, EdgeStats } from '../../utils/types'

export function NeuralGraph({ batch, onNodeSelect, outputDir }: NeuralGraphProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rendererRef = useRef<Sigma | null>(null)
  const graphRef = useRef<Graph | null>(null)
  const selectedNodeRef = useRef<string | null>(null)
  const selectedEdgesColorsRef = useRef<string[]>([])
  const selectedEdgesSizesRef = useRef<number[]>([])

  useEffect(() => {
    let destroyed = false

    async function init(): Promise<void> {
      if (!containerRef.current) {
        return
      }

      const container = containerRef.current
      const data = await window.api.getNeuralNetworkVisualization(outputDir, batch)
      const nodes = getAllNodesByLayers(data.nodes, data.layerSizes)
      const posInfo = getNodesPosInfo(nodes)

      const { neuronLayers, edges } = await groupNeurons(
        nodes,
        nodes,
        data.layerSizes,
        outputDir,
        batch
      )

      const graph = new Graph()
      graphRef.current = graph
      buildGraph(graph, neuronLayers, edges)

      if (destroyed) return

      const renderer = new Sigma(graph, container, {
        minCameraRatio: 0.02,
        maxCameraRatio: 1,
        zIndex: true
      })

      const camera = renderer.getCamera()
      rendererRef.current = renderer
      camera.setState({ ratio: 1.0 })

      camera.on('updated', () => {
        const { x, y, ratio } = camera.getState()
        const { newX, newY } = calculateDynamicBounds(x, y, ratio, posInfo)
        if (newX !== x || newY !== y) camera.setState({ x: newX, y: newY })
      })

      let currentVisibleNodes = nodes
      let debounceTimer: NodeJS.Timeout

      const rebuild = async (): Promise<void> => {
        if (!renderer || !graph) return
        const visibility = getVisibilityRanges(camera, renderer, container)
        const visibleNodes = getVisibleNodes(nodes, visibility)

        if (
          visibleNodesChanged(visibleNodes, currentVisibleNodes) &&
          anyNodeVisible(visibleNodes)
        ) {
          const { ratio } = camera.getState()
          const { neuronLayers, edges } = await groupNeurons(
            visibleNodes,
            nodes,
            data.layerSizes,
            outputDir,
            batch,
            ratio
          )

          buildGraph(graph, neuronLayers, edges)

          selectedNodeRef.current = null
          selectedEdgesColorsRef.current = []
          selectedEdgesSizesRef.current = []

          currentVisibleNodes = visibleNodes
        }
      }

      const debounce = (): void => {
        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(rebuild, 500)
      }

      renderer.on('upStage', debounce)
      renderer.on('wheelStage', debounce)
      renderer.on('clickNode', ({ node }: { node: string }) => {
        if (!graphRef.current) return
        const graph = graphRef.current

        if (selectedNodeRef.current) {
          const prevNode = selectedNodeRef.current
          graph.setNodeAttribute(prevNode, 'color', '#b1b1b1')
          const pastEdges = graph.edges(prevNode)
          pastEdges.forEach((edge, i) => {
            graph.setEdgeAttribute(edge, 'color', selectedEdgesColorsRef.current[i])
            graph.setEdgeAttribute(edge, 'size', selectedEdgesSizesRef.current[i])
            graph.setEdgeAttribute(edge, 'zIndex', 0)
          })
        }

        if (selectedNodeRef.current !== node) {
          selectedNodeRef.current = node
          selectedEdgesColorsRef.current = []
          selectedEdgesSizesRef.current = []

          const nodeData = graph.getNodeAttributes(node)
          const { weight } = nodeData

          const highlightColor = `rgb(${Math.round(255 * (1 - (weight ?? 0)))}, ${Math.round(
            255 * (weight ?? 0)
          )}, 0)`
          graph.setNodeAttribute(node, 'color', highlightColor)

          const connectedEdges = graph.edges(node)
          const newEdgesColors: string[] = []
          const newEdgesSizes: number[] = []
          const edgeStats: EdgeStats[] = []

          connectedEdges.forEach((edge) => {
            newEdgesColors.push(graph.getEdgeAttribute(edge, 'color'))
            newEdgesSizes.push(graph.getEdgeAttribute(edge, 'size'))
          })

          connectedEdges.forEach((edge) => {
            const attrs = graph.getEdgeAttributes(edge)
            const w = attrs.weight ?? 0
            const gradMean = attrs.gradMean ?? '—'
            const gradMin = attrs.gradMin ?? '—'
            const gradMax = attrs.gradMax ?? '—'
            const color = `rgb(${Math.round(255 * (1 - w))}, ${Math.round(255 * w)}, 0)`
            const size = attrs.size

            graph.setEdgeAttribute(edge, 'color', color)
            graph.setEdgeAttribute(edge, 'size', 2 * size)
            graph.setEdgeAttribute(edge, 'zIndex', 2)

            edgeStats.push({
              id: attrs.id,
              weight: w,
              gradMean: gradMean,
              gradMin: gradMin,
              gradMax: gradMax
            })
          })

          selectedEdgesColorsRef.current = newEdgesColors
          selectedEdgesSizesRef.current = newEdgesSizes
          onNodeSelect({ ...nodeData, edgeStats })
        } else {
          selectedNodeRef.current = null
          selectedEdgesColorsRef.current = []
          selectedEdgesSizesRef.current = []
          onNodeSelect(null)
        }
      })
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
  }, [batch, onNodeSelect, outputDir])

  return <div ref={containerRef} className="w-full h-full" />
}
