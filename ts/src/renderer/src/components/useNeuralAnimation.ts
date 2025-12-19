import { useCallback, useEffect, useRef, useState } from 'react'
import { colorGraphNodes } from '../../utils/neural_graph_utils'
import Graph from 'graphology'
import Sigma from 'sigma'

interface UseNeuralAnimationProps {
  graphRef: React.RefObject<Graph | null>
  rendererRef: React.RefObject<Sigma | null>
  outputDir: string
  epochCount: number
  initialEpoch: number
  layerSizesRef: React.RefObject<number[]>
}

export function useNeuralAnimation({
  graphRef,
  rendererRef,
  outputDir,
  epochCount,
  initialEpoch,
  layerSizesRef
}: UseNeuralAnimationProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [speed, setSpeed] = useState(500)
  const [currentEpoch, setCurrentEpoch] = useState(initialEpoch)

  const timeoutRef = useRef<number | null>(null)
  const epochRef = useRef(initialEpoch)

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
    [outputDir]
  )

  useEffect(() => {
    if (!isAnimating || epochCount === 0) return

    const loop = async () => {
      await applyEpochColors(epochRef.current)
      epochRef.current = (epochRef.current + 1) % epochCount
      setCurrentEpoch(epochRef.current)
      timeoutRef.current = window.setTimeout(loop, speed)
    }

    loop()

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [isAnimating, speed, epochCount, applyEpochColors])

  return {
    isAnimating,
    toggle: () => setIsAnimating((v) => !v),
    speed,
    setSpeed,
    currentEpoch
  }
}
