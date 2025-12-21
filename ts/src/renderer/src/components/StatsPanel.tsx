import { JSX } from 'react'
import { StatsPanelProps } from '../../utils/types'

export default function StatsPanel({ nodeData }: StatsPanelProps): JSX.Element {
  if (!nodeData) {
    return <div className="p-4 text-gray-500">Click on a node to see its details.</div>
  }

  const { edgeStats, ...rest } = nodeData

  return (
    <div className="p-4 overflow-auto">
      <h2 className="text-lg font-semibold mb-2">Node Details</h2>
      <ul className="text-sm space-y-1 mb-4">
        {Object.entries(rest).map(([key, value]) => (
          <li key={key}>
            <strong>{key}:</strong> {String(value)}
          </li>
        ))}
      </ul>

      {Array.isArray(edgeStats) && edgeStats.length > 0 && (
        <div>
          <h3 className="text-md font-semibold mb-2">Connected Edges</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-1 border-b text-left">ID</th>
                  <th className="px-2 py-1 border-b text-left">Weight</th>
                  <th className="px-2 py-1 border-b text-left">Grad Mean</th>
                  <th className="px-2 py-1 border-b text-left">Grad Min</th>
                  <th className="px-2 py-1 border-b text-left">Grad Max</th>
                </tr>
              </thead>
              <tbody>
                {edgeStats.map((edge) => (
                  <tr key={edge.id} className="odd:bg-white even:bg-gray-50">
                    <td className="px-2 py-1 border-b">{edge.id}</td>
                    <td className="px-2 py-1 border-b">{edge.weight}</td>
                    <td className="px-2 py-1 border-b">{edge.gradMean}</td>
                    <td className="px-2 py-1 border-b">{edge.gradMin}</td>
                    <td className="px-2 py-1 border-b">{edge.gradMax}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
