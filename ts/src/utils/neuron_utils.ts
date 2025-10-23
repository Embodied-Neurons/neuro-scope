export type ChunkStats = {
  value: number
  min: number
  max: number
  mean: number
  normalized: number
}

export type ChunkGroup = ChunkStats[][]

type LayerSize = [number, number, number]

function min(arr: number[]): number {
  return Math.min(...arr)
}

function max(arr: number[]): number {
  return Math.max(...arr)
}

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0)
}

export function normalizeGroupsGrad(
  neurocons: number[][],
  startSize: LayerSize,
  endSize: LayerSize
): ChunkGroup {
  const rowChunks = getChunks(endSize)
  const colChunks = getChunks(startSize)

  return sumChunksStats(neurocons, rowChunks, colChunks)
}

export function sumChunksStats(
  matrix: number[][],
  rowChunks: number[],
  colChunks: number[]
): ChunkGroup {
  const result: ChunkGroup = []
  let rowStart = 0

  for (const rowCount of rowChunks) {
    const rowEnd = rowStart + rowCount
    let colStart = 0
    const rowData: ChunkStats[] = []

    for (const colCount of colChunks) {
      const colEnd = colStart + colCount

      const chunk: number[] = []
      for (let i = rowStart; i < rowEnd; i++) {
        chunk.push(...matrix[i].slice(colStart, colEnd))
      }

      const minVal = min(chunk)
      const maxVal = max(chunk)
      const meanVal = mean(chunk)

      rowData.push({
        value: sum(chunk),
        min: minVal,
        max: maxVal,
        mean: meanVal,
        normalized: 0
      })

      colStart = colEnd
    }

    result.push(rowData)
    rowStart = rowEnd
  }

  const allValues = result.flat().map((cell) => cell.value)
  const globalMin = min(allValues)
  const globalMax = max(allValues)

  for (const row of result) {
    for (const cell of row) {
      cell.normalized = (cell.value - globalMin) / (globalMax - globalMin + 1e-8)
    }
  }

  return result
}

export function normalizeGroupsAct(matrix: number[][], startSize: LayerSize) {
  const chunks = getChunks(startSize)

  const cols = matrix[0].length
  const rows = matrix.length
  const colMeans = Array(cols)
    .fill(0)
    .map((_, j) => mean(matrix.map((row) => row[j])))

  const grouped: ChunkStats[] = []
  let index = 0

  for (const size of chunks) {
    const group = colMeans.slice(index, index + size)
    grouped.push({
      value: sum(group),
      min: min(group),
      max: max(group),
      mean: mean(group),
      normalized: 0
    })
    index += size
  }

  const values = grouped.map((g) => g.value)
  const minVal = min(values)
  const maxVal = max(values)

  grouped.forEach((g) => {
    g.normalized = (g.value - minVal) / (maxVal - minVal + 1e-8)
  })

  return grouped
}

export function compressNeuronLayers(noNeuronLayers: number[], groupSize: number): LayerSize[] {
  return noNeuronLayers.map((layerSize) => compressNeurons(layerSize, groupSize))
}

export function compressNeurons(layerSize: number, groupSize: number): LayerSize {
  if (layerSize % groupSize === 0) {
    return [layerSize / groupSize, groupSize, 0]
  }
  if (layerSize < groupSize) {
    return [1, layerSize, 0]
  }
  return [Math.floor(layerSize / groupSize) + 1, groupSize, layerSize % groupSize]
}

export function getChunks(size: LayerSize): number[] {
  const [a, b, c] = size
  if (a === 1) return [b]
  if (c === 0) return Array(a).fill(b)
  return Array(a - 1)
    .fill(b)
    .concat([c])
}
