import { JSX } from 'react'
import { StatsPanelProps } from '../../utils/types'

export function StatsPanel({ nodeData }: StatsPanelProps): JSX.Element {
  if (!nodeData) {
    return <div className="p-4 text-gray-500">Click on a node to see its details.</div>
  }

  return (
    <div className="p-4 overflow-auto">
      <h2 className="text-lg font-semibold mb-2">Node Details</h2>
      <ul className="text-sm space-y-1">
        {Object.entries(nodeData).map(([key, value]) => (
          <li key={key}>
            <strong>{key}:</strong> {String(value)}
          </li>
        ))}
      </ul>
    </div>
  )
}
