import { RefObject } from 'react'
import Sigma from 'sigma'
import * as types from './types'
import { calculateBounds } from './camera_bounding'
import { buildEdges } from './graph_building'

export function colorGraphNodes(graph: types.Graph): void {
  const graphNodes = graph.nodes()
  graphNodes.forEach((node) => {
    const weight = graph.getNodeAttribute(node, 'weight') as number
    const color = `rgb(${Math.round(255 * (1 - weight))}, ${Math.round(255 * weight)}, 0)`
    graph.setNodeAttribute(node, 'color', color)
  })
}

export function initializeRendererAndCamera(
  graph: types.Graph,
  container: HTMLDivElement,
  rendererRef: RefObject<Sigma<types.Attributes, types.Attributes, types.Attributes> | null>
): { renderer: types.SigmaRenderer; camera: types.Camera } {
  const renderer = new Sigma(graph, container, {
    minCameraRatio: 0.05,
    maxCameraRatio: 1.2,
    zIndex: true
  })

  rendererRef.current = renderer
  const camera = renderer.getCamera()
  camera.setState({ x: 0.5, y: 0.5, ratio: 1.0 })

  return { renderer, camera }
}

export function restrictCameraMovement(
  camera: types.Camera,
  renderer: types.SigmaRenderer,
  container: HTMLDivElement,
  posInfo: types.PosInfo[]
): void {
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

export function registerClickNodeListener(
  renderer: types.SigmaRenderer,
  graphRef: RefObject<types.Graph | null>,
  selectedNodeRef: RefObject<string | null>,
  onNodeSelect: (nodeData: Record<string, unknown> | null) => void,
  nodes: types.Node[][] | null,
  data: types.NeuralNetworkData | null
): void {
  renderer.on('clickNode', ({ node }: { node: string }) => {
    if (!graphRef.current) return

    const graph = graphRef.current

    if (selectedNodeRef.current) {
      const prevNode = selectedNodeRef.current
      const prevEdges = graph.edges(prevNode)
      graph.setNodeAttribute(prevNode, 'zIndex', 1)
      prevEdges.forEach((edge) => {
        graph.dropEdge(edge)
      })
    }

    if (selectedNodeRef.current !== node) {
      selectedNodeRef.current = node

      if (nodes !== null && data !== null) {
        buildEdges(graph, nodes, data.gradients!, node, data.layerSizes)
      }

      const nodeData = graph.getNodeAttributes(node)
      graph.setNodeAttribute(node, 'zIndex', 2)
      onNodeSelect({ ...nodeData })
    } else {
      selectedNodeRef.current = null
      onNodeSelect(null)
    }
  })
}
