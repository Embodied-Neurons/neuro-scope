import { useRef, ChangeEvent, JSX } from 'react'
import { FileDialogProps } from '../../utils/types'

export default function FileSelector({ onFileSelect }: FileDialogProps): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleButtonClick = (): void => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const selectedFile: File | null = event.target.files?.[0] || null

    if (selectedFile) {
      const modelName: string = selectedFile.name.substring(0, selectedFile.name.length - 3)
      const outputDir: string = `\\outputs_${modelName}`
      onFileSelect(outputDir)
      console.log(`Selected file: ${selectedFile.name}`)
    } else {
      onFileSelect('')
      console.log('INFO: File selection cancelled!')
    }

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div id="file-selector" className="p-2">
      <button
        onClick={handleButtonClick}
        type="button"
        className="rounded p-0.75 text-xs bg-blue-500"
      >
        Select model file
      </button>
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
