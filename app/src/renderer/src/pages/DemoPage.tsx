import { useNavigate } from 'react-router-dom'
import { JSX } from 'react'
import { useModel } from '@renderer/context/model/useModel'

export default function DemoPage(): JSX.Element {
  const navigate = useNavigate()
  const { setOutputDir, setModelName, setEpochs } = useModel()

  const demoModelSelect = (demoModelName: string): void => {
    const outputDir: string = `\\outputs_${demoModelName}`
    setOutputDir(outputDir)
    setModelName(demoModelName)
    setEpochs(10)
    navigate('/visualizer')
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-black p-6 text-white">
      <button
        onClick={() => navigate('/')}
        className="text-primary fixed top-4 right-4 z-50 rounded-lg bg-white px-4 py-2 font-medium transition hover:bg-gray-200"
      >
        Back to home
      </button>
      <h2 className="mb-10 text-3xl font-bold">Demo Models</h2>

      <div className="grid w-full max-w-4xl grid-cols-2 gap-6">
        <div className="bg-primary col-span-2 flex flex-col justify-between rounded-xl border border-white/20 p-6">
          <div>
            <h3 className="mb-2 text-xl font-semibold">Simple MNIST Model</h3>
            <p className="text-sm text-gray-300">
              A baseline neural network trained on handwritten digits (MNIST database). Consists of
              1 hidden layer and was trained for 10 epochs.
            </p>
          </div>

          <button
            className="text-primary mt-6 rounded-lg bg-white px-4 py-2 font-medium transition hover:bg-gray-200"
            onClick={() => {
              demoModelSelect('demo_simple_mnist_!1x3v6b')
            }}
          >
            Load Demo
          </button>
        </div>

        <div className="bg-primary flex flex-col justify-between rounded-xl border border-white/20 p-6">
          <div>
            <h3 className="mb-2 text-xl font-semibold">Iris Model</h3>
            <p className="text-sm text-gray-300">
              A lightweight neural network trained on iris flower species. Consists of 2 hidden
              layers containing a few neurons and was trained for 10 epochs.
            </p>
          </div>

          <button
            className="text-primary mt-6 rounded-lg bg-white px-4 py-2 font-medium transition hover:bg-gray-200"
            onClick={() => {
              demoModelSelect('demo_iris_%8d5g0l')
            }}
          >
            Load Demo
          </button>
        </div>

        <div className="bg-primary flex flex-col justify-between rounded-xl border border-white/20 p-6">
          <div>
            <h3 className="mb-2 text-xl font-semibold">Fashion-MNIST Model</h3>
            <p className="text-sm text-gray-300">
              A more complex model trained to recognize common clothing types. Consists of 2 hidden
              layers containing a few hundred neurons and was trained for 10 epochs.
            </p>
          </div>

          <button
            className="text-primary mt-6 rounded-lg bg-white px-4 py-2 font-medium transition hover:bg-gray-200"
            onClick={() => {
              demoModelSelect('demo_fashion_mnist_@2y4n7a')
            }}
          >
            Load Demo
          </button>
        </div>
      </div>
    </div>
  )
}
