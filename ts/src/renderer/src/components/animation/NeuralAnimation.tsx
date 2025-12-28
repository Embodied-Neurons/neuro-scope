import Graph from 'graphology'
import Sigma from 'sigma'
import { JSX, useEffect, useRef } from 'react'
import { buildGraph } from '../../../utils/graph_building'
import { getAllNodesByLayers, getNodesPosInfo } from '../../../utils/node_manipulation'
import {
  colorGraphNodes,
  initializeRendererAndCamera,
  restrictCameraMovement
} from '../../../utils/neural_graph_utils'
import { NeuralNetworkData, Node } from '../../../utils/types'
import { useModel } from '../../context/model/useModel'
import NeuralAnimationControls from './NeuralAnimationControls'
import { NeuralAnimationProvider } from '@renderer/context/animation/NeuralAnimationProvider'

export default function NeuralAnimation({ outputDir }: { outputDir: string }): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rendererRef = useRef<Sigma | null>(null)
  const graphRef = useRef<Graph | null>(null)
  const nodeLayersRef = useRef<Node[][]>(null)
  const layerSizesRef = useRef<number[]>([])

  const { epochs } = useModel()

  useEffect(() => {
    let destroyed = false

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

      const graph = new Graph()
      graphRef.current = graph

      buildGraph(graph, nodes, data.activations)
      colorGraphNodes(graph)

      if (destroyed) return

      const { renderer, camera } = initializeRendererAndCamera(graph, containerRef.current)
      rendererRef.current = renderer

      restrictCameraMovement(camera, renderer, containerRef.current, posInfo)
    }

    init()

    return () => {
      destroyed = true
      rendererRef.current?.kill()
      graphRef.current?.clear()
    }
  }, [outputDir, epochs])

  // Returned element is more complex because of easier access to animation variables
  return (
    <NeuralAnimationProvider
      graphRef={graphRef}
      rendererRef={rendererRef}
      outputDir={outputDir}
      epochCount={epochs}
      layerSizesRef={layerSizesRef}
    >
      <div className="flex flex-1 overflow-hidden p-4 gap-4">
        <div className="w-2/3 h-full bg-blue-950 rounded-xl shadow overflow-hidden">
          <div className="w-full h-full relative">
            <div ref={containerRef} className="w-full h-full" />
          </div>
        </div>

        <div className="w-1/3 flex flex-col gap-4 h-full overflow-y-auto">
          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="font-semibold mb-2 text-black">Animation Controls</h3>
            <NeuralAnimationControls epochCount={epochs} />
          </div>
        </div>
      </div>
    </NeuralAnimationProvider>
  )
}
