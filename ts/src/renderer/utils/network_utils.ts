import path from 'path'
import fs from 'fs/promises'
import * as types from './types'
import { OUTPUT_DIR_BASE } from '../../main'
import { linearizeActivations, linearizeGradients } from './neuron_utils'

function generateMlpLayout(layerSizes: number[]): types.Position[] {
  const layout: types.Position[] = []
  const numLayers = layerSizes.length
  const xStep = numLayers > 1 ? 1 / (numLayers - 1) : 0

  for (let layerIdx = 0; layerIdx < numLayers; layerIdx++) {
    const xMid = layerIdx * xStep
    const xBurst = 0.008 * Math.sqrt(layerSizes[layerIdx])
    const yBurst = 0.08 / Math.sqrt(layerSizes[layerIdx])

    for (let i = 0; i < layerSizes[layerIdx]; i++) {
      const x = xMid + xBurst * (Math.random() - 0.5)
      const yMid = layerSizes[layerIdx] > 1 ? i / (layerSizes[layerIdx] - 1) : 0.5
      const y = yMid + yBurst * (Math.random() - 0.5)
      layout.push({ x, y })
    }
  }

  return layout
}

export async function getNeuralNetworkVisualization(
  outputDir: string,
  epoch: number = 0
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

  const actPath = path.join(OUTPUT_DIR_BASE, outputDir, `epoch_${epoch}_activations.json`)
  const gradPath = path.join(OUTPUT_DIR_BASE, outputDir, `epoch_${epoch}_gradients.json`)

  let actRaw: string
  let gradRaw: string

  try {
    ;[actRaw, gradRaw] = await Promise.all([
      fs.readFile(actPath, 'utf-8'),
      fs.readFile(gradPath, 'utf-8')
    ])
  } catch {
    throw new Error('Activation or gradient data not found')
  }

  const activations: Record<string, number[]> = JSON.parse(actRaw)
  const linearizedActivations: types.linearActivStats = linearizeActivations(
    activations,
    structure.layerSizes.length
  )

  const gradients: Record<string, number[][]> = JSON.parse(gradRaw)
  const linearizedGradients: types.linearGradStats = linearizeGradients(
    gradients,
    structure.layerSizes.length
  )

  const positions = generateMlpLayout(structure.layerSizes)
  const nodes: types.Node[] = structure.nodes.map((node, i) => ({
    id: String(i),
    label: node.label,
    x: positions[i].x,
    y: positions[i].y
  }))

  const edges: types.Edge[] = structure.edges.map(([src, tgt]) => ({
    id: `edge_${src}-${tgt}`,
    src: String(src),
    tgt: String(tgt)
  }))

  return {
    nodes,
    edges,
    gradients: linearizedGradients,
    activations: linearizedActivations,
    layerSizes: structure.layerSizes,
    nodeLabels: structure.nodes.map((n) => n.label)
  }
}

export async function getActivationsFromImageInput(outputDir: string): Promise<{
  nodes: types.Node[]
  activations: types.linearActivStats
  layerSizes: number[]
}> {
  const graphPath = path.join(OUTPUT_DIR_BASE, outputDir, 'graph_structure.json')
  console.log(`Graph path: ${graphPath}`)

  try {
    await fs.access(graphPath)
  } catch {
    throw new Error('Graph structure not found')
  }

  const structureRaw = await fs.readFile(graphPath, 'utf-8')
  const structure: types.GraphStructure = JSON.parse(structureRaw)
  const actPath = path.join(OUTPUT_DIR_BASE, outputDir, 'test_activations.json')

  let actRaw: string

  try {
    ;[actRaw] = await Promise.all([fs.readFile(actPath, 'utf-8')])
  } catch {
    throw new Error('Activation data not found')
  }

  const activations: Record<string, number[]> = JSON.parse(actRaw)
  const linearizedActivations = linearizeActivations(activations, structure.layerSizes.length)
  const positions = generateMlpLayout(structure.layerSizes)
  const nodes: types.Node[] = structure.nodes.map((node, i) => ({
    id: String(i),
    label: node.label,
    x: positions[i].x,
    y: positions[i].y
  }))

  return {
    nodes,
    activations: linearizedActivations,
    layerSizes: structure.layerSizes
  }
}

export async function detectEpoch(outputDir: string, epoch: number): Promise<null> {
  const actPath = path.join(OUTPUT_DIR_BASE, outputDir, `epoch_${epoch}_activations.json`)
  const gradPath = path.join(OUTPUT_DIR_BASE, outputDir, `epoch_${epoch}_gradients.json`)

  try {
    await fs.access(actPath)
    await fs.access(gradPath)
  } catch {
    console.log('INFO: all epochs detected!')
  }

  return null
}
