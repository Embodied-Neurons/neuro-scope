import { RefObject } from 'react'
import Sigma from 'sigma'
import * as types from './types'
import { calculateBounds } from './camera_bounding'
import { findNodeLayer, buildEdges } from './graph_building'

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
  container: HTMLDivElement
): { renderer: types.SigmaRenderer; camera: types.Camera } {
  const renderer = new Sigma(graph, container, {
    minCameraRatio: 0.05,
    maxCameraRatio: 1.2,
    zIndex: true
  })

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

export function createClickNodeListener(
  graphRef: RefObject<types.Graph | null>,
  selectedNodeRef: RefObject<string | null>,
  onNodeSelect: (nodeData: Record<string, unknown> | null) => void,
  nodes: types.Node[][],
  data: types.NeuralNetworkData
): ({ node }: { node: string }) => void {
  return ({ node }: { node: string }) => {
    if (!graphRef.current) return

    const graph = graphRef.current

    if (selectedNodeRef.current) {
      const prevNode = selectedNodeRef.current
      const prevEdges = graph.edges(prevNode)
      const prevNodeLayer = findNodeLayer(Number(prevNode), data.layerSizes)
      prevEdges.forEach((edge) => {
        graph.dropEdge(edge)
      })

      nodes[prevNodeLayer].forEach((n) => {
        const weight = graph.getNodeAttribute(n.id, 'weight') as number
        const color = `rgb(${Math.round(255 * (1 - weight))}, ${Math.round(255 * weight)}, 0)`
        graph.setNodeAttribute(n.id, 'color', color)
        graph.setNodeAttribute(n.id, 'zIndex', 1)
      })
    }

    if (selectedNodeRef.current !== node) {
      selectedNodeRef.current = node
      buildEdges(graph, nodes, data.gradients ?? null, node, data.layerSizes)

      const nodeData = graph.getNodeAttributes(node)
      const nodeLayer = findNodeLayer(Number(node), data.layerSizes)
      graph.setNodeAttribute(node, 'zIndex', 2)
      nodes[nodeLayer].forEach((n) => {
        if (n.id !== node) {
          const weight = graph.getNodeAttribute(n.id, 'weight') as number
          const color = `rgb(${Math.round(85 * (1 - weight))}, ${Math.round(85 * weight)}, 0)`
          graph.setNodeAttribute(n.id, 'color', color)
        }
      })

      onNodeSelect({ ...nodeData })
    } else {
      selectedNodeRef.current = null
      onNodeSelect(null)
    }
  }
}

export function createClickStageListener(
  graphRef: RefObject<types.Graph | null>,
  selectedNodeRef: RefObject<string | null>,
  onNodeSelect: (nodeData: Record<string, unknown> | null) => void,
  nodes: types.Node[][],
  data: types.NeuralNetworkData
): () => void {
  return () => {
    if (!graphRef.current) return

    const graph = graphRef.current

    if (selectedNodeRef.current) {
      const prevNode = selectedNodeRef.current
      const prevEdges = graph.edges(prevNode)
      const prevNodeLayer = findNodeLayer(Number(prevNode), data.layerSizes)
      prevEdges.forEach((edge) => {
        graph.dropEdge(edge)
      })

      nodes[prevNodeLayer].forEach((n) => {
        const weight = graph.getNodeAttribute(n.id, 'weight') as number
        const color = `rgb(${Math.round(255 * (1 - weight))}, ${Math.round(255 * weight)}, 0)`
        graph.setNodeAttribute(n.id, 'color', color)
        graph.setNodeAttribute(n.id, 'zIndex', 1)
      })

      selectedNodeRef.current = null
      onNodeSelect(null)
    }
  }
}

export function highlightByActivation(
  graph: types.Graph,
  top: boolean,
  bottom: boolean,
  percent: number
): void {
  const ids = graph.nodes()

  if (!top && !bottom) {
    // Check if there is any selected node (which means, there are edges present)
    const edges = graph.edges()

    if (!edges.length) colorGraphNodes(graph)
    return
  }

  const nodes = ids
    .filter((id) => {
      const attrs = graph.getNodeAttributes(id)
      return attrs.firstLayer
    })
    .map((id) => {
      const attrs = graph.getNodeAttributes(id)
      return {
        id,
        activation: typeof attrs.activation === 'number' ? attrs.activation : 0
      }
    })

  const fraction = Math.max(1, Math.min(50, percent)) / 100
  const sorted = [...nodes].sort((a, b) => a.activation - b.activation)
  const count = Math.max(1, Math.floor(nodes.length * fraction))

  const bottomSet = new Set(sorted.slice(0, count).map((n) => n.id))
  const topSet = new Set(sorted.slice(-count).map((n) => n.id))

  ids.forEach((id) => {
    if (top && topSet.has(id)) {
      graph.setNodeAttribute(id, 'color', '#00ff00')
    } else if (bottom && bottomSet.has(id)) {
      graph.setNodeAttribute(id, 'color', '#ff0000')
    } else {
      graph.setNodeAttribute(id, 'color', '#808080')
    }
  })
}
export function findExtremeGradients(
  neuronIdx: string,
  graph: types.Graph
): {
  min: number | null
  max: number | null
  minEdge: string | null
  maxEdge: string | null
} {
  let min: number | null = null
  let max: number | null = null
  let minEdge: string | null = null
  let maxEdge: string | null = null

  graph.forEachEdge(neuronIdx, (edgeKey, attributes) => {
    const value = attributes.val
    if (typeof value !== 'number') return

    if (min === null || value < min) {
      min = value
      minEdge = edgeKey
    }

    if (max === null || value > max) {
      max = value
      maxEdge = edgeKey
    }
  })

  return { min, max, minEdge, maxEdge }
}

export function clearEdgeHighlight(graph: types.Graph, edgeKey: string | null): void {
  if (!edgeKey) return
  graph.setEdgeAttribute(edgeKey, 'color', graph.getEdgeAttribute(edgeKey, 'originalColor'))
  graph.removeEdgeAttribute(edgeKey, 'size')
}

export function highlightEdge(graph: types.Graph, edgeKey: string | null, color: string): void {
  if (!edgeKey) return
  graph.setEdgeAttribute(edgeKey, 'color', color)
  graph.setEdgeAttribute(edgeKey, 'size', 2.5)
}
