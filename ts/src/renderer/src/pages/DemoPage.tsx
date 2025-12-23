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
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
      <h2 className="text-3xl font-bold mb-10">Demo Models</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        <div className="bg-white/10 border border-white/20 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">Jute Pest Classifier</h3>
            <p className="text-gray-300 text-sm">
              A demo model trained to recognize common pests and diseases affecting jute plants.
              Useful for visualizing real-world CNN activations.
            </p>
          </div>

          <button className="mt-6 bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition">
            Load Demo
          </button>
        </div>

        <div className="bg-white/10 border border-white/20 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">Simple MNIST Model</h3>
            <p className="text-gray-300 text-sm">
              A lightweight neural network trained on handwritten digits (MNIST). Great for
              understanding basic neuron activations and layer behavior.
            </p>
          </div>

          <button
            className="mt-6 bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition"
            onClick={() => {
              // We assume user does not name their own model this exact name - can we do better?
              demoModelSelect('demo_simple_mnist_!1x3v6b')
            }}
          >
            Load Demo
          </button>
        </div>
      </div>

      <button
        onClick={() => navigate('/')}
        className="mt-12 bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition"
      >
        Back to Home
      </button>
    </div>
  )
}
