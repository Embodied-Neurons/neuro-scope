import { JSX, useState } from 'react'
import { EpochControlsProps } from '../../../utils/types'

export default function EpochControls({
  currentEpoch,
  maxEpoch,
  onSelectEpoch
}: EpochControlsProps): JSX.Element {
  const [selectedEpoch, setSelectedEpoch] = useState<number>(currentEpoch)
  const epochs: number[] = []

  for (let epoch = 0; epoch < maxEpoch; epoch++) {
    epochs.push(epoch)
  }

  return (
    <div id="epoch-panel" className="p-2">
      {epochs.length < 0 ? (
        'No epochs found'
      ) : (
        <>
          <select
            value={selectedEpoch}
            onChange={(e) => setSelectedEpoch(Number(e.target.value))}
            className="mr-3 px-2 py-0.75 border-black border"
          >
            {epochs.map((b) => (
              <option key={b} value={b}>
                {/* Display epoch starting from 1 */}
                Epoch {b + 1}
              </option>
            ))}
          </select>
          <button
            onClick={() => onSelectEpoch(selectedEpoch)}
            className="bg-black text-white rounded-lg px-3 py-1 hover:bg-gray-700 transition"
          >
            Load Epoch
          </button>
        </>
      )}
    </div>
  )
}
