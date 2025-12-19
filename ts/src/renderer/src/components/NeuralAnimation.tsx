interface NeuralAnimationState {
  isAnimating: boolean
  toggle: () => void
  speed: number
  setSpeed: (v: number) => void
  currentEpoch: number
}

interface NeuralAnimationProps {
  animation: NeuralAnimationState
  epochCount: number
}

export function NeuralAnimation({ animation, epochCount }: NeuralAnimationProps) {
  const { isAnimating, toggle, speed, setSpeed, currentEpoch } = animation

  return (
    <div className="bg-white/80 p-4 rounded shadow-lg space-y-3">
      <button onClick={toggle} className="px-3 py-1 bg-black text-white rounded">
        {isAnimating ? 'Pause' : 'Start'}
      </button>

      <div>
        <label>Speed: {speed}</label>
        <input
          type="range"
          min={200}
          max={1000}
          step={50}
          value={1200 - speed}
          onChange={(e) => setSpeed(1200 - Number(e.target.value))}
        />
      </div>

      <div>
        Epoch: {currentEpoch} / {epochCount}
      </div>
    </div>
  )
}
