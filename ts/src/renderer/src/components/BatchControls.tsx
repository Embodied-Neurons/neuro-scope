import { JSX, useEffect, useState } from 'react'
import { BatchControlsProps } from '../../utils/types'

export default function BatchControls({
  maxBatch,
  onSelectBatch
}: BatchControlsProps): JSX.Element {
  const [batches, setBatches] = useState<number[]>([])
  const [selectedBatch, setSelectedBatch] = useState<number>(0)

  useEffect(() => {
    async function detectBatches(): Promise<void> {
      const detectedBatches: number[] = []
      let batch = 0

      while (batch <= maxBatch) {
        try {
          await window.api.detectBatch(batch)
          detectedBatches.push(batch)
          batch++
        } catch {
          batch++
        }
      }
      setBatches(detectedBatches)
      return
    }

    detectBatches()
  }, [maxBatch])

  return (
    <div id="batch-panel" className="p-2">
      <select
        value={selectedBatch}
        onChange={(e) => setSelectedBatch(Number(e.target.value))}
        className="mr-1.5 border-black border"
      >
        {batches.map((b) => (
          <option key={b} value={b}>
            Batch {b}
          </option>
        ))}
      </select>
      <button onClick={() => onSelectBatch(selectedBatch)} className="rounded-xl shadow p-0.5">
        Load Batch
      </button>
    </div>
  )
}
