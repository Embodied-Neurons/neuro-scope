import { useState } from 'react'
import { ModelContext } from '@renderer/context/model/ModelContext'

export const ModelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [outputDir, setOutputDir] = useState('')
  const [modelName, setModelName] = useState('')
  const [epochs, setEpochs] = useState(1)
  return (
    <ModelContext.Provider
      value={{
        outputDir,
        setOutputDir,
        modelName,
        setModelName,
        epochs,
        setEpochs
      }}
    >
      {children}
    </ModelContext.Provider>
  )
}
