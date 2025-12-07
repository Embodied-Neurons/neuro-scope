import { Node, PosInfo } from './types'

export function getAllNodesByLayers(nodes: Node[], layerSizes: number[]): Node[][] {
  const nodesByLayers: Node[][] = []
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

export function getNodesPosInfo(nodesByLayers: Node[][]): PosInfo[] {
  const posInfo: PosInfo[] = []
  let minX: number, maxX: number, minY: number, maxY: number

  for (const nodeLayer of nodesByLayers) {
    const nodeLayerXs = nodeLayer.map((node) => node.x)
    const nodeLayerYs = nodeLayer.map((node) => node.y)

    minX = Math.min(...nodeLayerXs)
    maxX = Math.max(...nodeLayerXs)
    minY = Math.min(...nodeLayerYs)
    maxY = Math.max(...nodeLayerYs)

    posInfo.push({ minX, maxX, minY, maxY })
  }

  return posInfo
}
