import { JSX, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import ModelFileSelector from '../components/ModelFileSelector'
import { trainingStatus } from '../../utils/types'
import { useModel } from '@renderer/context/useModel'

export default function MainPage(): JSX.Element {
  const { setModelName, setOutputDir, setEpochs, epochs, modelName, outputDir } = useModel()
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [trainingStatus, setTrainingStatus] = useState<trainingStatus>('idle')

  useEffect(() => {
    setModelName('')
    setOutputDir('')
    setEpochs(1)
  }, [setModelName, setEpochs, setOutputDir])

  const onModalClose = (): void => {
    setTrainingStatus('idle')
    setModalOpen(false)
    navigate('/visualizer')
  }

  const onContinue = async (): Promise<void> => {
    console.log(epochs, outputDir, modelName)
    if (!outputDir || !modelName || !epochs) return
    setTrainingStatus('running')
    try {
      await window.api.performTrainingIfNeeded(outputDir, modelName, epochs)
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
        {trainingStatus === 'idle' && (
          <div className="space-y-4">
            <ModelFileSelector />

            <div className="flex flex-col space-y-1">
              <label className="text-black font-medium">Number of Epochs</label>
              <input
                id="epochsInput"
                type="number"
                min={1}
                max={20}
                value={epochs}
                onChange={(e) => setEpochs(e.target.valueAsNumber)}
                className="w-full px-4 py-2 border border-black rounded-xl text-black"
              />
            </div>

            <button
              onClick={onContinue}
              disabled={!epochs && !modelName && !outputDir}
              className={`w-full py-3 rounded-xl font-medium transition ${
                outputDir && modelName && epochs
                  ? 'bg-black text-white hover:bg-gray-900'
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed'
              }`}
            >
              Continue
            </button>
          </div>
        )}

        {trainingStatus === 'running' && (
          <div className="flex flex-col items-center space-y-3">
            <p className="text-black font-medium">Training in progress...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
          </div>
        )}

        {trainingStatus === 'done' && (
          <div className="flex flex-col items-center space-y-4">
            <p className="text-black font-medium">Training complete!</p>
            <button
              onClick={onModalClose}
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
