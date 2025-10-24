import * as types from './types'

export function getAllNodesByLayers(nodes: types.Node[], layerSizes: number[]): types.Node[][] {
  const nodesByLayers: types.Node[][] = []
  let previousNeuronCount = 0

  for (const layerSize of layerSizes) {
    nodesByLayers.push([])

    for (let i = 0; i < layerSize; i++) {
      nodesByLayers[nodesByLayers.length - 1].push(nodes[i + previousNeuronCount])
    }

    previousNeuronCount += layerSize
  }

  return nodesByLayers
}

export function getNodesPosInfo(
  nodesByLayers: types.Node[][],
  containerWidth: number,
  containerHeight: number
): types.PosInfo[] {
  const posInfo: types.PosInfo[] = []
  let x: number, minY: number, maxY: number

  for (const nodesLayer of nodesByLayers) {
    x = nodesLayer[0].x
    minY = nodesLayer[0].y
    maxY = nodesLayer[nodesLayer.length - 1].y

    posInfo.push({
      x: x / containerWidth,
      minY: minY / containerHeight,
      maxY: maxY / containerHeight
    })
  }

  return posInfo
}

export function visibleNodesChanged(newNodes: types.Node[][], oldNodes: types.Node[][]): boolean {
  for (let i = 0; i < newNodes.length; i++) {
    if (newNodes[i].length !== oldNodes[i].length) {
      return true
    }
  }

  return false
}

export function anyNodeVisible(nodesByLayers: types.Node[][]): number {
  return nodesByLayers.map((layer) => layer.length).reduce((sum, el) => sum + el, 0)
}

export function getVisibleNodes(
  nodes: types.Node[][],
  containerWidth: number,
  containerHeight: number,
  visibilityRanges: { minX: number; maxX: number; minY: number; maxY: number }
): types.Node[][] {
  const { minX, maxX, minY, maxY } = visibilityRanges
  const visibleNodes: types.Node[][] = []

  for (const nodeLayer of nodes) {
    visibleNodes.push([])

    if (nodeLayer[0].x / containerWidth < minX || nodeLayer[0].x / containerWidth > maxX) {
      continue
    }

    for (const node of nodeLayer) {
      if (node.y / containerHeight >= minY && node.y / containerHeight <= maxY) {
        visibleNodes[visibleNodes.length - 1].push(node)
      }
    }
  }

  return visibleNodes
}
