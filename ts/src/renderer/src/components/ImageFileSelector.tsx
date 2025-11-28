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

        // Convention: setting batch to negative value
        onSelect(-1)
      } else {
        console.log('INFO: Image selection cancelled!')
      }
    } catch (error) {
      console.error('Error occurred during opening the file dialog:', error)
    }
  }

  return (
    <div id="image-selector" className="flex flex-col items-center space-y-3">
      <button
        onClick={handleButtonClick}
        type="button"
        className="bg-white text-black rounded-xl px-4 py-2 font-medium hover:bg-gray-200 transition"
      >
        Select image to feed to the model
      </button>
      <p className="text-gray-500 text-xs italic">Supported formats: .png, .jpg, .jpeg, .bmp</p>
    </div>
  )
}
