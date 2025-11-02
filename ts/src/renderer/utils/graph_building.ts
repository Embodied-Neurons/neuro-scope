import { MAX_GROUPS } from './consts'
import * as types from './types'

export async function groupNeurons(
  visibleNodes: types.Node[][],
  allNodes: types.Node[][],
  containerHeight: number,
  originalSizes: number[],
  outputDir: string,
  batch: number,
  zoomRatio: number = 1.0
): Promise<{ neuronLayers: types.Node[][]; edges: types.Edge[] }> {
  const layerVisibility: boolean[] = []
  let maxVisibleNeurons = 0
  let yExtent = 1

  for (let i = 0; i < visibleNodes.length; i++) {
    const nodeLayer: Array<{ x: number; y: number }> = visibleNodes[i]
    layerVisibility.push(nodeLayer.length > 0)

    if (nodeLayer.length > maxVisibleNeurons) {
      maxVisibleNeurons = nodeLayer.length
      yExtent = nodeLayer[nodeLayer.length - 1].y - nodeLayer[0].y
    }
  }

  yExtent = Math.min(1, yExtent / containerHeight / zoomRatio)

  const neuronsPerGroup = Math.ceil(Math.max(...originalSizes) / MAX_GROUPS)
  const visibleNeuronsPerGroup = Math.ceil(maxVisibleNeurons / MAX_GROUPS / yExtent)
  const layerGroups: number[] = []
  let flag = false

  for (let i = 0; i < visibleNodes.length; i++) {
    if (layerVisibility[i]) {
      const size = visibleNodes[i].length
      layerGroups.push(Math.ceil(size / visibleNeuronsPerGroup))
      flag = true
    } else if (flag || (i < visibleNodes.length - 1 && layerVisibility[i + 1])) {
      const size = originalSizes[i]
      layerGroups.push(Math.ceil(size / neuronsPerGroup))
      flag = false
    } else {
      layerGroups.push(0)
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
          size: Math.max(1.4, 0.7 * (nodes[neuronIndex + groupShift].y - nodes[neuronIndex].y))
        })
      }

      if (nodes.length % visibleNeuronsPerGroup) {
        lastGroupShift = Math.floor(0.5 * (nodes.length % visibleNeuronsPerGroup))
      } else {
        lastGroupShift = Math.floor(0.5 * visibleNeuronsPerGroup)
      }
    } else if (layerGroups[i] > 0) {
      nodes = allNodes[i]
      const groupShift = Math.floor(0.5 * neuronsPerGroup)

      for (let j = 0; j < layerGroups[i] - 1; j++, neuronIndex += neuronsPerGroup) {
        neuronLayers[neuronLayers.length - 1].push({
          id: nodes[neuronIndex].id,
          x: nodes[neuronIndex].x,
          y: nodes[neuronIndex + groupShift].y,
          size: Math.max(1.4, 0.7 * (nodes[neuronIndex + groupShift].y - nodes[neuronIndex].y))
        })
      }

      if (nodes.length % neuronsPerGroup) {
        lastGroupShift = Math.floor(0.5 * (nodes.length % neuronsPerGroup))
      } else {
        lastGroupShift = Math.floor(0.5 * neuronsPerGroup)
      }
    } else {
      continue
    }

    neuronLayers[neuronLayers.length - 1].push({
      id: nodes[neuronIndex].id,
      x: nodes[neuronIndex].x,
      y: nodes[neuronIndex + lastGroupShift].y,
      size: Math.max(1.4, 0.7 * (nodes[neuronIndex + lastGroupShift].y - nodes[neuronIndex].y)),
      weight: 0
    })
  }

  const edges: types.Edge[] = await fetchCompressedEdges(
    outputDir,
    batch,
    originalSizes,
    visibleNeuronsPerGroup,
    layerGroups,
    neuronLayers,
    layerVisibility
  )

  return { neuronLayers, edges }
}

async function fetchCompressedEdges(
  outputDir: string,
  batch: number,
  originalSizes: number[],
  visibleNeuronsPerGroup: number,
  layerGroups: number[],
  neuronLayers: types.Node[][],
  layerVisibility: boolean[]
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
    const colorMap = new Map<boolean, string>([
      [false, '#c2c2c2'],
      [true, '#2c2c2c']
    ])

    for (let i = 0; i < layerGroups.length - 1; i++) {
      const first = neuronLayers[i]
      const second = neuronLayers[i + 1]
      const gradKey = `fc${i + 1}.grad`
      const activKey = `fc${i + 1}.activ`
      const gradMatrix = gradients[gradKey]
      const activList = activations[activKey]
      const color = colorMap.get(layerVisibility[i] && layerVisibility[i + 1])!

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
  containerWidth: number,
  containerHeight: number,
  neuronLayers: types.Node[][],
  edges: types.Edge[]
): void {
  // drop all current nodes (edges are dropped as well)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  graph.forEachNode((node, _) => {
    graph.dropNode(node)
  })

  // dummy nodes, otherwise sigma tries to be smart and scale coordinates
  graph.addNode('dummy1', { x: 0, y: 0, color: '#ffffff' })
  graph.addNode('dummy2', { x: containerWidth, y: containerHeight, color: '#ffffff' })

  neuronLayers.forEach((layer) => {
    layer.forEach((node) => {
      graph.addNode(node.id, {
        x: node.x,
        y: node.y,
        size: node.size,
        color: '#c0c0c0',
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
      size: 0.5,
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
