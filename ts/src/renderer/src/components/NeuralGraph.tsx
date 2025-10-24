import { useEffect, useRef} from 'react'
import Graph from 'graphology'
import Sigma from 'sigma'
import { groupNeurons, buildGraph } from '../../utils/graph_building'
import {
  getAllNodesByLayers,
  getNodesPosInfo,
  visibleNodesChanged,
  anyNodeVisible,
  getVisibleNodes
} from '../../utils/node_manipulation'
import { calculateDynamicBounds, getVisibilityRanges } from '../../utils/graph_bounding'

interface NeuralGraphProps {
  batch: number
}

export function NeuralGraph({ batch }: NeuralGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rendererRef = useRef<Sigma | null>(null)
  const graphRef = useRef<Graph | null>(null)

  const selectedNodeRef = useRef<string | null>(null)
  const selectedEdgesColorsRef = useRef<string[]>([])

  useEffect(() => {
    let destroyed = false

    async function init() {
      if (!containerRef.current) return
      const container = containerRef.current
      container.innerHTML = ''

      const data = await window.api.getNeuralNetworkVisualization(batch)
      const containerWidth = container.offsetWidth
      const containerHeight = container.offsetHeight

      const nodes = getAllNodesByLayers(data.nodes, data.layerSizes)
      const posInfo = getNodesPosInfo(nodes, containerWidth, containerHeight)

      const { neuronLayers, edges } = await groupNeurons(
        nodes,
        nodes,
        containerHeight,
        data.layerSizes,
        batch
      )

      const graph = new Graph()
      graphRef.current = graph
      buildGraph(graph, containerWidth, containerHeight, neuronLayers, edges)

      if (destroyed) return

      const renderer = new Sigma(graph, container, {
        minCameraRatio: 0.02,
        maxCameraRatio: 1,
        zIndex: true
      })
      rendererRef.current = renderer

      const camera = renderer.getCamera()
      camera.setState({ ratio: 1.0 })

      camera.on('updated', () => {
        const { x, y, ratio } = camera.getState()
        const { newX, newY } = calculateDynamicBounds(x, y, ratio, posInfo)
        if (newX !== x || newY !== y) camera.setState({ x: newX, y: newY })
      })

      let currentVisibleNodes = nodes
      let debounceTimer: any = null

      const rebuild = async () => {
        if (!renderer || !graph) return
        const visibility = getVisibilityRanges(camera, renderer, container)
        const visibleNodes = getVisibleNodes(nodes, containerWidth, containerHeight, visibility)

        if (
          visibleNodesChanged(visibleNodes, currentVisibleNodes) &&
          anyNodeVisible(visibleNodes)
        ) {
          const { ratio } = camera.getState()
          const { neuronLayers, edges } = await groupNeurons(
            visibleNodes,
            nodes,
            containerHeight,
            data.layerSizes,
            batch,
            ratio
          )
          buildGraph(graph, containerWidth, containerHeight, neuronLayers, edges)

          selectedNodeRef.current = null
          selectedEdgesColorsRef.current = []

          currentVisibleNodes = visibleNodes
        }
      }

      const debounce = () => {
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
          graph.setNodeAttribute(prevNode, 'color', '#c0c0c0')
          const pastEdges = graph.edges(prevNode)
          pastEdges.forEach((edge, i) => {
            graph.setEdgeAttribute(edge, 'color', selectedEdgesColorsRef.current[i])
            graph.setEdgeAttribute(edge, 'size', 0.5)
            graph.setEdgeAttribute(edge, 'zIndex', 0)
          })
        }

        if (selectedNodeRef.current !== node) {
          selectedNodeRef.current = node
          selectedEdgesColorsRef.current = []

          const nodeData = graph.getNodeAttributes(node)
          const { weight } = nodeData

          const highlightColor = `rgb(${Math.round(255 * (1 - (weight ?? 0)))}, ${Math.round(
            255 * (weight ?? 0)
          )}, 0)`
          graph.setNodeAttribute(node, 'color', highlightColor)

          const connectedEdges = graph.edges(node)
          const newEdgesColors: string[] = []

          connectedEdges.forEach((edge) => {
            newEdgesColors.push(graph.getEdgeAttribute(edge, 'color'))
          })

          connectedEdges.forEach((edge) => {
            const attrs = graph.getEdgeAttributes(edge)
            const w = attrs.weight ?? 0

            const color = `rgb(${Math.round(255 * (1 - w))}, ${Math.round(255 * w)}, 0)`
            graph.setEdgeAttribute(edge, 'color', color)
            graph.setEdgeAttribute(edge, 'size', 1.5)
            graph.setEdgeAttribute(edge, 'zIndex', 2)
          })

          selectedEdgesColorsRef.current = newEdgesColors
        } else {
          selectedNodeRef.current = null
          selectedEdgesColorsRef.current = []
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
  }, [batch])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%'
      }}
    />
  )
}
