import Graph from 'graphology'
import Sigma from 'sigma'
import { JSX, useEffect, useRef, useState } from 'react'
import { buildGraph } from '../../utils/graph_building'
import { getAllNodesByLayers, getNodesPosInfo } from '../../utils/node_manipulation'
import {
  colorGraphNodes,
  highlightByActivation,
  initializeRendererAndCamera,
  registerClickNodeListener,
  restrictCameraMovement
} from '../../utils/neural_graph_utils'
import { NeuralGraphProps, NeuralNetworkData, Node } from '../../utils/types'
import { useModel } from '@renderer/context/useModel'
import { useNeuralAnimation } from './useNeuralAnimation'
import { NeuralAnimation } from './NeuralAnimation'

interface ExtendedNeuralGraphProps extends NeuralGraphProps {
  showAnimation?: boolean
}

export function NeuralGraph({
  epoch,
  onNodeSelect,
  outputDir,
  highlightTop,
  highlightBottom,
  highlightPercent,
  showAnimation = false
}: ExtendedNeuralGraphProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rendererRef = useRef<Sigma | null>(null)
  const graphRef = useRef<Graph | null>(null)
  const selectedNodeRef = useRef<string | null>(null)

  const nodeLayersRef = useRef<Node[][]>(null)
  const layerSizesRef = useRef<number[]>([])

  const { epochs } = useModel()
  const [epochCount, setEpochCount] = useState(0)

  useEffect(() => {
    let destroyed = false

    async function init(): Promise<void> {
      if (!containerRef.current) return

      const data: NeuralNetworkData =
        epoch >= 0
          ? await window.api.getNeuralNetworkVisualization(outputDir, epoch)
          : await window.api.getActivationsFromImageInput(outputDir)

      layerSizesRef.current = data.layerSizes
      setEpochCount(epochs)

      const nodes = getAllNodesByLayers(data.nodes, data.layerSizes)
      nodeLayersRef.current = nodes

      const posInfo = getNodesPosInfo(nodes)

      const graph = new Graph()
      graphRef.current = graph

      buildGraph(graph, nodes, data.activations)
      colorGraphNodes(graph)

      if (destroyed) return

      const { renderer, camera } = initializeRendererAndCamera(graph, containerRef.current, rendererRef)
      restrictCameraMovement(camera, renderer, containerRef.current, posInfo)

      registerClickNodeListener(renderer, graphRef, selectedNodeRef, onNodeSelect, nodes, data)
    }

    init()

    return () => {
      destroyed = true
      rendererRef.current?.kill()
      graphRef.current?.clear()
    }
  }, [epoch, outputDir, onNodeSelect, epochs])

  useEffect(() => {
    if (!graphRef.current) return
    highlightByActivation(graphRef.current, highlightTop, highlightBottom, highlightPercent)
    rendererRef.current?.refresh()
  }, [highlightTop, highlightBottom, highlightPercent])

  const animation = useNeuralAnimation({
    graphRef,
    rendererRef,
    outputDir,
    epochCount,
    initialEpoch: epoch,
    layerSizesRef
  })

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />

      {showAnimation && (
        <div className="absolute bottom-4 left-4">
          <NeuralAnimation animation={animation} epochCount={epochCount} />
        </div>
      )}
    </div>
  )
}
