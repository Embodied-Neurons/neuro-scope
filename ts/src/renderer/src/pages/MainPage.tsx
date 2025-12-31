import { JSX, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import ModelFileSelector from '../components/ModelFileSelector'
import { trainingStatus } from '../../utils/types'
import { useModel } from '@renderer/context/model/useModel'
import TrainingProgressBar from '@renderer/components/TrainingProgressBar'

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
    setModelName('')
    setOutputDir('')
    setEpochs(1)
  }
  const onTrainingFinish = (): void => {
    setTrainingStatus('idle')
    setModalOpen(false)
    navigate('/visualizer')
  }

  const onContinue = async (): Promise<void> => {
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
      <div className="flex min-h-screen flex-col items-center justify-center space-y-8 bg-gray-200">
        <h1 className="text-primary text-4xl font-bold">Neural Network Visualizer</h1>
        <div className="flex w-64 flex-col space-y-4">
          <button
            onClick={() => setModalOpen(true)}
            className="bg-primary rounded-xl py-3 font-medium text-white transition hover:bg-gray-700"
          >
            Start application
          </button>
          <button
            onClick={() => navigate('/demo')}
            className="bg-primary rounded-xl py-3 font-medium text-white transition hover:bg-gray-700"
          >
            Demo
          </button>
          <button
            onClick={() => navigate('/instructions')}
            className="bg-primary rounded-xl py-3 font-medium text-white transition hover:bg-gray-700"
          >
            Instructions
          </button>
        </div>
      </div>
      <Modal open={modalOpen} onClose={onModalClose} disableClose={trainingStatus === 'running'}>
        {trainingStatus === 'idle' && (
          <div className="space-y-6">
            <div className="text-primary text-sm font-semibold tracking-wide">
              Select your model file to begin
            </div>

            <ModelFileSelector />

            {modelName && (
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-primary">Number of Epochs</label>

                <input
                  id="epochsInput"
                  type="number"
                  min={1}
                  max={20}
                  value={epochs}
                  onChange={(e) => {
                    let value = e.target.valueAsNumber
                    if (value < 1) value = 1
                    if (value > 20) value = 20
                    setEpochs(value)
                  }}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-black
              transition-all duration-200 ease-out
              focus:border-black focus:outline-none"
                />

                <p className="text-xs leading-relaxed text-gray-500">
                  More epochs can improve accuracy, but will increase training time.
                </p>
              </div>
            )}

            <button
              onClick={onContinue}
              disabled={!epochs || !modelName || !outputDir}
              className={`w-full rounded-xl py-3 text-sm font-medium transition-all duration-200 ${
                outputDir && modelName && epochs
                  ? 'bg-primary text-white hover:bg-gray-700 active:scale-[0.98]'
                  : 'cursor-not-allowed bg-gray-300 text-gray-600'
              }`}
            >
              Continue
            </button>
          </div>
        )}

        {trainingStatus === 'running' && (
          <div className="flex w-full flex-col space-y-6 py-4">
            <p className="text-sm font-medium text-primary text-center">Training in progress</p>

            <TrainingProgressBar outputDir={outputDir} totalEpochs={epochs} pollIntervalMs={500} />
          </div>
        )}

        {trainingStatus === 'done' && (
          <div className="flex flex-col items-center space-y-4 py-6">
            <p className="text-sm font-medium text-black">Training complete</p>

            <button
              onClick={onTrainingFinish}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white
              transition hover:bg-gray-900 active:scale-[0.98]"
            >
              Continue to Visualization
            </button>
          </div>
        )}

        {trainingStatus === 'error' && (
          <p className="text-sm font-medium text-red-600">Error during training.</p>
        )}
      </Modal>
    </>
  )
}
