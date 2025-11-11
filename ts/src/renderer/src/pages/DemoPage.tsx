import { useNavigate } from 'react-router-dom'
import { JSX } from 'react'

export default function DemoPage(): JSX.Element {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white space-y-6">
      <h2 className="text-3xl font-bold">Here you will find some demo models.</h2>
      <button
        onClick={() => navigate('/')}
        className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition"
      >
        Back to Home
      </button>
    </div>
  )
}
