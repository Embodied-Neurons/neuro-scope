import path from 'path'
import fs from 'fs/promises'
import * as types from './types'
import { OUTPUT_DIR_BASE } from '../../main'
import { linearizeActivations, linearizeGradients } from './neuron_utils'

function generateMlpLayout(layerSizes: number[]): types.Position[] {
  const layout: types.Position[] = []
  const numLayers = layerSizes.length
  const xStep = numLayers > 1 ? 1.5 / (numLayers - 1) : 0

  for (let layerIdx = 0; layerIdx < numLayers; layerIdx++) {
    const xMid = layerIdx * xStep
    const xBurst = 0.01 * Math.sqrt(layerSizes[layerIdx])
    const yBurst = 0.01 / Math.sqrt(layerSizes[layerIdx])
    const yFactor = Math.sqrt(Math.log10(layerSizes[layerIdx]))

    for (let i = 0; i < layerSizes[layerIdx]; i++) {
      const yMid = yFactor * (layerSizes[layerIdx] > 1 ? i / (layerSizes[layerIdx] - 1) - 0.5 : 0.0)
      const y = -yMid - yBurst * (Math.random() - 0.5)

      const xCurvature = 0.8 * yMid * yMid
      const x = xMid + xBurst * (Math.random() - 0.5) + xCurvature

      layout.push({ x, y })
    }
  }

  return layout
}

function generateModifiedMlpLayout(layerSizes: number[]): types.Position[] {
  const layout: types.Position[] = []
  const numLayers = layerSizes.length
  const xStep = numLayers > 1 ? 1.5 / (numLayers - 1) : 0
  const side = Math.round(Math.sqrt(layerSizes[0]))

  for (let i = 0; i < side; i++) {
    for (let j = 0; j < side; j++) {
      layout.push({ x: (0.8 * j) / side, y: -0.8 * (i / side - 0.5) })
    }
  }

  for (let layerIdx = 1; layerIdx < numLayers; layerIdx++) {
    const xMid = 0.8 - 0.01 * Math.sqrt(layerSizes[0]) + layerIdx * xStep
    const xBurst = 0.01 * Math.sqrt(layerSizes[layerIdx])
    const yBurst = 0.01 / Math.sqrt(layerSizes[layerIdx])
    const yFactor = Math.sqrt(Math.log10(layerSizes[layerIdx]))

    for (let i = 0; i < layerSizes[layerIdx]; i++) {
      const yMid = yFactor * (layerSizes[layerIdx] > 1 ? i / (layerSizes[layerIdx] - 1) - 0.5 : 0.0)
      const y = -yMid - yBurst * (Math.random() - 0.5)

      const xCurvature = 0.8 * yMid * yMid
      const x = xMid + xBurst * (Math.random() - 0.5) + xCurvature

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
  const linearizedActivations = linearizeActivations(activations, structure.layerSizes.length)
  const gradients: Record<string, number[][]> = JSON.parse(gradRaw)
  const linearizedGradients = linearizeGradients(gradients, structure.layerSizes.length)

  const positions = generateMlpLayout(structure.layerSizes)
  const nodesNum = structure.layerSizes.reduce((pSum, a) => pSum + a, 0)
  const nodes: types.Node[] = []

  for (let i = 0; i < nodesNum; i++) {
    nodes.push({
      id: String(i),
      x: positions[i].x,
      y: positions[i].y
    })
  }

  return {
    nodes,
    gradients: linearizedGradients,
    activations: linearizedActivations,
    layerSizes: structure.layerSizes
  }
}

export async function getActivationsFromImageInput(
  outputDir: string
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
  const actPath = path.join(OUTPUT_DIR_BASE, outputDir, 'test_activations.json')

  let actRaw: string

  try {
    ;[actRaw] = await Promise.all([fs.readFile(actPath, 'utf-8')])
  } catch {
    throw new Error('Activation data not found')
  }

  const activations: Record<string, number[]> = JSON.parse(actRaw)
  const linearizedActivations = linearizeActivations(activations, structure.layerSizes.length)

  const positions = generateModifiedMlpLayout(structure.layerSizes)
  const nodesNum = structure.layerSizes.reduce((pSum, a) => pSum + a, 0)
  const nodes: types.Node[] = []

  for (let i = 0; i < nodesNum; i++) {
    nodes.push({
      id: String(i),
      x: positions[i].x,
      y: positions[i].y
    })
  }

  return {
    nodes,
    activations: linearizedActivations,
    layerSizes: structure.layerSizes
  }
}
