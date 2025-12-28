import { JSX } from 'react'
import { NeuralAnimationControlsProps } from '../../../utils/types'
import useNeuralAnimation from '@renderer/context/animation/useNeuralAnimation'

export default function NeuralAnimationControls({
  epochCount
}: NeuralAnimationControlsProps): JSX.Element {
  const { isAnimating, toggle, speed, setSpeed, currentEpoch } = useNeuralAnimation()

  return (
    <div className="p-2 rounded-2xl flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-1">
        <label className="font-medium text-black">Speed: {speed}ms</label>
        <input
          type="range"
          min={200}
          max={1000}
          step={50}
          value={1200 - speed}
          onChange={(e) => setSpeed(1200 - Number(e.target.value))}
          className="w-full h-2 bg-black rounded-lg accent-black cursor-pointer"
        />
      </div>

      <div className="text-black font-medium text-center">
        Epoch: {currentEpoch + 1} / {epochCount}
      </div>
      <button
        onClick={toggle}
        className="w-full px-3 py-1 bg-black text-white rounded-lg font-semibold hover:bg-gray-700 transition"
      >
        {isAnimating ? 'Pause' : 'Start'}
      </button>
    </div>
  )
}
