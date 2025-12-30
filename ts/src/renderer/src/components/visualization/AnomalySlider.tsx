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
      <label className="flex items-center gap-2 text-primary">
        <input
          type="checkbox"
          checked={highlightTop}
          onChange={(e) => onToggleTop(e.target.checked)}
          className="accent-primary"
        />
        Top activations
      </label>

      <label className="mt-2 flex items-center gap-2 text-primary">
        <input
          type="checkbox"
          checked={highlightBottom}
          onChange={(e) => onToggleBottom(e.target.checked)}
          className="accent-primary"
        />
        Bottom activations
      </label>

      <div className="mt-3">
        <label className="mb-1 block text-sm font-medium text-primary">
          Highlight percentage: {percent}%
        </label>

        <input
          type="range"
          min={1}
          max={50}
          step={1}
          value={percent}
          onChange={(e) => onChangePercent(Number(e.target.value))}
          className="w-full accent-primary"
          disabled={!(highlightTop || highlightBottom)}
        />
      </div>
      <p className="text-xs text-gray-500 italic">Note: first layer (input layer) is excluded</p>
    </div>
  )
}
