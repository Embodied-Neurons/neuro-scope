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

    if (showMin) highlightEdge(graph, minEdge, '#fa4141')
    if (showMax) highlightEdge(graph, maxEdge, '#fae641')
  }, [showMin, showMax, nodeData, graphRef, allowGrads])

  const formatValue = (value: number | null): string => {
    if (value === null) return ''
    return Math.abs(value) < 1e-5 ? value.toFixed(10) : value.toFixed(5)
  }

  if (!nodeData) {
    return (
      <div className="flex items-center justify-center p-2 text-gray-500">
        Click a node to inspect its behavior
      </div>
    )
  }

  const { idx, layer, activation, color, layerMin, layerMax } = nodeData

  return (
    <div className="animate-fade-in space-y-4 p-2">
      <div>
        <h2 className="text-lg font-semibold text-primary">Neuron</h2>
        <p className="text-sm text-gray-500">
          Layer {String(layer)} · ID {String(idx)}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div
          className="h-14 w-14 rounded-full border shadow-inner"
          style={{ backgroundColor: String(color) }}
        />
        <p className="text-sm font-medium text-primary">Activation Color</p>
      </div>

      <StatsBar
        fixed={formatValue(Number(activation))}
        value={Number(activation)}
        min={Number(layerMin)}
        max={Number(layerMax)}
        gradient="red-green"
      />
      {allowGrads && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-primary">
              <input
                type="checkbox"
                checked={showMin}
                onChange={(e) => setShowMin(e.target.checked)}
                className="accent-primary"
              />
              Highlight min gradient
            </label>
            {showMin && extremes.min !== null && (
              <span className="flex items-center gap-2 font-mono text-[#fa4141]">
                <span className="h-2 w-2 rounded-full bg-[#fa4141]" />
                {formatValue(extremes.min)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-primary">
              <input
                type="checkbox"
                checked={showMax}
                onChange={(e) => setShowMax(e.target.checked)}
                className="accent-primary"
              />
              Highlight max gradient
            </label>

            {showMax && extremes.max !== null && (
              <span className="flex items-center gap-2 font-mono text-[#fae641]">
                <span className="h-2 w-2 rounded-full bg-[#fae641]" />
                {formatValue(extremes.max)}
              </span>
            )}
          </div>

          {showMin && showMax && extremes.min === extremes.max && extremes.min !== null && (
            <div className="flex items-center justify-end text-sm">
              <span className="flex items-center gap-2 font-mono text-purple-600">
                <span className="h-2 w-2 rounded-full bg-purple-500" />
                {extremes.min}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
