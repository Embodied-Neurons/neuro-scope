/*
    Common/more important types for renderer utils are defined here.
*/

import type SigmaDefault from 'sigma'
import type GraphDefault from 'graphology'
import { ReactNode, RefObject } from 'react'

// Attributes type, used in Sigma
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Attributes = Record<string, any>

// Graph type
export type Graph = GraphDefault<Attributes, Attributes>

// Sigma renderer type
export type SigmaRenderer = SigmaDefault<Attributes, Attributes, Attributes>

// Camera type
export type Camera = ReturnType<SigmaRenderer['getCamera']>

// HTML div and corresponding React component types
export type Div = HTMLDivElement
export type DivRef = RefObject<HTMLDivElement>

// Position info type
export type PosInfo = { minX: number; maxX: number; minY: number; maxY: number }

// 2D position type
export type Position = { x: number; y: number }

// Node type
export type Node = {
  id: string
  x: number
  y: number
  color?: string
  weight?: number
  activation?: number
}

// Graph structure type
export type GraphStructure = {
  inputSize: number
  layerSizes: number[]
}

// Neural network data used for visualization
export type NeuralNetworkData = {
  nodes: Node[]
  activations: linearActivStats
  gradients?: linearGradStats
  layerSizes: number[]
}

// Neural animation state used for animation
export type NeuralAnimationState = {
  isAnimating: boolean
  toggle: () => void
  speed: number
  setSpeed: (v: number) => void
  currentEpoch: number
  stepEpoch: (v: number) => void
  graphRef: RefObject<Graph | null>
  rendererRef: RefObject<SigmaRenderer | null>
  layerSizesRef: RefObject<number[]>
  clear: () => void
}

// Properties types for various components
export type EpochControlsProps = {
  currentEpoch: number
  maxEpoch: number
  onSelectEpoch: (epoch: number) => void
}

export type StatsPanelProps = {
  nodeData: Record<string, unknown> | null
  graphRef: RefObject<Graph | null>
  allowGrads: boolean
}

export type AnomalySliderProps = {
  highlightTop: boolean
  highlightBottom: boolean
  percent: number
  onToggleTop: (v: boolean) => void
  onToggleBottom: (v: boolean) => void
  onChangePercent: (v: number) => void
}

export type NeuralGraphProps = {
  epoch: number
  onNodeSelect: (nodeData: Record<string, unknown> | null) => void
  outputDir: string
  highlightTop: boolean
  highlightBottom: boolean
  highlightPercent: number
  graphRef: RefObject<Graph | null>
}

export type NeuralImageInputProps = {
  imagePath: string
  onNodeSelect: (nodeData: Record<string, unknown> | null) => void
  outputDir: string
  highlightTop: boolean
  highlightBottom: boolean
  highlightPercent: number
  graphRef: RefObject<Graph | null>
}

export type NeuralAnimationControlsProps = {
  epochCount: number
}

export type FileDialogProps = {
  onFileSelect: (outputDir: string, modelName: string) => void
}

export type ImageDialogProps = {
  outputDir: string
  modelName: string
  onSelect: (imagePath: string) => void
}

// Stats types for activations and gradients
export type ActivStats = {
  raw: number[]
  norm: number[]
  extremes: number[]
}

export type linearActivStats = {
  linear: Array<{ raw: number; norm: number }>
  extremes: number[][]
}

export type GradStats = {
  raw: number[][]
  norm: number[][]
}

export type linearGradStats = Array<{ raw: number[]; norm: number[] }>

// Model training status
export type trainingStatus = 'idle' | 'running' | 'done' | 'error'

export type TrainingBarProps = {
  outputDir: string
  totalEpochs: number
  pollIntervalMs: number
}

export type ModalProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
  disableClose: boolean
}
