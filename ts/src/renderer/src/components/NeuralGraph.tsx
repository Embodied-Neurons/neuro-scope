import Graph from 'graphology'
import Sigma from 'sigma'
import { JSX, useEffect, useRef } from 'react'
import { buildGraph, buildEdges } from '../../utils/graph_building'
import { calculateBounds } from '../../utils/camera_bounding'
import { getAllNodesByLayers, getNodesPosInfo } from '../../utils/node_manipulation'
import { NeuralGraphProps } from '../../utils/types'

export function NeuralGraph({ batch, onNodeSelect, outputDir }: NeuralGraphProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rendererRef = useRef<Sigma | null>(null)
  const graphRef = useRef<Graph | null>(null)
  const selectedNodeRef = useRef<string | null>(null)

  useEffect(() => {
    let destroyed = false

    async function init(): Promise<void> {
      if (batch >= 0) {
        if (!containerRef.current) return

        const container = containerRef.current
        const data = await window.api.getNeuralNetworkVisualization(outputDir, batch)
        const nodes = getAllNodesByLayers(data.nodes, data.layerSizes)
        const posInfo = getNodesPosInfo(nodes)

        const graph = new Graph()
        graphRef.current = graph
        buildGraph(graph, nodes)

        if (destroyed) return

        const renderer = new Sigma(graph, container, {
          minCameraRatio: 0.05,
          maxCameraRatio: 1.2,
          zIndex: true
        })

        rendererRef.current = renderer
        const camera = renderer.getCamera()
        camera.setState({ x: 0.5, y: 0.5, ratio: 1.0 })

        camera.on('updated', async () => {
          const { x, y, newX, newY } = calculateBounds(renderer, container, posInfo)
          const cameraState = camera.getState()

          if (newX !== x || newY !== y) {
            const newCameraX = cameraState.x - x + newX
            const newCameraY = cameraState.y - y + newY
            camera.setState({ x: newCameraX, y: newCameraY })
          }
        })

        renderer.on('clickNode', ({ node }: { node: string }) => {
          if (!graphRef.current) return

          const graph = graphRef.current

          if (selectedNodeRef.current) {
            const prevNode = selectedNodeRef.current
            const prevEdges = graph.edges(prevNode)
            graph.setNodeAttribute(prevNode, 'color', '#b1b1b1')
            graph.setNodeAttribute(prevNode, 'zIndex', 1)
            prevEdges.forEach((edge) => {
              graph.dropEdge(edge)
            })
          }

          if (selectedNodeRef.current !== node) {
            selectedNodeRef.current = node

            const nodeData = graph.getNodeAttributes(node)
            const { weight } = nodeData
            const highlightColor = `rgb(${Math.round(255 * (1 - (weight ?? 0)))}, ${Math.round(
              255 * (weight ?? 0)
            )}, 0)`

            graph.setNodeAttribute(node, 'color', highlightColor)
            graph.setNodeAttribute(node, 'zIndex', 2)
            buildEdges(graph, nodes, node, data.layerSizes)
            const edges = graph.edges(node)
            edges.forEach((edge) => {
              const w = 0.5
              const color = `rgb(${Math.round(255 * (1 - w))}, ${Math.round(255 * w)}, 0)`
              graph.setEdgeAttribute(edge, 'color', color)
            })

            onNodeSelect({ ...nodeData })
          } else {
            selectedNodeRef.current = null
            onNodeSelect(null)
          }
        })
      } else {
        if (!containerRef.current) return

        const container = containerRef.current
        const data = await window.api.getActivationsFromImageInput(outputDir)
        const nodes = getAllNodesByLayers(data.nodes, data.layerSizes)
        const posInfo = getNodesPosInfo(nodes)

        const graph = new Graph()
        graphRef.current = graph
        buildGraph(graph, nodes)

        const graphNodes = graph.nodes()
        graphNodes.forEach((node) => {
          const w = 0.5
          const color = `rgb(${Math.round(255 * (1 - w))}, ${Math.round(255 * w)}, 0)`
          graph.setNodeAttribute(node, 'color', color)
        })

        if (destroyed) return

        const renderer = new Sigma(graph, container, {
          minCameraRatio: 0.05,
          maxCameraRatio: 1.2,
          zIndex: true
        })

        rendererRef.current = renderer
        const camera = renderer.getCamera()
        camera.setState({ x: 0.5, y: 0.5, ratio: 1.0 })

        camera.on('updated', async () => {
          const { x, y, newX, newY } = calculateBounds(renderer, container, posInfo)
          const cameraState = camera.getState()

          if (newX !== x || newY !== y) {
            const newCameraX = cameraState.x - x + newX
            const newCameraY = cameraState.y - y + newY
            camera.setState({ x: newCameraX, y: newCameraY })
          }
        })
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
  }, [batch, onNodeSelect, outputDir])

  return <div ref={containerRef} className="w-full h-full" />
}
