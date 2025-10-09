const getAllNodesByLayers = function(nodes, layerSizes) {
    const nodesByLayers = [];
    let previousNeuronCount = 0;

    for (const layerSize of layerSizes) {
        nodesByLayers.push([]);

        for (let i = 0; i < layerSize; i++) {
            nodesByLayers[nodesByLayers.length - 1].push(nodes[i + previousNeuronCount]);
        }

        previousNeuronCount += layerSize;
    }

    return nodesByLayers;
}


const getNodesPosInfo = function(nodesByLayers, containerWidth, containerHeight) {
    const posInfo = [];
    let x, minY, maxY;

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


const visibleNodesChanged = function(newNodes, oldNodes) {
    for (let i = 0; i < newNodes.length; i++) {
        if (newNodes[i].length !== oldNodes[i].length) {
            return true;
        }
    }

    return false;
}


const anyNodeVisible = function(nodesByLayers) {
    return nodesByLayers.map((layer) => layer.length).reduce((sum, el) => sum + el, 0);
}


const getVisibleNodes = function(nodes, containerWidth, containerHeight, visibilityRanges) {
    const {minX, maxX, minY, maxY} = visibilityRanges;
    const visibleNodes = [];

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

module.exports = { getAllNodesByLayers, getNodesPosInfo, visibleNodesChanged, anyNodeVisible, getVisibleNodes };
