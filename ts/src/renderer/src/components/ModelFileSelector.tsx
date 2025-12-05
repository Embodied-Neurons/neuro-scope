import { useRef, ChangeEvent, JSX } from 'react'
import { FileDialogProps } from '../../utils/types'

export default function ModelFileSelector({ onFileSelect }: FileDialogProps): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleButtonClick = (): void => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const selectedFile: File | null = event.target.files?.[0] || null

    if (selectedFile) {
      const modelName: string = selectedFile.name.substring(0, selectedFile.name.length - 3)
      const outputDir: string = `\\outputs_${modelName}`

      window.api.performTrainingIfNeeded(outputDir, modelName)

      onFileSelect(outputDir, modelName)
      console.log(`Selected file: ${selectedFile.name}`)
    } else {
      onFileSelect('', '')
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
        className="bg-black text-white  rounded-xl px-4 py-2 font-medium hover:bg-gray-700 transition"
      >
        Select model file
      </button>
      <p className="text-gray-500 text-xs italic">Supported format: .py</p>
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
