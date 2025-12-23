import { JSX, useEffect, useState } from 'react'
import { EpochControlsProps } from '../../../utils/types'

export default function EpochControls({
  maxEpoch,
  onSelectEpoch,
  outputDir
}: EpochControlsProps): JSX.Element {
  const [epochs, setEpochs] = useState<number[]>([])
  const [selectedEpoch, setSelectedEpoch] = useState<number>(0)

  useEffect(() => {
    async function detectEpochs(): Promise<void> {
      const detectedEpochs: number[] = []
      let epoch = 0

      while (epoch < maxEpoch) {
        try {
          await window.api.detectEpoch(outputDir, epoch)
          detectedEpochs.push(epoch)
          epoch++
        } catch {
          epoch++
        }
      }
      setEpochs(detectedEpochs)
      return
    }

    detectEpochs()
  }, [outputDir, maxEpoch])

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
