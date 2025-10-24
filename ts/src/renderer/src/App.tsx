import { JSX, useState } from 'react'
import BatchControls from './components/BatchControls'
import { NeuralGraph } from './components/NeuralGraph'

export default function App(): JSX.Element {
  const [batch, setBatch] = useState(0)

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '250px', color: 'white' }}>
        <BatchControls onSelectBatch={setBatch} maxBatch={10} />
      </div>
      <div style={{ flex: 1 }}>
        <NeuralGraph batch={batch} />
      </div>
    </div>
  )
}
