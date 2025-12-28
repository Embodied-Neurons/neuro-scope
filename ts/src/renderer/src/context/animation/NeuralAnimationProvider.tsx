import Graph from 'graphology'
import Sigma from 'sigma'
import { JSX, useCallback, useEffect, useRef, useState } from 'react'
import { NeuralAnimationContext } from './NeuralAnimationContext'
import { colorGraphNodes } from '../../../utils/neural_graph_utils'

interface Props {
  children: React.ReactNode
  graphRef: React.RefObject<Graph | null>
  rendererRef: React.RefObject<Sigma | null>
  outputDir: string
  epochCount: number
  layerSizesRef: React.RefObject<number[]>
}

export const NeuralAnimationProvider = ({
  children,
  graphRef,
  rendererRef,
  outputDir,
  epochCount,
  layerSizesRef
}: Props): JSX.Element => {
  const [isAnimating, setIsAnimating] = useState(false)
  const [speed, setSpeed] = useState(500)
  const [currentEpoch, setCurrentEpoch] = useState(0)

  const timeoutRef = useRef<number | null>(null)
  const epochRef = useRef(0)

  const applyEpochColors = useCallback(
    async (epoch: number) => {
      if (!graphRef.current) return

      const data = await window.api.getNeuralNetworkVisualization(outputDir, epoch)
      const activations = data.activations.linear
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

  useEffect(() => {
    if (!isAnimating || epochCount === 0) return

    const loop = async (): Promise<void> => {
      if (!isAnimating) return

      epochRef.current = (epochRef.current + 1) % epochCount
      await applyEpochColors(epochRef.current)
      setCurrentEpoch(epochRef.current)

      if (isAnimating) {
        timeoutRef.current = window.setTimeout(loop, speed)
      }
    }

    loop()

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [isAnimating, speed, epochCount, applyEpochColors])

  return (
    <NeuralAnimationContext.Provider
      value={{
        isAnimating,
        toggle: () => setIsAnimating((v) => !v),
        speed,
        setSpeed,
        currentEpoch
      }}
    >
      {children}
    </NeuralAnimationContext.Provider>
  )
}
