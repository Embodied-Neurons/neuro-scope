import { ActivStats, GradStats } from './types'

function normalizeList(list: number[], min: number, max: number): number[] {
  const range = max - min || 1
  return list.map((v) => (v - min) / range)
}

function normalizeMatrix(matrix: number[][], min: number, max: number): number[][] {
  const range = max - min || 1
  return matrix.map((row) => row.map((v) => (v - min) / range))
}

export function processGradients(gradients: Record<string, number[][]>): Record<string, GradStats> {
  let globalMin = Infinity
  let globalMax = -Infinity

  for (const [key, matrix] of Object.entries(gradients)) {
    if (!key.endsWith('.weight')) continue

    for (const row of matrix) {
      for (const v of row) {
        if (v < globalMin) globalMin = v
        if (v > globalMax) globalMax = v
      }
    }
  }

  const out: Record<string, { raw: number[][]; norm: number[][] }> = {}

  for (const [key, matrix] of Object.entries(gradients)) {
    if (!key.endsWith('.weight')) continue

    const layer = key.replace('.weight', '')
    const gradKey = `${layer}.grad`

    out[gradKey] = {
      raw: matrix,
      norm: normalizeMatrix(matrix, globalMin, globalMax)
    }
  }

  return out
}

export function processActivations(
  activations: Record<string, number[]>
): Record<string, ActivStats> {
  let globalMin = Infinity
  let globalMax = -Infinity

  for (const [, list] of Object.entries(activations)) {
    for (const v of list) {
      if (v < globalMin) globalMin = v
      if (v > globalMax) globalMax = v
    }
  }

  const out: Record<string, { raw: number[]; norm: number[] }> = {}

  for (const [key, list] of Object.entries(activations)) {
    const actKey = `${key}.activ`
    out[actKey] = {
      raw: list,
      norm: normalizeList(list, globalMin, globalMax)
    }
  }

  return out
}
