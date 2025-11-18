import * as types from './types'

export function calculateDynamicBounds(
  renderer: types.SigmaRenderer,
  container: types.Div | types.DivRef,
  posInfo: types.PosInfo[]
): { x: number; y: number; newX: number; newY: number } {
  const { x, y } = getCenterCoords(renderer, container)
  const { minY, maxY } = findYExtremes(x, posInfo)
  const newX = Math.max(Math.min(x, posInfo[posInfo.length - 1].x), posInfo[0].x)
  const newY = Math.max(Math.min(y, maxY), minY)

  return { x, y, newX, newY }
}

function findYExtremes(x: number, posInfo: types.PosInfo[]): { minY: number; maxY: number } {
  // Setting values so they are in no way undefined at the end
  let minY = 0
  let maxY = 0

  if (x < posInfo[0].x) {
    minY = posInfo[0].minY
    maxY = posInfo[0].maxY
  } else if (x > posInfo[posInfo.length - 1].x) {
    minY = posInfo[posInfo.length - 1].minY
    maxY = posInfo[posInfo.length - 1].maxY
  } else {
    for (let i = 0; i < posInfo.length - 1; i++) {
      if (x >= posInfo[i].x && x <= posInfo[i + 1].x) {
        const w1 = (x - posInfo[i].x) / (posInfo[i + 1].x - posInfo[i].x)
        const w2 = (posInfo[i + 1].x - x) / (posInfo[i + 1].x - posInfo[i].x)
        minY = w2 * posInfo[i].minY + w1 * posInfo[i + 1].minY
        maxY = w2 * posInfo[i].maxY + w1 * posInfo[i + 1].maxY
        break
      }
    }
  }

  return { minY, maxY }
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
  container: types.Div | types.DivRef,
  deltaY: number
): { leftX: number; rightX: number; downY: number; upY: number } {
  const { ratio } = camera.getState()
  const { x, y } = getCenterCoords(renderer, container)

  // Checking if ref type
  const div = 'current' in container ? container.current : container

  const mul = Math.abs(y - 0.5) > 0.1 ? (Math.abs(y - 0.5) < 0.45 ? 0.9 : 0.6) : 0.1
  const yMove = (mul * ratio * deltaY) / div.offsetHeight

  return {
    leftX: x - 0.6 * ratio,
    rightX: x + 0.6 * ratio,
    downY: y + yMove - 0.6 * ratio,
    upY: y + yMove + 0.6 * ratio
  }
}
