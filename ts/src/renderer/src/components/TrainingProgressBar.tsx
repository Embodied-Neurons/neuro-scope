import { JSX, useEffect, useState } from 'react'

interface Props {
  outputDir: string
  totalEpochs: number
  pollIntervalMs: number
}

export default function TrainingProgressBar({
  outputDir,
  totalEpochs,
  pollIntervalMs = 500
}: Props): JSX.Element {
  const [completed, setCompleted] = useState(0)

  useEffect(() => {
    let active = true

    const poll = async (): Promise<void> => {
      try {
        const files: string[] = await window.api.listFilesInDirectory(outputDir)

        const epochMap = new Map<number, { activations: boolean; gradients: boolean }>()

        for (const file of files) {
          const match = file.match(/^epoch_(\d+)_(activations|gradients)\.json$/)
          if (!match) continue

          const epoch = Number(match[1])
          if (epoch >= totalEpochs) continue

          const type = match[2] as 'activations' | 'gradients'

          if (!epochMap.has(epoch)) {
            epochMap.set(epoch, { activations: false, gradients: false })
          }

          epochMap.get(epoch)![type] = true
        }

        let count = 0
        for (const { activations, gradients } of epochMap.values()) {
          if (activations && gradients) count++
        }

        if (active) {
          setCompleted(Math.min(count, totalEpochs))
        }
      } catch {
        if (active) setCompleted(0)
      }
    }

    poll()
    const id = setInterval(poll, pollIntervalMs)

    return () => {
      active = false
      clearInterval(id)
    }
  }, [outputDir, totalEpochs, pollIntervalMs])

  const progress = Math.min(completed / totalEpochs, 1)

  return (
    <div className="w-full space-y-3">
      <div className="flex justify-between text-sm font-medium text-primary">
        <span>
          {completed} / {totalEpochs} epochs
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full bg-black transition-all duration-300 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  )
}
