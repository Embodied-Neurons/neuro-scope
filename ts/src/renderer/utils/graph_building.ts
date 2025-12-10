import { Graph, Node, linearActivStats, linearGradStats } from './types'

export function buildGraph(graph: Graph, nodes: Node[][], activations: linearActivStats): void {
  let counter = 0
  const firstLayer = nodes[0].length

  nodes.forEach((layer) => {
    layer.forEach((node) => {
      graph.addNode(node.id, {
        x: node.x,
        y: node.y,
        size: 5,
        zIndex: 1,
        color: '#b1b1b1',
        weight: counter >= firstLayer ? activations[counter - firstLayer].norm : 0,
        activation: counter >= firstLayer ? activations[counter - firstLayer].raw : 0,
        firstLayer: counter >= firstLayer
      })

      counter += 1
    })
  })
}

export function buildEdges(
  graph: Graph,
  nodes: Node[][],
  gradients: linearGradStats,
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
    const ws = gradients[idNumber - layerSizes[0]].norm
    let counter = 0

    nodes[layerIdx - 1].forEach((prevNode) => {
      const w = ws[counter]
      const color = `rgb(${Math.round(255 * (1 - w))}, ${Math.round(255 * w)}, 0)`
      graph.addEdge(prevNode.id, node, {
        id: `edge_${prevNode.id}-${node}`,
        color: color
      })

      counter += 1
    })
  }

  if (layerIdx < numLayers - 1) {
    let counter = 0
    const shift = neuronCount + layerSizes[layerIdx] - layerSizes[0]

    nodes[layerIdx + 1].forEach((nextNode) => {
      const w = gradients[shift + counter].norm[idNumber - neuronCount]
      const color = `rgb(${Math.round(255 * (1 - w))}, ${Math.round(255 * w)}, 0)`
      graph.addEdge(node, nextNode.id, {
        id: `edge_${node}-${nextNode.id}`,
        color: color
      })

      counter += 1
    })
  }
}
