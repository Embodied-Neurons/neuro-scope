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
        weight: activations[counter].norm,
        activation: activations[counter].raw
        firstLayer: counter >= firstLayer
      })

      counter += 1
    })
  })
}

export function buildEdges(
  graph: Graph,
  nodes: Node[][],
  gradients: linearGradStats | null,
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
    if (layerIdx == 1 && gradients === null) {
      const side = Math.round(Math.sqrt(layerSizes[0]))

      for (let i = side - 1; i < layerSizes[0]; i += side) {
        graph.addEdge(nodes[0][i].id, node, {
          id: `edge_${nodes[0][i].id}-${node}`,
          color: 'rgb(204, 204, 204)',
          size: 5
        })
      }
    } else {
      const ws = gradients !== null ? gradients[idNumber - layerSizes[0]].norm : []
      let counter = 0

      nodes[layerIdx - 1].forEach((prevNode) => {
        const w = ws.length > 0 ? ws[counter] : 0.8
        const color = `rgb(${Math.round(255 * w)}, ${Math.round(255 * w)}, ${Math.round(255 * w)})`
        graph.addEdge(prevNode.id, node, {
          id: `edge_${prevNode.id}-${node}`,
          color: color
        })

        counter += 1
      })
    }
  }

  if (layerIdx < numLayers - 1) {
    let counter = 0
    const shift = neuronCount + layerSizes[layerIdx] - layerSizes[0]

    nodes[layerIdx + 1].forEach((nextNode) => {
      const w = gradients !== null ? gradients[shift + counter].norm[idNumber - neuronCount] : 0.8
      const color = `rgb(${Math.round(255 * w)}, ${Math.round(255 * w)}, ${Math.round(255 * w)})`
      graph.addEdge(node, nextNode.id, {
        id: `edge_${node}-${nextNode.id}`,
        color: color
      })

      counter += 1
    })
  }
}
