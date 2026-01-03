import { JSX, ReactNode, useRef, useState } from 'react'
import Graph from 'graphology'
import { VisualizationContext } from '@renderer/context/visualization/VisualizationContext'

export const VisualizationProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [epoch, setEpoch] = useState(0)
  const [imagePath, setImagePath] = useState('')

  const graphRefVis = useRef<Graph | null>(null)
  const graphRefImg = useRef<Graph | null>(null)

  const clear = (): void => {
    setEpoch(0)
    setImagePath('')
    graphRefImg.current = null
    graphRefVis.current = null
  }

  return (
    <VisualizationContext.Provider
      value={{ epoch, setEpoch, imagePath, setImagePath, graphRefVis, graphRefImg, clear }}
    >
      {children}
    </VisualizationContext.Provider>
  )
}
