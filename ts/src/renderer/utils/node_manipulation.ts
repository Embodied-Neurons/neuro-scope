import * as types from './types';


function getAllNodesByLayers(
    nodes: types.NodesArray, layerSizes: Array<number>
): Array<types.NodesArray> {
    const nodesByLayers: Array<types.NodesArray> = [];
    let previousNeuronCount: number = 0;

    for (const layerSize of layerSizes) {
        nodesByLayers.push([]);

        for (let i = 0; i < layerSize; i++) {
            nodesByLayers[nodesByLayers.length - 1].push(nodes[i + previousNeuronCount]);
        }

        previousNeuronCount += layerSize;
    }

    return nodesByLayers;
}


function getNodesPosInfo(
    nodesByLayers: Array<types.NodesArray>, containerWidth: number, containerHeight: number
): types.PosInfoArray {
    const posInfo: types.PosInfoArray = [];
    let x: number, minY: number, maxY: number;

    for (const nodesLayer of nodesByLayers) {
        x = nodesLayer[0].x;
        minY = nodesLayer[0].y;
        maxY = nodesLayer[nodesLayer.length - 1].y;

        posInfo.push({
            x: x / containerWidth,
            minY: minY / containerHeight,
            maxY: maxY / containerHeight
        });
    }

    return posInfo;
}


function visibleNodesChanged(
    newNodes: Array<types.NodesArray>, oldNodes: Array<types.NodesArray>
): boolean {
    for (let i = 0; i < newNodes.length; i++) {
        if (newNodes[i].length !== oldNodes[i].length) {
            return true;
        }
    }

    return false;
}


function anyNodeVisible(nodesByLayers: Array<types.NodesArray>): number {
    return nodesByLayers.map((layer) => layer.length).reduce((sum, el) => sum + el, 0);
}


function getVisibleNodes(
    nodes: Array<types.NodesArray>,
    containerWidth: number,
    containerHeight: number,
    visibilityRanges: { minX: number, maxX: number, minY: number, maxY: number }
): Array<types.NodesArray> {
    const { minX, maxX, minY, maxY } = visibilityRanges;
    const visibleNodes: Array<types.NodesArray> = [];

    for (const nodeLayer of nodes) {
        visibleNodes.push([]);

        if (nodeLayer[0].x / containerWidth < minX || nodeLayer[0].x / containerWidth > maxX) {
            continue;
        }

        for (const node of nodeLayer) {
            if (node.y / containerHeight >= minY && node.y / containerHeight <= maxY) {
                visibleNodes[visibleNodes.length - 1].push(node);
            }
        }
    }

    return visibleNodes;
}

export default {
    getAllNodesByLayers, getNodesPosInfo, visibleNodesChanged, anyNodeVisible, getVisibleNodes
};
