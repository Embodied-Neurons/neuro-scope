import { useNavigate } from 'react-router-dom'
import { JSX } from 'react'

export default function InstructionsPage(): JSX.Element {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white space-y-6 p-4">
      <h2 className="text-3xl font-bold">Instructions</h2>
      <p className="max-w-md text-center text-gray-300">
        Here you will find step by step instructions on how to use the visualizer.
      </p>
      <button
        onClick={() => navigate('/')}
        className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition"
      >
        Back to Home
      </button>
    </div>
  )
}
