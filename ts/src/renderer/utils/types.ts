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
export type PosInfo = { x: number; minY: number; maxY: number }

// 2D position type
export type Position = { x: number; y: number }

// Node info type, used in graph structure
type NodeInfo = { label: string }

// Node type
export type Node = {
  id: string
  x: number
  y: number
  size: number
  label?: string
  color?: string
  weight?: number
  activation?: number
  mean?: number
  min?: number
  max?: number
}

// Edge type
export type Edge = {
  id: string
  src: string
  tgt: string
  color: string
  weight: number
  gradValue: number
  gradMean: number
  gradMin: number
  gradMax: number
}

// Edge layout, limited to first three fields
export type EdgeLayout = { id: string; source: string; target: string }

// Gradient/activation/chunk statistics type
export type Stats = {
  value: number
  mean: number
  min: number
  max: number
  normalized: number
}

// Layer size is described with three numbers
export type LayerSize = [number, number, number]

// Graph structure type
export type GraphStructure = {
  layerSizes: number[]
  nodes: NodeInfo[]
  edges: [number, number][]
}

// Neural network data used for visualization
export type NeuralNetworkData = {
  nodes: Node[]
  edges: EdgeLayout[]
  activations: Record<string, number[][]>
  gradients: Record<string, number[][]>
  layerSizes: number[]
  nodeLabels: string[]
}

// Compressed data type
export type CompressedData = {
  gradients: Record<string, Stats[][]>
  activations: Record<string, Stats[]>
}

// Properties for batch controls type
export type BatchControlsProps = {
  maxBatch: number
  onSelectBatch: (batch: number) => void
}
