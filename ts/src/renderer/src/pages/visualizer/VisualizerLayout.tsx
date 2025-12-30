import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { JSX, useEffect } from 'react'
import useNeuralAnimation from '@renderer/context/animation/useNeuralAnimation'

export default function VisualizerLayout(): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const { toggle, isAnimating } = useNeuralAnimation()
  useEffect(() => {
    if (!location.pathname.endsWith('animation') && isAnimating) {
      toggle()
    }
  }, [location.pathname, isAnimating, toggle])

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
                  ? 'bg-white text-primary'
                  : 'text-gray-500 hover:bg-gray-200/60 hover:text-black'
              } `
            }
          >
            {label}
          </NavLink>
        ))}
        <button
          onClick={() => navigate('/')}
          className="ml-auto rounded-xl font-medium bg-primary px-3 py-1 text-white transition hover:bg-gray-700"
        >
          Back to Home
        </button>
      </div>

      <Outlet />
    </div>
  )
}
