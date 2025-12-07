import { ActivStats, GradStats, linearGradStats, linearActivStats } from './types'

function normalizeList(list: number[], min: number, max: number): number[] {
  const range = max - min || 1
  return list.map((v) => (v - min) / range)
}

function normalizeMatrix(matrix: number[][], min: number, max: number): number[][] {
  const range = max - min || 1
  return matrix.map((row) => row.map((v) => (v - min) / range))
}

function processGradients(gradients: Record<string, number[][]>): Record<string, GradStats> {
  let globalMin = Infinity
  let globalMax = -Infinity

  for (const [key, matrix] of Object.entries(gradients)) {
    if (!key.endsWith('.grad')) continue

    for (const row of matrix) {
      for (const v of row) {
        if (v < globalMin) globalMin = v
        if (v > globalMax) globalMax = v
      }
    }
  }

  const out: Record<string, GradStats> = {}

  for (const [key, matrix] of Object.entries(gradients)) {
    if (!key.endsWith('.grad')) continue

    out[key] = {
      raw: matrix,
      norm: normalizeMatrix(matrix, globalMin, globalMax)
    }
  }

  return out
}

export function linearizeGradients(
  gradients: Record<string, number[][]>,
  numLayers: number
): linearGradStats {
  const processedGradients = processGradients(gradients)
  const linearizedGradients: linearGradStats = []

  for (let i = numLayers - 1; i > 0; i--) {
    const entry = processedGradients[`fc${i}.grad`]

    for (let j = 0; j < entry.raw.length; j++) {
      linearizedGradients.push({ raw: entry.raw[j], norm: entry.norm[j] })
    }
  }

  return linearizedGradients
}

function processActivations(activations: Record<string, number[]>): Record<string, ActivStats> {
  let globalMin = Infinity
  let globalMax = -Infinity

  for (const [, list] of Object.entries(activations)) {
    for (const v of list) {
      if (v < globalMin) globalMin = v
      if (v > globalMax) globalMax = v
    }
  }

  const out: Record<string, ActivStats> = {}

  for (const [key, list] of Object.entries(activations)) {
    if (!key.endsWith('.activ')) continue

    out[key] = {
      raw: list,
      norm: normalizeList(list, globalMin, globalMax)
    }
  }

  return out
}

export function linearizeActivations(
  activations: Record<string, number[]>,
  numLayers: number
): linearActivStats {
  const processedActivations = processActivations(activations)
  const linearizedActivations: linearActivStats = []

  for (let i = 1; i < numLayers; i++) {
    const entry = processedActivations[`fc${i}.activ`]

    for (let j = 0; j < entry.raw.length; j++) {
      linearizedActivations.push({ raw: entry.raw[j], norm: entry.norm[j] })
    }
  }

  return linearizedActivations
}
