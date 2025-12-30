import { JSX } from 'react'
import { ImageDialogProps } from '../../utils/types'
export default function ImageFileSelector({
  outputDir,
  modelName,
  onSelect
}: ImageDialogProps): JSX.Element {
  const handleButtonClick = async (): Promise<void> => {
    try {
      const imagePath: string | undefined = await window.api.showImageFileDialog()
      if (imagePath && typeof imagePath === 'string') {
        // Using absolute path of the selected image
        window.api.runImageInput(outputDir, modelName, imagePath)

        console.log(`Selected image (absolute path): ${imagePath}`)
        onSelect(imagePath)
      } else {
        console.log('INFO: Image selection cancelled!')
      }
    } catch (error) {
      console.error('Error occurred during opening the file dialog:', error)
    }
  }

  return (
    <div id="image-selector" className="flex flex-col items-center space-y-3 p-2">
      <button
        onClick={handleButtonClick}
        type="button"
        className="rounded-lg bg-primary font-medium px-3 py-2 text-white transition hover:bg-gray-700"
      >
        Select image to feed to the model
      </button>
      <p className="text-xs text-gray-500 italic">Supported formats: .png, .jpg, .jpeg, .bmp</p>
    </div>
  )
}
