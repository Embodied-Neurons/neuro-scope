import { JSX } from 'react'

interface AnomalySliderProps {
  highlightTop: boolean
  highlightBottom: boolean
  percent: number
  onToggleTop: (v: boolean) => void
  onToggleBottom: (v: boolean) => void
  onChangePercent: (v: number) => void
}

export default function AnomalySlider({
  highlightTop,
  highlightBottom,
  percent,
  onToggleTop,
  onToggleBottom,
  onChangePercent
}: AnomalySliderProps): JSX.Element {
  return (
    <div className="bg-white p-4">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={highlightTop}
          onChange={(e) => onToggleTop(e.target.checked)}
          className="accent-black"
        />
        Top activations
      </label>

      <label className="flex items-center gap-2 mt-2">
        <input
          type="checkbox"
          checked={highlightBottom}
          onChange={(e) => onToggleBottom(e.target.checked)}
          className="accent-black"
        />
        Bottom activations
      </label>

      <div className="mt-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Highlight percentage: {percent}%
        </label>

        <input
          type="range"
          min={1}
          max={50}
          step={1}
          value={percent}
          onChange={(e) => onChangePercent(Number(e.target.value))}
          className="w-full accent-black"
        />
      </div>
      <p className="text-gray-500 text-xs italic">Note: first layer (input layer) is excluded</p>
    </div>
  )
}
