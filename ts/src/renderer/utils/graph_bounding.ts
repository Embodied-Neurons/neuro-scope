import * as types from './types'

export function calculateDynamicBounds(
  x: number,
  y: number,
  ratio: number,
  posInfo: types.PosInfo[]
): { newX: number; newY: number } {
  const { minY, maxY } = findYExtremes(x, posInfo)
  let newX: number
  const newY = Math.max(Math.min(y, maxY), minY)

  if (ratio >= 0.6) {
    if (x - 0.4 * ratio > posInfo[posInfo.length - 2].x) {
      newX = posInfo[posInfo.length - 2].x + 0.4 * ratio
    } else if (x + 0.4 * ratio < posInfo[1].x) {
      newX = posInfo[1].x - 0.4 * ratio
    } else {
      newX = x
    }
  } else {
    newX = Math.max(Math.min(x, posInfo[posInfo.length - 1].x), posInfo[0].x)
  }

  return { newX, newY }
}

function findYExtremes(x: number, posInfo: types.PosInfo[]): { minY: number; maxY: number } {
  // Setting values so they are in no way undefined at the end
  let minY = 0
  let maxY = 0
  let buff = 0

  if (x < posInfo[0].x) {
    minY = posInfo[0].minY
    maxY = posInfo[0].maxY
    buff = 0.125 * (maxY - minY)
  } else if (x > posInfo[posInfo.length - 1].x) {
    minY = posInfo[posInfo.length - 1].minY
    maxY = posInfo[posInfo.length - 1].maxY
    buff = 0.125 * (maxY - minY)
  } else {
    for (let i = 0; i < posInfo.length - 1; i++) {
      if (x >= posInfo[i].x && x <= posInfo[i + 1].x) {
        const w1 = (x - posInfo[i].x) / (posInfo[i + 1].x - posInfo[i].x)
        const w2 = (posInfo[i + 1].x - x) / (posInfo[i + 1].x - posInfo[i].x)
        minY = w2 * posInfo[i].minY + w1 * posInfo[i + 1].minY
        maxY = w2 * posInfo[i].maxY + w1 * posInfo[i + 1].maxY
        buff = 0.125 * (maxY - minY)
        break
      }
    }
  }

  return { minY: minY + buff, maxY: maxY - buff }
}

function getCenterCoords(
  renderer: types.SigmaRenderer,
  container: types.Div | types.DivRef
): { x: number; y: number } {
  // Checking if ref type
  const div = 'current' in container ? container.current : container

  return renderer.viewportToGraph({ x: div.offsetWidth / 2, y: div.offsetHeight / 2 })
}

export function getVisibilityRanges(
  camera: types.Camera,
  renderer: types.SigmaRenderer,
  container: types.Div | types.DivRef
): { minX: number; maxX: number; minY: number; maxY: number } {
  const { ratio } = camera.getState()
  const { x, y } = getCenterCoords(renderer, container)
  console.log(x, y)

  return {
    minX: x - 0.56 * ratio,
    maxX: x + 0.56 * ratio,
    minY: y - 0.6 * ratio,
    maxY: y + 0.6 * ratio
  }
}
