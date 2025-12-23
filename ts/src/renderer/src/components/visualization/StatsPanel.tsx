import { JSX, useEffect, useState } from 'react'
import { StatsPanelProps } from '../../../utils/types'
import StatsBar from '@renderer/components/visualization/StatsBar'
import {
  clearEdgeHighlight,
  findExtremeGradients,
  highlightEdge
} from '../../../utils/neural_graph_utils'

export default function StatsPanel({
  nodeData,
  graphRef,
  allowGrads
}: StatsPanelProps): JSX.Element {
  const [showMin, setShowMin] = useState(false)
  const [showMax, setShowMax] = useState(false)
  const [extremes, setExtremes] = useState<{
    min: number | null
    max: number | null
  }>({ min: null, max: null })

  useEffect(() => {
    if (!nodeData || !graphRef.current || !allowGrads) return

    const graph = graphRef.current
    const { idx } = nodeData

    const { min, max, minEdge, maxEdge } = findExtremeGradients(String(idx), graph)

    setExtremes({ min, max })

    clearEdgeHighlight(graph, minEdge)
    clearEdgeHighlight(graph, maxEdge)

    if (minEdge && minEdge === maxEdge) {
      if (showMin || showMax) {
        highlightEdge(graph, minEdge, '#a855f7')
      }
      return
    }

    if (showMin) highlightEdge(graph, minEdge, '#ff0000')
    if (showMax) highlightEdge(graph, maxEdge, '#00ff00')
  }, [showMin, showMax, nodeData, graphRef, allowGrads])

  if (!nodeData) {
    return (
      <div className="p-3 text-gray-500 flex items-center justify-center">
        Click a node to inspect its behavior
      </div>
    )
  }

  const { idx, layer, activation, color, layerMin, layerMax } = nodeData

  return (
    <div className="p-3 space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold">Neuron</h2>
        <p className="text-sm text-gray-500">
          Layer {String(layer)} · ID {String(idx)}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-full border shadow-inner"
          style={{ backgroundColor: String(color) }}
        />
        <p className="text-sm font-medium">Activation Color</p>
      </div>

      <StatsBar
        label="Activation"
        value={Number(activation)}
        min={Number(layerMin)}
        max={Number(layerMax)}
        gradient="red-green"
      />
      {allowGrads && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showMin}
                onChange={(e) => setShowMin(e.target.checked)}
                className="accent-black"
              />
              Highlight min gradient
            </label>
            {showMin && extremes.min !== null && (
              <span className="flex items-center gap-2 font-mono text-red-600">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                {extremes.min}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showMax}
                onChange={(e) => setShowMax(e.target.checked)}
                className="accent-black"
              />
              Highlight max gradient
            </label>

            {showMax && extremes.max !== null && (
              <span className="flex items-center gap-2 font-mono text-green-600">
                <span className="w-2 h-2 rounded-full bg-green-600" />
                {extremes.max}
              </span>
            )}
          </div>

          {showMin && showMax && extremes.min === extremes.max && extremes.min !== null && (
            <div className="flex items-center justify-end text-sm">
              <span className="flex items-center gap-2 font-mono text-purple-600">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                {extremes.min}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
