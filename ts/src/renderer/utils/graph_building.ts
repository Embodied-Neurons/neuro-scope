import { Graph, Node } from './types'

export function buildGraph(graph: Graph, nodes: Node[][]): void {
  nodes.forEach((layer) => {
    layer.forEach((node) => {
      graph.addNode(node.id, {
        x: node.x,
        y: node.y,
        size: 5,
        zIndex: 1,
        color: '#b1b1b1',
        weight: node.weight,
        activation: node.activation
      })
    })
  })
}

export function buildEdges(
  graph: Graph,
  nodes: Node[][],
  node: string,
  layerSizes: number[]
): void {
  let layerIdx = 0
  const idNumber = Number(node)
  const numLayers = layerSizes.length
  let neuronCount = 0

  for (let i = 0; i < numLayers; i++) {
    if (neuronCount <= idNumber && idNumber < neuronCount + layerSizes[i]) {
      layerIdx = i
      break
    }

    neuronCount += layerSizes[i]
  }

  if (layerIdx > 0) {
    nodes[layerIdx - 1].forEach((prevNode) => {
      graph.addEdge(prevNode.id, node, {
        id: `edge_${prevNode.id}-${node}`,
        color: '#ffffff'
      })
    })
  }

  if (layerIdx < numLayers - 1) {
    nodes[layerIdx + 1].forEach((nextNode) => {
      graph.addEdge(node, nextNode.id, {
        id: `edge_${node}-${nextNode.id}`,
        color: '#ffffff'
      })
    })
  }
}
