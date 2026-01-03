import * as types from './types'

export function calculateBounds(
  renderer: types.SigmaRenderer,
  container: types.Div | types.DivRef,
  posInfo: types.PosInfo[]
): { x: number; y: number; newX: number; newY: number } {
  const { x, y } = getCenterCoords(renderer, container)
  const { minY, maxY } = findYExtremes(x, posInfo)
  const newX = Math.max(Math.min(x, posInfo[posInfo.length - 1].maxX), posInfo[0].minX)
  const newY = Math.max(Math.min(y, maxY), minY)

  return { x, y, newX, newY }
}

function findYExtremes(x: number, posInfo: types.PosInfo[]): { minY: number; maxY: number } {
  // Setting values so they are in no way undefined at the end
  let minY = 0
  let maxY = 0

  if (x < posInfo[0].minX) {
    minY = posInfo[0].minY
    maxY = posInfo[0].maxY
  } else if (x > posInfo[posInfo.length - 1].maxX) {
    minY = posInfo[posInfo.length - 1].minY
    maxY = posInfo[posInfo.length - 1].maxY
  } else {
    for (let i = 0; i < posInfo.length - 1; i++) {
      if (x >= posInfo[i].minX && x <= posInfo[i + 1].maxX) {
        const w1 = (x - posInfo[i].minX) / (posInfo[i + 1].maxX - posInfo[i].minX)
        const w2 = (posInfo[i + 1].maxX - x) / (posInfo[i + 1].maxX - posInfo[i].minX)
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

  return renderer.viewportToGraph({
    x: div.offsetWidth / 2,
    y: div.offsetHeight / 2
  })
}
