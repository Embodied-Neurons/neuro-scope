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
  const extremes: number[][] = []

  for (const [key, matrix] of Object.entries(gradients)) {
    if (!key.endsWith('.grad')) continue

    let layerMin = Infinity
    let layerMax = -Infinity

    for (const row of matrix) {
      for (const v of row) {
        if (v < layerMin) layerMin = v
        if (v > layerMax) layerMax = v
      }
    }

    extremes.push([layerMin, layerMax])
  }

  const out: Record<string, GradStats> = {}
  let idx = 0

  for (const [key, matrix] of Object.entries(gradients)) {
    if (!key.endsWith('.grad')) continue

    const layerMin = extremes[idx][0]
    const layerMax = extremes[idx][1]
    idx++

    out[key] = {
      raw: matrix,
      norm: normalizeMatrix(matrix, layerMin, layerMax)
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
  const extremes: number[][] = []

  for (const [key, list] of Object.entries(activations)) {
    console.log(key)
    if (!key.endsWith('.activ')) continue

    let layerMin = Infinity
    let layerMax = -Infinity

    for (const v of list) {
      if (v < layerMin) layerMin = v
      if (v > layerMax) layerMax = v
    }

    extremes.push([layerMin, layerMax])
  }

  const out: Record<string, ActivStats> = {}
  let idx = 0

  for (const [key, list] of Object.entries(activations)) {
    if (!key.endsWith('.activ')) continue

    const layerMin = extremes[idx][0]
    const layerMax = extremes[idx][1]

    out[key] = {
      raw: list,
      norm: normalizeList(list, layerMin, layerMax),
      extremes: extremes[idx]
    }
    idx++
  }

  return out
}

export function linearizeActivations(
  activations: Record<string, number[]>,
  numLayers: number
): linearActivStats {
  const processedActivations = processActivations(activations)
  const linearizedActivations: Array<{ raw: number; norm: number }> = []
  const extremes: number[][] = []

  for (let i = 0; i < numLayers; i++) {
    const entry = processedActivations[`fc${i}.activ`]

    for (let j = 0; j < entry.raw.length; j++) {
      linearizedActivations.push({ raw: entry.raw[j], norm: entry.norm[j] })
    }
    extremes.push(entry.extremes)
  }

  return { linear: linearizedActivations, extremes: extremes }
}
