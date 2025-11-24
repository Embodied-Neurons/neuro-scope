import { Graph, Node } from './types'

export function buildGraph(graph: Graph, nodes: Node[][]): void {
  nodes.forEach((layer) => {
    layer.forEach((node) => {
      graph.addNode(node.id, {
        x: node.x,
        y: node.y,
        size: 5,
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
      graph.addEdge(node, prevNode.id, {
        id: `edge_${node}-${prevNode.id}`,
        color: '#ffffff'
      })
    })
  }

  if (layerIdx < numLayers - 1) {
    nodes[layerIdx + 1].forEach((nextNode) => {
      graph.addEdge(nextNode.id, node, {
        id: `edge_${nextNode.id}-${node}`,
        color: '#ffffff'
      })
    })
  }
}
