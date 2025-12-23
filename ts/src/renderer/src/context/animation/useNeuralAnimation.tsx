import { useContext } from 'react'
import { NeuralAnimationContext } from './NeuralAnimationContext'

export default function useNeuralAnimation() {
  const ctx = useContext(NeuralAnimationContext)

  if (!ctx) {
    throw new Error('useNeuralAnimation must be used inside NeuralAnimationProvider')
  }

  return ctx
}
