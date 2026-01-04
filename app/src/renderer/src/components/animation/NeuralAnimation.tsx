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
import { NeuralNetworkData, Node } from '../../../utils/types'
import NeuralAnimationControls from './NeuralAnimationControls'
import useNeuralAnimation from '@renderer/context/animation/useNeuralAnimation'
import StatsPanel from '@renderer/components/visualization/StatsPanel'

export default function NeuralAnimation({ outputDir }: { outputDir: string }): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const nodeLayersRef = useRef<Node[][]>(null)
  const { graphRef, layerSizesRef, rendererRef, isAnimating } = useNeuralAnimation()
  const [selectedNodeVis, setSelectedNodeVis] = useState<Record<string, unknown> | null>(null)
  const selectedNodeRef = useRef<string | null>(null)
  const clickNodeListenerRef = useRef<({ node }) => void>((): void => {})
  const clickStageListenerRef = useRef<() => void>((): void => {})
  useEffect(() => {
    if (!isAnimating) {
      selectedNodeRef.current = null
      setSelectedNodeVis(null)
    }
  }, [isAnimating])

  useEffect(() => {
    async function init(): Promise<void> {
      if (!containerRef.current) return

      const data: NeuralNetworkData = await window.api.getNeuralNetworkVisualization(
        outputDir,
        0 // initial epoch is always 0
      )

      const nodes = getAllNodesByLayers(data.nodes, data.layerSizes)
      nodeLayersRef.current = nodes
      layerSizesRef.current = data.layerSizes

      const posInfo = getNodesPosInfo(nodes)

      if (!graphRef.current) {
        const graph = new Graph()
        graphRef.current = graph

        buildGraph(graph, nodes, data.activations)
      }
      colorGraphNodes(graphRef.current)

      const { renderer, camera } = initializeRendererAndCamera(
        graphRef.current,
        containerRef.current
      )
      rendererRef.current = renderer

      restrictCameraMovement(camera, renderer, containerRef.current, posInfo)
      clickNodeListenerRef.current = createClickNodeListener(
        graphRef,
        selectedNodeRef,
        setSelectedNodeVis,
        nodes,
        data
      )

      clickStageListenerRef.current = createClickStageListener(
        graphRef,
        selectedNodeRef,
        setSelectedNodeVis,
        nodes,
        data
      )

      // Register event listeners
      renderer.on('clickNode', clickNodeListenerRef.current)
    }

    init()
  }, [outputDir, graphRef, layerSizesRef, rendererRef])

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
          {isAnimating ? null : (
            <StatsPanel nodeData={selectedNodeVis} graphRef={graphRef} allowGrads={true} />
          )}
        </div>
      </div>
    </div>
  )
}
