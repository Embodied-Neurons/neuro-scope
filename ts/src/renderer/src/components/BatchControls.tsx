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
  }, [])

  return (
    <div id="batch-panel" style={{ padding: '8px' }}>
      <select
        value={selectedBatch}
        onChange={(e) => setSelectedBatch(Number(e.target.value))}
        style={{ marginRight: '6px' }}
      >
        {batches.map((b) => (
          <option key={b} value={b}>
            Batch {b}
          </option>
        ))}
      </select>
      <button onClick={() => onSelectBatch(selectedBatch)}>Load Batch</button>
    </div>
  )
}
