import Graph from 'graphology'
import Sigma from 'sigma'
import { JSX, useCallback, useEffect, useRef, useState } from 'react'
import { NeuralAnimationContext } from './NeuralAnimationContext'
import { getAllNodesByLayers } from '../../../utils/node_manipulation'
import {
  colorGraphNodes,
  colorGraphEdges,
  prepareNodesColorDecay
} from '../../../utils/neural_graph_utils'
import { useModel } from '../../context/model/useModel'

export const NeuralAnimationProvider = ({
  children
}: {
  children: React.ReactNode
}): JSX.Element => {
  const { outputDir, epochs } = useModel()
  const [isAnimating, setIsAnimating] = useState(false)
  const [speed, setSpeed] = useState(500)
  const [currentEpoch, setCurrentEpoch] = useState(0)

  const timeoutRef = useRef<number | null>(null)
  const epochRef = useRef(0)

  const graphRef = useRef<Graph | null>(null)
  const rendererRef = useRef<Sigma | null>(null)
  const layerSizesRef = useRef<number[]>([])
  const selectedNodeRef = useRef<string | null>(null)

  const clear = (): void => {
    setIsAnimating(false)
    setSpeed(500)
    setCurrentEpoch(0)
    timeoutRef.current = null
    epochRef.current = 0
    graphRef.current = null
    rendererRef.current = null
    layerSizesRef.current = []
  }

  const applyEpochColors = useCallback(
    async (epoch: number) => {
      if (!graphRef.current || !layerSizesRef.current.length) return

      const data = await window.api.getNeuralNetworkVisualization(outputDir, epoch)
      const activations = data.activations.linear
      const firstLayerSize = layerSizesRef.current[0]
      const selectedNode = selectedNodeRef.current

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

      if (selectedNode) {
        const nodes = getAllNodesByLayers(data.nodes, data.layerSizes)
        colorGraphEdges(graphRef.current, data.gradients!, selectedNode, data.layerSizes)
        prepareNodesColorDecay(graphRef.current, nodes, selectedNode, data.layerSizes)
      }

      rendererRef.current?.refresh()
    },
    [outputDir]
  )

  useEffect(() => {
    if (!isAnimating || epochs === 0) return

    const loop = async (): Promise<void> => {
      if (!isAnimating) return
      epochRef.current = (epochRef.current + 1) % epochs
      await applyEpochColors(epochRef.current)
      setCurrentEpoch(epochRef.current)
      if (isAnimating) timeoutRef.current = window.setTimeout(loop, speed)
    }

    loop()

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [isAnimating, speed, epochs, applyEpochColors])

  const stepEpoch = useCallback(
    async (val: number) => {
      const nextEpoch = (epochRef.current + val + epochs) % epochs
      epochRef.current = nextEpoch
      await applyEpochColors(nextEpoch)
      setCurrentEpoch(nextEpoch)
    },
    [applyEpochColors, epochs]
  )

  return (
    <NeuralAnimationContext.Provider
      value={{
        isAnimating,
        toggle: () => setIsAnimating((v) => !v),
        speed,
        setSpeed,
        currentEpoch,
        stepEpoch,
        graphRef,
        rendererRef,
        layerSizesRef,
        selectedNodeRef,
        clear
      }}
    >
      {children}
    </NeuralAnimationContext.Provider>
  )
}
