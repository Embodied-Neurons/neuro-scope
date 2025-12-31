import { JSX } from 'react'

export default function MetricBar({
  fixed,
  value,
  min,
  max
}: {
  fixed: string
  value: number
  min: number
  max: number
  gradient: 'red-green' | 'blue-green'
}): JSX.Element {
  const fillFraction = Math.max(0, Math.min(1, (value - min) / (max - min)))

  return (
    <div className="space-y-1">
      <div className="r text-sm">
        <span className="font-medium text-primary">Activation: {fixed}</span>
      </div>

      <div className="relative h-4 w-full overflow-hidden rounded bg-gray-200">
        <div
          className="absolute top-0 left-0 h-full w-full"
          style={{ background: 'linear-gradient(90deg, #fa4141, #fae641)' }}
        />
        <div
          className="absolute top-0 right-0 h-full bg-gray-200 transition-all duration-500 ease-out"
          style={{ width: `${100 - fillFraction * 100}%` }}
        />
      </div>
    </div>
  )
}
