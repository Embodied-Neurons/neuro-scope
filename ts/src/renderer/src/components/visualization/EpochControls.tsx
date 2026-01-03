import { JSX, useState } from 'react'
import { EpochControlsProps } from '../../../utils/types'

export default function EpochControls({
  currentEpoch,
  maxEpoch,
  onSelectEpoch
}: EpochControlsProps): JSX.Element {
  const [selectedEpoch, setSelectedEpoch] = useState<number>(currentEpoch)

  const epochs = Array.from({ length: maxEpoch }, (_, i) => i)

  return (
    <div className="flex items-center gap-3 p-2">
      {epochs.length === 0 ? (
        <span className="text-sm text-gray-500">No epochs found</span>
      ) : (
        <>
          <select
            value={selectedEpoch}
            onChange={(e) => setSelectedEpoch(Number(e.target.value))}
            className="text-primary focus:border-primary rounded-xl border border-gray-300 bg-white px-3 py-2 transition focus:ring-0 focus:outline-none"
          >
            {epochs.map((epoch) => (
              <option key={epoch} value={epoch}>
                Epoch {epoch + 1}
              </option>
            ))}
          </select>

          <button
            onClick={() => onSelectEpoch(selectedEpoch)}
            className="bg-primary rounded-xl px-3 py-2 font-medium text-white transition hover:bg-gray-700"
          >
            Load Epoch
          </button>
        </>
      )}
    </div>
  )
}
