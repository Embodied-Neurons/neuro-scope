import { useRef, ChangeEvent, JSX } from 'react'
import { useModel } from '@renderer/context/model/useModel'

export default function ModelFileSelector(): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { setOutputDir, setModelName, modelName } = useModel()

  const handleButtonClick = (): void => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const selectedFile: File | null = event.target.files?.[0] || null

    if (selectedFile) {
      const modelName: string = selectedFile.name.substring(0, selectedFile.name.length - 3)
      const outputDir: string = `\\outputs_${modelName}`
      setOutputDir(outputDir)
      setModelName(modelName)
      console.log(`Selected file: ${selectedFile.name} ${outputDir} ${modelName}`)
    } else {
      setOutputDir('')
      setModelName('')
      console.log('INFO: File selection cancelled!')
    }

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div id="file-selector" className="flex flex-col items-center space-y-3">
      <button
        onClick={handleButtonClick}
        type="button"
        className="bg-primary rounded-xl px-4 py-2 font-medium text-white transition hover:bg-gray-700"
      >
        Select model
      </button>
      {modelName ? (
        <p className="text-xs text-gray-500 italic">Selected {modelName}</p>
      ) : (
        <p className="text-xs text-gray-500 italic">Supported format: .py</p>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".py"
        style={{ display: 'none' }}
      />
    </div>
  )
}
