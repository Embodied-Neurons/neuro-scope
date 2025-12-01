import { JSX, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import ModelFileSelector from '../components/ModelFileSelector'

export default function MainPage(): JSX.Element {
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [outputDir, setOutputDir] = useState('')
  const [modelName, setModelName] = useState('')
  const [ready, setReady] = useState(false)

  const handleFileSelect = async (dir: string, model: string): Promise<void> => {
    if (!dir) return
    setReady(true)
    setOutputDir(dir)
    setModelName(model)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 space-y-8">
      <h1 className="text-4xl font-bold">Neural Network Visualizer</h1>
      <div className="flex flex-col space-y-4 w-64">
        <button
          onClick={() => setModalOpen(true)}
          className="bg-black text-white rounded-xl py-3 font-medium hover:bg-gray-700 transition"
        >
          Start application
        </button>
        <button
          onClick={() => navigate('/demo')}
          className="bg-black text-white rounded-xl py-3 font-medium hover:bg-gray-700 transition"
        >
          Demo
        </button>
        <button
          onClick={() => navigate('/instructions')}
          className="bg-black text-white rounded-xl py-3 font-medium hover:bg-gray-700 transition"
        >
          Instructions
        </button>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        {!ready && (
          <div className="flex flex-col items-center">
            <ModelFileSelector onFileSelect={handleFileSelect} />
          </div>
        )}
        {ready && (
          <div className="flex flex-col items-center space-y-4">
            <p className="text-gray-800 font-medium">Model training complete!</p>
            <button
              onClick={() => {
                setModalOpen(false)
                navigate('/visualizer', { state: { outputDir, modelName } })
              }}
              className="bg-black text-white rounded-xl px-4 py-2 hover:bg-gray-900"
            >
              Continue to Visualization
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
