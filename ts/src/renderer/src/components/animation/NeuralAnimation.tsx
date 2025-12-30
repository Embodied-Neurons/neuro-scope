import Graph from 'graphology'
import { JSX, useEffect, useRef } from 'react'
import { buildGraph } from '../../../utils/graph_building'
import { getAllNodesByLayers, getNodesPosInfo } from '../../../utils/node_manipulation'
import {
  colorGraphNodes,
  initializeRendererAndCamera,
  restrictCameraMovement
} from '../../../utils/neural_graph_utils'
import { NeuralNetworkData, Node } from '../../../utils/types'
import NeuralAnimationControls from './NeuralAnimationControls'
import useNeuralAnimation from '@renderer/context/animation/useNeuralAnimation'

export default function NeuralAnimation({ outputDir }: { outputDir: string }): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const nodeLayersRef = useRef<Node[][]>(null)
  const { graphRef, layerSizesRef, rendererRef } = useNeuralAnimation()

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
    }

    init()
  }, [outputDir, graphRef, layerSizesRef, rendererRef])

  return (
    <div className="flex flex-1 overflow-hidden p-4 gap-4">
      <div className="w-2/3 h-full bg-primary rounded-xl shadow overflow-hidden">
        <div className="w-full h-full relative">
          <div ref={containerRef} className="w-full h-full" />
        </div>
      </div>

      <div className="w-1/3 flex flex-col gap-4 h-full overflow-y-auto">
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-semibold mb-2 text-black">Animation Controls</h3>
          <NeuralAnimationControls />
        </div>
      </div>
    </div>
  )
}
