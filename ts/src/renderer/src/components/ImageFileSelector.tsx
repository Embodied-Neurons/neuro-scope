import { JSX } from 'react'
import { ImageDialogProps } from '../../utils/types'
import { useVisualization } from '@renderer/context/visualization/useVisualization'
export default function ImageFileSelector({
  outputDir,
  modelName,
  onSelect
}: ImageDialogProps): JSX.Element {
  const { imagePath } = useVisualization()

  const handleButtonClick = async (): Promise<void> => {
    try {
      const currentImagePath: string | undefined = await window.api.showImageFileDialog()
      if (currentImagePath && typeof currentImagePath === 'string') {
        if (imagePath != currentImagePath) {
          // Using absolute path of the selected image
          window.api.runImageInput(outputDir, modelName, currentImagePath)

          console.log(`Selected image (absolute path): ${currentImagePath}`)
          onSelect(currentImagePath)
        }
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
        className="bg-primary rounded-lg px-3 py-2 font-medium text-white transition hover:bg-gray-700"
      >
        Select image to feed to the model
      </button>
      <p className="text-xs text-gray-500 italic">Supported formats: .png, .jpg, .jpeg, .bmp</p>
    </div>
  )
}
