import Graph from 'graphology'
import Sigma from 'sigma'
import { JSX, useEffect, useState, useRef } from 'react'
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
import { MAX_GROUPS } from '../../utils/consts'

export function NeuralGraph({ batch, onNodeSelect, outputDir }: NeuralGraphProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(false)

  const currentZoomIndexRef = useRef(0)
  const zoomRatiosRef = useRef<number[]>([])
  const rebuildRef = useRef<((deltaY: number) => Promise<void>) | null>(null)
  const isProcessingRef = useRef(false)
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

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

      // Calculating max zoom for camera ratio boundaries
      const maxZoom = 1.5 * Math.ceil(Math.max(...data.layerSizes) / MAX_GROUPS)

      const renderer = new Sigma(graph, container, {
        minCameraRatio: 1 / maxZoom,
        maxCameraRatio: 1,
        zIndex: true
      })

      const containerRect = container.getBoundingClientRect()

      // Disabling mouse wheel events
      window.addEventListener(
        'wheel',
        (e) => {
          if (
            e.clientX >= containerRect.left &&
            e.clientX <= containerRect.right &&
            e.clientY >= containerRect.top &&
            e.clientY <= containerRect.bottom
          ) {
            e.preventDefault()
            e.stopPropagation()
          }
        },
        { passive: false, capture: true }
      )

      // Determining set of available zoom ratios
      const zoomRatios = [1]
      let ratioToAdd = 0.5

      while (ratioToAdd > 1 / maxZoom) {
        zoomRatios.push(ratioToAdd)
        ratioToAdd /= 2
      }

      zoomRatios.push(1 / maxZoom)
      const currentZoomIndex = 0

      zoomRatiosRef.current = zoomRatios
      currentZoomIndexRef.current = currentZoomIndex

      const camera = renderer.getCamera()
      rendererRef.current = renderer
      camera.setState({ ratio: 1.0 })

      camera.on('updated', async () => {
        const { x, y, newX, newY } = calculateDynamicBounds(renderer, container, posInfo)
        const cameraState = camera.getState()

        if (newX !== x || newY !== y) {
          const newCameraX = cameraState.x - x + newX
          const newCameraY = cameraState.y - y + newY
          camera.setState({ x: newCameraX, y: newCameraY })
        }
      })

      let currentVisibleNodes = nodes

      const rebuild = async (deltaY: number): Promise<void> => {
        if (!renderer || !graph) return
        const visibility = getVisibilityRanges(camera, renderer, container, deltaY)
        const visibleNodes = getVisibleNodes(nodes, visibility)

        if (anyNodeVisible(visibleNodes)) {
          const { neuronLayers, edges } = await groupNeurons(
            visibleNodes,
            nodes,
            data.layerSizes,
            outputDir,
            batch
          )

          buildGraph(graph, neuronLayers, edges)

          selectedNodeRef.current = null
          selectedEdgesColorsRef.current = []
          selectedEdgesSizesRef.current = []

          currentVisibleNodes = visibleNodes
        }
      }

      rebuildRef.current = rebuild

      // Helper functions in zooming in/out
      const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))
      const restoreRatio = (): void => {
        camera.setState({ ratio: zoomRatios[currentZoomIndexRef.current] })
      }

      const zoomIn = async (): Promise<void> => {
        if (isProcessingRef.current) return

        const currentZoomIndex = currentZoomIndexRef.current
        const zoomRatios = zoomRatiosRef.current

        if (currentZoomIndex < zoomRatios.length - 1) {
          isProcessingRef.current = true
          setIsLoading(true)
          const newIndex = currentZoomIndex + 1
          currentZoomIndexRef.current = newIndex
          camera.setState({ ratio: zoomRatios[newIndex] })
          await rebuild(0)
          await sleep(200)

          // Restore ratio, cause double click Sigma event modifies it too
          restoreRatio()

          isProcessingRef.current = false
          setIsLoading(false)
        }
      }

      const zoomOut = async (): Promise<void> => {
        if (isProcessingRef.current) return

        const currentZoomIndex = currentZoomIndexRef.current
        const zoomRatios = zoomRatiosRef.current

        if (currentZoomIndex > 0) {
          isProcessingRef.current = true
          setIsLoading(true)
          const newIndex = currentZoomIndex - 1
          currentZoomIndexRef.current = newIndex
          camera.setState({ ratio: zoomRatios[newIndex] })
          await rebuild(0)
          await sleep(200)
          isProcessingRef.current = false
          setIsLoading(false)
        }
      }

      renderer.on('doubleClickStage', zoomIn)
      renderer.on('doubleClickNode', zoomIn)
      renderer.on('rightClickStage', zoomOut)

      renderer.on('downStage', (e) => {
        startPosRef.current = { x: e.event.x, y: e.event.y }
      })

      renderer.on('upStage', async (e) => {
        if (isProcessingRef.current) return

        isProcessingRef.current = true
        setIsLoading(true)

        const xStart = startPosRef.current.x
        const yStart = startPosRef.current.y

        const deltaX = e.event.x - xStart
        const deltaY = e.event.y - yStart
        console.log(deltaX, deltaY)

        const visibility = getVisibilityRanges(camera, renderer, container, deltaY)
        const visibleNodes = getVisibleNodes(nodes, visibility)

        if (visibleNodesChanged(visibleNodes, currentVisibleNodes)) {
          await rebuild(deltaY)
          await sleep(200)
        }

        isProcessingRef.current = false
        setIsLoading(false)
      })

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

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {isLoading && (
        <div className="loading-overlay-react">
          <div className="spinner"></div>
          <p className="loading-text">Przetwarzanie grafu...</p>
        </div>
      )}
    </div>
  )
}
