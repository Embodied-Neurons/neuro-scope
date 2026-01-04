import NeuralAnimation from '../../components/animation/NeuralAnimation'
import { useModel } from '../../context/model/useModel'
import { JSX } from 'react'

export default function AnimationView(): JSX.Element {
  const { outputDir } = useModel()

  return <NeuralAnimation outputDir={outputDir} />
}
