import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { JSX, useEffect } from 'react'
import useNeuralAnimation from '@renderer/context/animation/useNeuralAnimation'
import { useVisualization } from '@renderer/context/visualization/useVisualization'

export default function VisualizerLayout(): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const { toggle, isAnimating, clear: clearAnimation } = useNeuralAnimation()
  const { clear: clearVis } = useVisualization()

  useEffect(() => {
    if (!location.pathname.endsWith('animation') && isAnimating) {
      toggle()
    }
  }, [location.pathname, isAnimating, toggle])

  const toMain = (): void => {
    clearAnimation()
    clearVis()
    navigate('/')
  }

  return (
    <div className="flex h-screen flex-col bg-gray-100">
      <div className="flex gap-1 border-b border-gray-200 bg-gray-50 px-4 py-2">
        {[
          { to: '', label: 'Visualization' },
          { to: 'image-input', label: 'Image Input' },
          { to: 'animation', label: 'Animation' }
        ].map(({ to, label }) => (
          <NavLink
            key={label}
            to={to}
            end
            className={({ isActive }) =>
              `rounded-md px-4 py-2 font-medium transition ${
                isActive
                  ? 'text-primary bg-gray-300'
                  : 'text-gray-500 hover:bg-gray-200/60 hover:text-black'
              } `
            }
          >
            {label}
          </NavLink>
        ))}
        <button
          onClick={toMain}
          className="bg-primary ml-auto rounded-xl px-3 py-1 font-medium text-white transition hover:bg-gray-700"
        >
          Back to Home
        </button>
      </div>

      <Outlet />
    </div>
  )
}
