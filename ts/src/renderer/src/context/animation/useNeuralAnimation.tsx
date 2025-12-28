import { useContext } from 'react'
import { NeuralAnimationContext } from './NeuralAnimationContext'
import { NeuralAnimationState } from '../../../utils/types'

export default function useNeuralAnimation(): NeuralAnimationState {
  const ctx = useContext(NeuralAnimationContext)

  if (!ctx) {
    throw new Error('useNeuralAnimation must be used inside NeuralAnimationProvider')
  }

  return ctx
}
