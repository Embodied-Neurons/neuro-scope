import path = require('path')
import fs = require('fs/promises')
import {
  normalizeGroupsGrad,
  normalizeGroupsAct,
  compressNeuronLayers,
  ChunkStats,
  ChunkGroup
} from './neuron_utils'

// todo !!
const MODEL_PATH = ''
const OUTPUT_DIR = ''
const NUM_BATCHES = 10

interface NodeInfo {
  label: string
}

interface GraphStructure {
  layer_sizes: number[]
  nodes: NodeInfo[]
  edges: [number, number][]
}

interface Position {
  x: number
  y: number
}

interface NodeLayout {
  id: string
  label: string
  x: number
  y: number
}

interface EdgeLayout {
  id: string
  source: string
  target: string
}

interface NeuralNetworkData {
  nodes: NodeLayout[]
  edges: EdgeLayout[]
  activations: Record<string, number[][]>
  gradients: Record<string, number[][]>
  layer_sizes: number[]
  node_labels: string[]
}

interface CompressedData {
  gradients: Record<string, ChunkGroup>
  activations: Record<string, ChunkStats[]>
}

function generateMlpLayout(layerSizes: number[]): Position[] {
  const layout: Position[] = []
  const maxNeurons = Math.max(...layerSizes)
  const numLayers = layerSizes.length
  const width = 960
  const height = 720

  const xStep = numLayers > 1 ? width / (numLayers - 1) : 0
  const yStep = maxNeurons > 1 ? height / (maxNeurons - 1) : 0

  for (let layerIdx = 0; layerIdx < numLayers; layerIdx++) {
    const size = layerSizes[layerIdx]
    const x = layerIdx * xStep
    const yOffset = (height - yStep * (size - 1)) / 2

    for (let i = 0; i < size; i++) {
      const y = yOffset + i * yStep
      layout.push({ x, y })
    }
  }

  return layout
}

export async function getNeuralNetworkVisualization(batchId = 0): Promise<NeuralNetworkData> {
  const graphPath = path.join(OUTPUT_DIR, 'graph_structure.json')

  try {
    await fs.access(graphPath)
  } catch {
    throw new Error('Graph structure not found')
  }

  const structureRaw = await fs.readFile(graphPath, 'utf-8')
  const structure: GraphStructure = JSON.parse(structureRaw)

  const actPath = path.join(OUTPUT_DIR, `batch_${batchId}_activations.json`)
  const gradPath = path.join(OUTPUT_DIR, `batch_${batchId}_gradients.json`)

  const [actRaw, gradRaw] = await Promise.all([
    fs.readFile(actPath, 'utf-8'),
    fs.readFile(gradPath, 'utf-8')
  ])

  const activations: Record<string, number[][]> = JSON.parse(actRaw)
  const gradients: Record<string, number[][]> = JSON.parse(gradRaw)

  const positions = generateMlpLayout(structure.layer_sizes)
  const nodes: NodeLayout[] = structure.nodes.map((node, i) => ({
    id: String(i),
    label: node.label,
    x: positions[i].x,
    y: positions[i].y
  }))

  const edges: EdgeLayout[] = structure.edges.map(([src, dst], idx) => ({
    id: `e${idx}`,
    source: String(src),
    target: String(dst)
  }))

  return {
    nodes,
    edges,
    activations,
    gradients,
    layer_sizes: structure.layer_sizes,
    node_labels: structure.nodes.map((n) => n.label)
  }
}

export async function getCompressedNeuralNetworkData(
  layerSizes: number[],
  layerCount?: number,
  batchId = 0
): Promise<CompressedData> {
  if (!layerSizes.length) {
    throw new Error("Missing or invalid 'layerSizes' argument")
  }

  const actPath = path.join(OUTPUT_DIR, `batch_${batchId}_activations.json`)
  const gradPath = path.join(OUTPUT_DIR, `batch_${batchId}_gradients.json`)

  let activationsRaw: string
  let gradientsRaw: string

  try {
    ;[activationsRaw, gradientsRaw] = await Promise.all([
      fs.readFile(actPath, 'utf-8'),
      fs.readFile(gradPath, 'utf-8')
    ])
  } catch {
    throw new Error('Activation or gradient data not found')
  }

  const activations: Record<string, number[][]> = JSON.parse(activationsRaw)
  const gradients: Record<string, number[][]> = JSON.parse(gradientsRaw)

  const compressed = compressNeuronLayers(layerSizes, layerCount ?? layerSizes.length)

  const groupedGradients: Record<string, ChunkGroup> = {}
  const groupedActivations: Record<string, ChunkStats[]> = {}

  for (let i = 1; i < layerSizes.length; i++) {
    const weightKey = `fc${i}.weight`
    const gradKey = `fc${i}.grad`

    if (!(weightKey in gradients)) continue

    groupedGradients[gradKey] = normalizeGroupsGrad(
      gradients[weightKey],
      compressed[i - 1],
      compressed[i]
    )
  }

  const lastVal: Record<number, string> = {}
  for (const [key, value] of Object.entries(activations)) {
    const len = value[0]?.length ?? 0
    lastVal[len] = key
  }

  let layerIdx = 1
  for (const [key, value] of Object.entries(activations)) {
    const len = value[0]?.length ?? 0
    if (lastVal[len] !== key) continue

    const actKey = `fc${layerIdx}.activ`
    groupedActivations[actKey] = normalizeGroupsAct(value, compressed[layerIdx])
    layerIdx++
  }

  return {
    gradients: groupedGradients,
    activations: groupedActivations
  }
}
