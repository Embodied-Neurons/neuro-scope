import Graph from 'graphology'
import Sigma from 'sigma'
import { useCallback, useEffect, useRef, useState } from 'react'
import { colorGraphNodes } from '../../utils/neural_graph_utils'
import { NeuralAnimationState } from '../../utils/types'

export default function useNeuralAnimation(
  graphRef: React.RefObject<Graph | null>,
  rendererRef: React.RefObject<Sigma | null>,
  outputDir: string,
  epochCount: number,
  layerSizesRef: React.RefObject<number[]>
): NeuralAnimationState {
  const [isAnimating, setIsAnimating] = useState(false)
  const [speed, setSpeed] = useState(500)

  const initialEpoch = 0
  const [currentEpoch, setCurrentEpoch] = useState(initialEpoch)

  const epochRef = useRef(initialEpoch)
  const timeoutRef = useRef<number | null>(null)
  const isAnimatingRef = useRef(isAnimating)

  useEffect(() => {
    isAnimatingRef.current = isAnimating
  }, [isAnimating])

  const applyEpochColors = useCallback(
    async (epoch: number) => {
      if (!graphRef.current) return

      const data = await window.api.getNeuralNetworkVisualization(outputDir, epoch)
      const activations = data.activations
      const firstLayerSize = layerSizesRef.current[0]

      let counter = 0
      graphRef.current.forEachNode((nodeId) => {
        if (counter < firstLayerSize) {
          counter++
          return
        }

        const act = activations[counter]
        graphRef.current!.setNodeAttribute(nodeId, 'weight', act?.norm ?? 0)
        graphRef.current!.setNodeAttribute(nodeId, 'activation', act?.raw ?? 0)
        counter++
      })

      colorGraphNodes(graphRef.current)
      rendererRef.current?.refresh()
    },
    [graphRef, layerSizesRef, outputDir, rendererRef]
  )

  const goToEpoch = useCallback(
    async (epoch: number) => {
      if (epochCount === 0) return

      const safeEpoch = ((epoch % epochCount) + epochCount) % epochCount
      epochRef.current = safeEpoch
      setCurrentEpoch(safeEpoch)

      await applyEpochColors(safeEpoch)

      if (isAnimatingRef.current) {
        timeoutRef.current = window.setTimeout(() => {
          goToEpoch(epochRef.current + 1)
        }, speed)
      }
    },
    [applyEpochColors, epochCount, speed]
  )

  useEffect(() => {
    if (!isAnimating) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    goToEpoch(epochRef.current)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [isAnimating, goToEpoch])

  return {
    isAnimating,
    toggle: () => setIsAnimating((v) => !v),
    speed,
    setSpeed,
    currentEpoch,

    stepForward: () => {
      setIsAnimating(false)
      goToEpoch(epochRef.current + 1)
    },

    stepBackward: () => {
      setIsAnimating(false)
      goToEpoch(epochRef.current - 1)
    }
  }
}
