import { ActivStats, GradStats } from './types'

function normalizeList(list: number[], min: number, max: number): number[] {
  const range = max - min || 1
  return list.map((v) => (v - min) / range)
}

function normalizeMatrix(matrix: number[][], min: number, max: number): number[][] {
  const range = max - min || 1
  return matrix.map((row) => row.map((v) => (v - min) / range))
}

export function processGradients(
  parsedGradients: Record<string, number[][]>
): Record<string, GradStats> {
  let globalMin = Infinity
  let globalMax = -Infinity

  for (const [key, matrix] of Object.entries(parsedGradients)) {
    if (!key.endsWith('.grad')) continue
    for (const row of matrix) {
      for (const v of row) {
        if (v < globalMin) globalMin = v
        if (v > globalMax) globalMax = v
      }
    }
  }

  const out: Record<string, { raw: number[][]; norm: number[][] }> = {}

  for (const [key, matrix] of Object.entries(parsedGradients)) {
    if (!key.endsWith('.grad')) continue

    out[key] = {
      raw: matrix,
      norm: normalizeMatrix(matrix, globalMin, globalMax)
    }
  }

  return out
}

export function processActivations(
  parsedActivations: Record<string, number[]>
): Record<string, ActivStats> {
  let globalMin = Infinity
  let globalMax = -Infinity

  for (const [, list] of Object.entries(parsedActivations)) {
    for (const v of list) {
      if (v < globalMin) globalMin = v
      if (v > globalMax) globalMax = v
    }
  }

  const out: Record<string, { raw: number[]; norm: number[] }> = {}

  for (const [key, list] of Object.entries(parsedActivations)) {
    if (!key.endsWith('.activ')) continue
    out[key] = {
      raw: list,
      norm: normalizeList(list, globalMin, globalMax)
    }
  }

  return out
}
