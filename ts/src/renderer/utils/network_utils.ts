import * as path from 'path'
import fs from 'fs/promises'
import * as types from './types'
import { OUTPUT_DIR_BASE } from '../../main'
import { compressNeuronLayers, normalizeGroupsAct, normalizeGroupsGrad } from './neuron_utils'

function generateMlpLayout(layerSizes: number[]): types.Position[] {
  const layout: types.Position[] = []
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

export async function getNeuralNetworkVisualization(
  outputDir: string,
  batchId: number = 0
): Promise<types.NeuralNetworkData> {
  const graphPath = path.join(OUTPUT_DIR_BASE, outputDir, 'graph_structure.json')
  console.log(`Graph path: ${graphPath}`)

  try {
    await fs.access(graphPath)
  } catch {
    throw new Error('Graph structure not found')
  }

  const structureRaw = await fs.readFile(graphPath, 'utf-8')
  const structure: types.GraphStructure = JSON.parse(structureRaw)

  const actPath = path.join(OUTPUT_DIR_BASE, outputDir, `batch_${batchId}_activations.json`)
  const gradPath = path.join(OUTPUT_DIR_BASE, outputDir, `batch_${batchId}_gradients.json`)

  const [actRaw, gradRaw] = await Promise.all([
    fs.readFile(actPath, 'utf-8'),
    fs.readFile(gradPath, 'utf-8')
  ])

  const activations: Record<string, number[][]> = JSON.parse(actRaw)
  const gradients: Record<string, number[][]> = JSON.parse(gradRaw)
  const positions = generateMlpLayout(structure.layerSizes)
  const nodes: types.Node[] = structure.nodes.map((node, i) => ({
    id: String(i),
    label: node.label,
    x: positions[i].x,
    y: positions[i].y,
    size: 1
  }))

  const edges: types.EdgeLayout[] = structure.edges.map(([src, dst], idx) => ({
    id: `e${idx}`,
    source: String(src),
    target: String(dst)
  }))

  return {
    nodes,
    edges,
    activations,
    gradients,
    layerSizes: structure.layerSizes,
    nodeLabels: structure.nodes.map((n) => n.label)
  }
}

export async function getCompressedNeuralNetworkData(
  layerSizes: number[],
  layerCount?: number,
  outputDir: string = '',
  batchId = 0
): Promise<types.CompressedData> {
  if (!layerSizes.length) {
    throw new Error("Missing or invalid 'layerSizes' argument")
  }

  const actPath = path.join(OUTPUT_DIR_BASE, outputDir, `batch_${batchId}_activations.json`)
  const gradPath = path.join(OUTPUT_DIR_BASE, outputDir, `batch_${batchId}_gradients.json`)

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
  const groupedGradients: Record<string, types.Stats[][]> = {}
  const groupedActivations: Record<string, types.Stats[]> = {}

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
export async function detectBatch(outputDir: string, batch: number): Promise<null> {
  const actPath = path.join(OUTPUT_DIR_BASE, outputDir, `batch_${batch}_activations.json`)
  const gradPath = path.join(OUTPUT_DIR_BASE, outputDir, `batch_${batch}_gradients.json`)

  try {
    await fs.access(actPath)
    await fs.access(gradPath)
  } catch {
    console.log('INFO: all batches detected!')
  }

  return null
}
