import Graph from 'graphology'
import { JSX, useEffect, useRef, useState } from 'react'
import { buildGraph } from '../../../utils/graph_building'
import { getAllNodesByLayers, getNodesPosInfo } from '../../../utils/node_manipulation'
import {
  colorGraphNodes,
  createClickNodeListener,
  createClickStageListener,
  initializeRendererAndCamera,
  restrictCameraMovement
} from '../../../utils/neural_graph_utils'
import { NeuralNetworkData } from '../../../utils/types'
import NeuralAnimationControls from './NeuralAnimationControls'
import useNeuralAnimation from '@renderer/context/animation/useNeuralAnimation'
import StatsPanel from '@renderer/components/visualization/StatsPanel'

export default function NeuralAnimation({ outputDir }: { outputDir: string }): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { graphRef, layerSizesRef, rendererRef, selectedNodeRef, isAnimating, currentEpoch } =
    useNeuralAnimation()
  const [selectedNode, setSelectedNode] = useState<Record<string, unknown> | null>(null)
  const clickNodeListenerRef = useRef<({ node }) => void>((): void => {})
  const clickStageListenerRef = useRef<() => void>((): void => {})
  const visualizedEpochRef = useRef(currentEpoch)

  useEffect(() => {
    let destroyed = false

    async function init(): Promise<void> {
      if (!containerRef.current) return

      const data: NeuralNetworkData = await window.api.getNeuralNetworkVisualization(
        outputDir,
        visualizedEpochRef.current // current epoch is visualized to maintain animation continuity
      )

      const nodes = getAllNodesByLayers(data.nodes, data.layerSizes)
      const posInfo = getNodesPosInfo(nodes)
      const graph = new Graph()

      layerSizesRef.current = data.layerSizes
      graphRef.current = graph

      buildGraph(graph, nodes, data.activations)
      colorGraphNodes(graphRef.current)

      if (destroyed) return

      const { renderer, camera } = initializeRendererAndCamera(graph, containerRef.current)
      rendererRef.current = renderer

      restrictCameraMovement(camera, renderer, containerRef.current, posInfo)
      clickNodeListenerRef.current = createClickNodeListener(
        graphRef,
        selectedNodeRef,
        setSelectedNode,
        nodes,
        data
      )

      clickStageListenerRef.current = createClickStageListener(
        graphRef,
        selectedNodeRef,
        setSelectedNode,
        nodes,
        data
      )

      // Register event listeners
      renderer.on('clickNode', clickNodeListenerRef.current)
      renderer.on('clickStage', clickStageListenerRef.current)
    }

    init()

    return () => {
      destroyed = true
      rendererRef.current?.kill()
      graphRef.current?.clear()
      selectedNodeRef.current = null
      setSelectedNode(null)
    }
  }, [outputDir, graphRef, layerSizesRef, rendererRef, selectedNodeRef])

  useEffect(() => {
    if (!graphRef.current) return

    // Disable event listeners
    rendererRef.current?.off('clickNode', clickNodeListenerRef.current)
    rendererRef.current?.off('clickStage', clickStageListenerRef.current)

    if (!isAnimating) {
      // Restore event listeners
      rendererRef.current?.on('clickNode', clickNodeListenerRef.current)
      rendererRef.current?.on('clickStage', clickStageListenerRef.current)
    } else {
      const node = selectedNodeRef.current

      if (node) {
        const nodeData = graphRef.current.getNodeAttributes(node)
        setSelectedNode(nodeData)
      }
    }
  }, [isAnimating, rendererRef, graphRef, selectedNodeRef])

  return (
    <div className="flex flex-1 gap-4 overflow-hidden p-4">
      <div className="bg-primary h-full w-2/3 overflow-hidden rounded-xl shadow">
        <div className="relative h-full w-full">
          <div ref={containerRef} className="h-full w-full" />
        </div>
      </div>

      <div className="flex h-full w-1/3 flex-col gap-4 overflow-y-auto">
        <div className="rounded-xl bg-white p-4 shadow">
          <h3 className="mb-2 font-semibold text-black">Animation Controls</h3>
          <NeuralAnimationControls />
        </div>

        <div className="h-full flex-1 rounded-xl bg-white p-4 shadow">
          <h3 className="text-primary mb-2 font-semibold">Neuron Stats</h3>
          <StatsPanel
            nodeData={selectedNode}
            graphRef={graphRef}
            allowGrads={true}
            epoch={currentEpoch}
          />
        </div>
      </div>
    </div>
  )
}
