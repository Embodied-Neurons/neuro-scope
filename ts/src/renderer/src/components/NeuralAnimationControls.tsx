import { NeuralAnimationState } from '../../utils/types'

interface Props {
  animation: NeuralAnimationState
  epochCount: number
}

export default function NeuralAnimationControls({ animation, epochCount }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button onClick={animation.stepBackward} className="px-3 py-1 bg-gray-200 rounded">
          ⏮
        </button>

        <button onClick={animation.toggle} className="px-3 py-1 bg-blue-600 text-white rounded">
          {animation.isAnimating ? 'Pause' : 'Start'}
        </button>

        <button onClick={animation.stepForward} className="px-3 py-1 bg-gray-200 rounded">
          ⏭
        </button>
      </div>

      <div className="text-sm text-gray-700">
        Epoch: {animation.currentEpoch + 1} / {epochCount}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm">Speed</span>
        <input
          type="range"
          min={200}
          max={1000}
          step={50}
          value={1400 - animation.speed}
          onChange={(e) => animation.setSpeed(1400 - Number(e.target.value))}
        />
      </div>
    </div>
  )
}
