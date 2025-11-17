import { MAX_GROUPS } from './consts'
import * as types from './types'

export async function groupNeurons(
  visibleNodes: types.Node[][],
  allNodes: types.Node[][],
  originalSizes: number[],
  outputDir: string,
  batch: number
): Promise<{ neuronLayers: types.Node[][]; edges: types.Edge[] }> {
  const layerVisibility: boolean[] = []
  let maxVisibleNeurons = 0

  for (let i = 0; i < visibleNodes.length; i++) {
    const nodeLayer: Array<{ x: number; y: number }> = visibleNodes[i]
    layerVisibility.push(nodeLayer.length > 0)

    if (nodeLayer.length > maxVisibleNeurons) {
      maxVisibleNeurons = nodeLayer.length
    }
  }

  const neuronsPerGroup = Math.ceil(Math.max(...originalSizes) / MAX_GROUPS)
  const visibleNeuronsPerGroup = Math.ceil(maxVisibleNeurons / MAX_GROUPS)
  const layerGroups: number[] = []

  for (let i = 0; i < visibleNodes.length; i++) {
    if (layerVisibility[i]) {
      const size = visibleNodes[i].length
      layerGroups.push(Math.ceil(size / visibleNeuronsPerGroup))
    } else {
      const size = originalSizes[i]
      layerGroups.push(Math.ceil(size / neuronsPerGroup))
    }
  }

  const neuronLayers: types.Node[][] = []

  for (let i = 0; i < layerGroups.length; i++) {
    neuronLayers.push([])
    let nodes: types.Node[]
    let neuronIndex = 0
    let lastGroupShift: number

    if (layerVisibility[i]) {
      nodes = visibleNodes[i]
      const groupShift = Math.floor(0.5 * visibleNeuronsPerGroup)

      for (let j = 0; j < layerGroups[i] - 1; j++, neuronIndex += visibleNeuronsPerGroup) {
        neuronLayers[neuronLayers.length - 1].push({
          id: nodes[neuronIndex].id,
          x: nodes[neuronIndex].x,
          y: nodes[neuronIndex + groupShift].y,
          size: Math.max(
            1.5,
            Math.sqrt(2500 * (nodes[neuronIndex + groupShift].y - nodes[neuronIndex].y))
          )
        })
      }

      if (nodes.length % visibleNeuronsPerGroup) {
        lastGroupShift = Math.floor(0.5 * (nodes.length % visibleNeuronsPerGroup))
      } else {
        lastGroupShift = Math.floor(0.5 * visibleNeuronsPerGroup)
      }
    } else {
      nodes = allNodes[i]
      const groupShift = Math.floor(0.5 * neuronsPerGroup)

      for (let j = 0; j < layerGroups[i] - 1; j++, neuronIndex += neuronsPerGroup) {
        neuronLayers[neuronLayers.length - 1].push({
          id: nodes[neuronIndex].id,
          x: nodes[neuronIndex].x,
          y: nodes[neuronIndex + groupShift].y,
          size: Math.max(
            1.5,
            Math.sqrt(2500 * (nodes[neuronIndex + groupShift].y - nodes[neuronIndex].y))
          )
        })
      }

      if (nodes.length % neuronsPerGroup) {
        lastGroupShift = Math.floor(0.5 * (nodes.length % neuronsPerGroup))
      } else {
        lastGroupShift = Math.floor(0.5 * neuronsPerGroup)
      }
    }

    neuronLayers[neuronLayers.length - 1].push({
      id: nodes[neuronIndex].id,
      x: nodes[neuronIndex].x,
      y: nodes[neuronIndex + lastGroupShift].y,
      size: Math.max(
        1.5,
        Math.sqrt(2500 * (nodes[neuronIndex + lastGroupShift].y - nodes[neuronIndex].y))
      )
    })
  }

  const edges: types.Edge[] = await fetchCompressedEdges(
    outputDir,
    batch,
    originalSizes,
    visibleNeuronsPerGroup,
    layerGroups,
    neuronLayers
  )

  return { neuronLayers, edges }
}

async function fetchCompressedEdges(
  outputDir: string,
  batch: number,
  originalSizes: number[],
  visibleNeuronsPerGroup: number,
  layerGroups: number[],
  neuronLayers: types.Node[][]
): Promise<types.Edge[]> {
  const edges: types.Edge[] = []

  try {
    const data = await window.api.getCompressedNeuralNetworkData(
      originalSizes,
      visibleNeuronsPerGroup,
      outputDir,
      batch
    )
    const gradients: Record<string, types.Stats[][]> = data.gradients || {}
    const activations: Record<string, types.Stats[]> = data.activations || {}

    for (let i = 0; i < layerGroups.length - 1; i++) {
      const first = neuronLayers[i]
      const second = neuronLayers[i + 1]
      const gradKey = `fc${i + 1}.grad`
      const activKey = `fc${i + 1}.activ`
      const gradMatrix = gradients[gradKey]
      const activList = activations[activKey]
      const color = '#949494'

      if (!gradMatrix || !activList) continue

      for (let j = 0; j < first.length; j++) {
        for (let k = 0; k < second.length; k++) {
          const fNeuron = first[j]
          const sNeuron = second[k]
          const activStats = activList[k]
          const gradStats = gradMatrix[k][j]

          sNeuron.activation = activStats?.value ?? 0
          sNeuron.mean = activStats?.mean ?? 0
          sNeuron.min = activStats?.min ?? 0
          sNeuron.max = activStats?.max ?? 0
          sNeuron.weight = activStats?.normalized ?? 0

          edges.push({
            id: `edge_${fNeuron.id}-${sNeuron.id}`,
            src: fNeuron.id,
            tgt: sNeuron.id,
            color,
            weight: gradStats?.normalized ?? 0,
            gradValue: gradStats?.value ?? 0,
            gradMean: gradStats?.mean ?? 0,
            gradMin: gradStats?.min ?? 0,
            gradMax: gradStats?.max ?? 0
          })
        }
      }
    }

    return edges
  } catch (err) {
    console.error('Error fetching compressed edges:', err)
    return edges
  }
}

export function buildGraph(
  graph: types.Graph,
  neuronLayers: types.Node[][],
  edges: types.Edge[]
): void {
  // drop all current nodes (edges are dropped as well)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  graph.forEachNode((node, _) => {
    graph.dropNode(node)
  })

  // Track maximum node size to determine edge width
  let maxNodeSize: number = 0

  neuronLayers.forEach((layer) => {
    layer.forEach((node) => {
      maxNodeSize = Math.max(maxNodeSize, node.size)
      graph.addNode(node.id, {
        x: node.x,
        y: node.y,
        size: node.size,
        color: '#b1b1b1',
        weight: node.weight,
        activation: node.activation,
        mean: node.mean,
        min: node.min,
        max: node.max
      })
    })
  })

  edges.forEach((edge) => {
    graph.addEdge(edge.src, edge.tgt, {
      id: edge.id,
      size: 0.25 * maxNodeSize,
      zIndex: 0,
      color: edge.color,
      weight: edge.weight,
      gradValue: edge.gradValue,
      gradMean: edge.gradMean,
      gradMin: edge.gradMin,
      gradMax: edge.gradMax
    })
  })
}
