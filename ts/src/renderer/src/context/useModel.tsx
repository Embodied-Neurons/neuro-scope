import { useContext } from 'react'
import { ModelContext, ModelContextType } from '@renderer/context/ModelContext'

export const useModel = (): ModelContextType => {
  const ctx = useContext(ModelContext)
  if (!ctx) throw new Error('useModel must be used inside ModelProvider')
  return ctx
}
