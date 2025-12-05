import { JSX, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import ModelFileSelector from '../components/ModelFileSelector'
import { trainingStatus } from '../../utils/types'

export default function MainPage(): JSX.Element {
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [outputDir, setOutputDir] = useState('')
  const [modelName, setModelName] = useState('')
  const [trainingStatus, setTrainingStatus] = useState<trainingStatus>('idle')
  const onModalClose = (): void => {
    setModalOpen(false)
    setOutputDir('')
    setModelName('')
    setTrainingStatus('idle')
  }
  const onModalContinue = (): void => {
    onModalClose()
    navigate('/visualizer', { state: { outputDir, modelName } })
  }
  const handleFileSelect = async (dir: string, model: string): Promise<void> => {
    if (!dir) return

    setTrainingStatus('running')
    setOutputDir(dir)
    setModelName(model)

    try {
      await window.api.performTrainingIfNeeded(dir, model)
      setTrainingStatus('done')
    } catch {
      setTrainingStatus('error')
    }
  }

  return (
    <>
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
      </div>
      <Modal open={modalOpen} onClose={onModalClose} disableClose={trainingStatus === 'running'}>
        {trainingStatus === 'idle' && <ModelFileSelector onFileSelect={handleFileSelect} />}

        {trainingStatus === 'running' && (
          <div className="flex flex-col items-center space-y-3">
            <p className="text-gray-800 font-medium">Training in progress...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
          </div>
        )}

        {trainingStatus === 'done' && (
          <div className="flex flex-col items-center space-y-4">
            <p className="text-gray-800 font-medium">Training complete!</p>
            <button
              onClick={() => {
                onModalContinue()
              }}
              className="bg-black text-white rounded-xl px-4 py-2 hover:bg-gray-900"
            >
              Continue to Visualization
            </button>
          </div>
        )}

        {trainingStatus === 'error' && <p className="text-red-600">Error during training.</p>}
      </Modal>
    </>
  )
}
