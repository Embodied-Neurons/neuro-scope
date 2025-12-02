import { JSX, useEffect, useState } from 'react'
import { EpochControlsProps } from '../../utils/types'

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
      {epochs.length == 0 ? (
        'No epochs found'
      ) : (
        <>
          <select
            value={selectedEpoch}
            onChange={(e) => setSelectedEpoch(Number(e.target.value))}
            className="mr-1.5 border-black border"
          >
            {epochs.map((b) => (
              <option key={b} value={b}>
                Epoch {b}
              </option>
            ))}
          </select>
          <button
            onClick={() => onSelectEpoch(selectedEpoch)}
            className="rounded-xl shadow pl-1.5 pr-1.5 pt-0.75 pb-0.75 mt-2 text-base"
          >
            Load Epoch
          </button>
        </>
      )}
    </div>
  )
}
