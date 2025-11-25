/*
    Common/more important types for renderer utils are defined here.
*/

import type SigmaDefault from 'sigma'
import type GraphDefault from 'graphology'
import type { RefObject } from 'react'

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

// Node info type, used in graph structure
type NodeInfo = { label: string }

// Node type
export type Node = {
  id: string
  x: number
  y: number
  label?: string
  color?: string
  weight?: number
  activation?: number
}

// Edge type
export type Edge = {
  id: string
  src: string
  tgt: string
  color?: string
  weight?: number
  gradValue?: number
}

// Graph structure type
export type GraphStructure = {
  layerSizes: number[]
  nodes: NodeInfo[]
  edges: [number, number][]
}

// Neural network data used for visualization
export type NeuralNetworkData = {
  nodes: Node[]
  edges: Edge[]
  activations: Record<string, ActivStats>
  gradients: Record<string, GradStats>
  layerSizes: number[]
  nodeLabels: string[]
}

// Properties types for various components
export type BatchControlsProps = {
  maxBatch: number
  onSelectBatch: (batch: number) => void
  outputDir: string
}

export type StatsPanelProps = {
  nodeData: Record<string, unknown> | null
}

export type NeuralGraphProps = {
  batch: number
  onNodeSelect: (nodeData: Record<string, unknown> | null) => void
  outputDir: string
}

export type FileDialogProps = {
  onFileSelect: (outputDir: string) => void
}

// Stats types for activations and gradients
export type ActivStats = {
  raw: number[]
  norm: number[]
}

export type GradStats = {
  raw: number[][]
  norm: number[][]
}

export type NeuralStats = {
  gradients: Record<string, GradStats>
  activations: Record<string, ActivStats>
}
