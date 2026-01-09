import { JSX } from 'react'
import useNeuralAnimation from '@renderer/context/animation/useNeuralAnimation'
import { FaPlay, FaPause, FaForward, FaBackward } from 'react-icons/fa'
import { useModel } from '@renderer/context/model/useModel'

export default function NeuralAnimationControls(): JSX.Element {
  const { isAnimating, toggle, speed, setSpeed, currentEpoch, stepEpoch } = useNeuralAnimation()
  const { epochs: epochCount } = useModel()

  return (
    <div className="flex w-full flex-col gap-4 rounded-2xl p-2">
      <div className="flex flex-col gap-1">
        <label className="text-primary font-medium">Speed: {speed}ms</label>
        <input
          type="range"
          min={200}
          max={1000}
          step={50}
          value={1200 - speed}
          onChange={(e) => setSpeed(1200 - Number(e.target.value))}
          className="bg-primary accent-primary h-2 w-full cursor-pointer rounded-lg"
          disabled={isAnimating}
        />
      </div>

      <div className="text-primary text-center font-medium">
        Epoch: {currentEpoch + 1} / {epochCount}
      </div>

      <div className="flex items-center justify-center gap-4">
        <button onClick={() => stepEpoch(-1)} disabled={isAnimating}>
          <FaBackward className="text-primary" />
        </button>

        <button onClick={toggle}>
          {isAnimating ? <FaPause className="text-primary" /> : <FaPlay className="text-primary" />}
        </button>

        <button onClick={() => stepEpoch(1)} disabled={isAnimating}>
          <FaForward className="text-primary" />
        </button>
      </div>
    </div>
  )
}
