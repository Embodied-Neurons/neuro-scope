import { JSX } from 'react'
import { AnomalySliderProps } from '../../../utils/types'

export default function AnomalySlider({
  highlightTop,
  highlightBottom,
  percent,
  onToggleTop,
  onToggleBottom,
  onChangePercent
}: AnomalySliderProps): JSX.Element {
  return (
    <div className="bg-white p-2">
      <label className="text-primary flex items-center gap-2">
        <input
          type="checkbox"
          checked={highlightTop}
          onChange={(e) => onToggleTop(e.target.checked)}
          className="accent-primary"
        />
        Top activations
      </label>

      <label className="text-primary mt-2 flex items-center gap-2">
        <input
          type="checkbox"
          checked={highlightBottom}
          onChange={(e) => onToggleBottom(e.target.checked)}
          className="accent-primary"
        />
        Bottom activations
      </label>

      <div className="mt-3">
        <label className="text-primary mb-1 block text-sm font-medium">
          Highlight percentage: {percent}%
        </label>

        <input
          type="range"
          min={1}
          max={50}
          step={1}
          value={percent}
          onChange={(e) => onChangePercent(Number(e.target.value))}
          className="accent-primary w-full"
          disabled={!(highlightTop || highlightBottom)}
        />
      </div>
      <p className="text-xs text-gray-500 italic">Note: first layer (input layer) is excluded</p>
    </div>
  )
}
