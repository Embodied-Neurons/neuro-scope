import { createContext } from 'react'
import { NeuralAnimationState } from '../../../utils/types'

export const NeuralAnimationContext = createContext<NeuralAnimationState | null>(null)
