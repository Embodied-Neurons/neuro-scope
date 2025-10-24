import { useEffect, useState } from 'react'
import { OUTPUT_DIR } from '../../../main'

interface BatchControlsProps {
  maxBatch: number
  onSelectBatch: (batch: number) => void
}

export default function BatchControls({ maxBatch, onSelectBatch }: BatchControlsProps) {
  const [batches, setBatches] = useState<number[]>([])
  const [selectedBatch, setSelectedBatch] = useState<number>(0)
  useEffect(() => {
    async function detectBatches() {
      //todo
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

      <button onClick={() => onSelectBatch(0)}>Load Batch</button>
    </div>
  )
}
