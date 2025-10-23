/*
    Common/more important types are defined here.
*/

import type SigmaDefault from 'sigma';
import type GraphDefault from 'graphology';
import type { RefObject } from 'react';


// Attributes type, used in Sigma
export type Attributes = Record<string, any>;

// Graph type
export type Graph = GraphDefault<Attributes, Attributes>;

// Sigma renderer type
export type SigmaRenderer = SigmaDefault<Attributes, Attributes, Attributes>;

// Camera type
export type Camera = ReturnType<SigmaRenderer['getCamera']>;

// HTML div and corresponding React component types
export type Div = HTMLDivElement;
export type DivRef = RefObject<HTMLDivElement>;

// Position info array type
export type PosInfoArray = Array<{ x: number, minY: number, maxY: number }>;

// Node & nodes array type
export type Node = {
    id: string, 
    x: number, 
    y: number, 
    size: number,
    color?: string,
    weight?: number,
    activation?: number,
    mean?: number,
    min?: number,
    max?: number
};

export type NodesArray = Array<Node>;

// Edges array type
export type EdgesArray = Array<{ 
    id: string, 
    src: string, 
    tgt: string, 
    color: string, 
    weight: number,
    gradValue: number,
    gradMean: number,
    gradMin: number,
    gradMax: number
}>;

// Gradient/activation statistics type
export type Stats = { 
    value: number, mean: number, min: number, max: number, normalized: number 
};
