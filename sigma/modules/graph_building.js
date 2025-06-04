const { MAX_GROUPS, CONTAINER_WIDTH, CONTAINER_HEIGHT } = require('./consts.js')


const groupNeurons = async function(visibleNodes, allNodes, originalSizes, batch, zoomRatio = 1.0) {
    const layerVisibility = [];
    let maxVisibleNeurons = 0;
    let yExtent = 1;

    for (let i = 0; i < visibleNodes.length; i++) {
        const nodeLayer = visibleNodes[i];
        layerVisibility.push(nodeLayer.length > 0);

        if (nodeLayer.length > maxVisibleNeurons) {
            maxVisibleNeurons = nodeLayer.length;
            yExtent = nodeLayer[nodeLayer.length - 1].y - nodeLayer[0].y;
        }
    }

    yExtent = Math.min(1, yExtent / CONTAINER_HEIGHT / zoomRatio);

    const neuronsPerGroup = Math.ceil(Math.max(...originalSizes) / MAX_GROUPS);
    const visibleNeuronsPerGroup = Math.ceil(maxVisibleNeurons / MAX_GROUPS / yExtent);
    let layerGroups = [];
    let flag = false;

    for (let i = 0; i < visibleNodes.length; i++) {
        if (layerVisibility[i]) {
            const size = visibleNodes[i].length;
            layerGroups.push(Math.ceil(size / visibleNeuronsPerGroup));
            flag = true;
        } else if (flag || (i < visibleNodes.length - 1 && layerVisibility[i + 1])) {
            const size = originalSizes[i];
            layerGroups.push(Math.ceil(size / neuronsPerGroup));
            flag = false;
        } else {
            layerGroups.push(0);
        }
    }

    let neuronLayers = [];

    for (let i = 0; i < layerGroups.length; i++) {
        neuronLayers.push([]);
        let nodes;
        let neuronIndex = 0;
        let lastGroupShift;

        if (layerVisibility[i]) {
            nodes = visibleNodes[i];
            let groupShift = Math.floor(0.5 * visibleNeuronsPerGroup);

            for (let j = 0; j < layerGroups[i] - 1; j++, neuronIndex += visibleNeuronsPerGroup) {
                neuronLayers[neuronLayers.length - 1].push({
                    id: nodes[neuronIndex].id,
                    x: nodes[neuronIndex].x,
                    y: nodes[neuronIndex + groupShift].y,
                    size: Math.max(1.4, 0.7 * (nodes[neuronIndex + groupShift].y - nodes[neuronIndex].y))
                });
            }

            if (nodes.length % visibleNeuronsPerGroup) {
                lastGroupShift = Math.floor(0.5 * (nodes.length % visibleNeuronsPerGroup));
            } else {
                lastGroupShift = Math.floor(0.5 * visibleNeuronsPerGroup);
            }
        } else if (layerGroups[i] > 0) {
            nodes = allNodes[i];
            let groupShift = Math.floor(0.5 * neuronsPerGroup);

            for (let j = 0; j < layerGroups[i] - 1; j++, neuronIndex += neuronsPerGroup) {
                neuronLayers[neuronLayers.length - 1].push({
                    id: nodes[neuronIndex].id,
                    x: nodes[neuronIndex].x,
                    y: nodes[neuronIndex + groupShift].y,
                    size: Math.max(1.4, 0.7 * (nodes[neuronIndex + groupShift].y - nodes[neuronIndex].y))
                });
            }

            if (nodes.length % neuronsPerGroup) {
                lastGroupShift = Math.floor(0.5 * (nodes.length % neuronsPerGroup));
            } else {
                lastGroupShift = Math.floor(0.5 * neuronsPerGroup);
            }
        } else {
            continue;
        }

        neuronLayers[neuronLayers.length - 1].push({
            id: nodes[neuronIndex].id,
            x: nodes[neuronIndex].x,
            y: nodes[neuronIndex + lastGroupShift].y,
            size: Math.max(1.4, 0.7 * (nodes[neuronIndex + lastGroupShift].y - nodes[neuronIndex].y)),
            weight: 0
        });
    }

    const edges = await fetchCompressedEdges(batch, originalSizes, visibleNeuronsPerGroup, layerGroups, neuronLayers, layerVisibility);

    return {neuronLayers, edges};
}


async function fetchCompressedEdges(batch, originalSizes, visibleNeuronsPerGroup, layerGroups, neuronLayers, layerVisibility) {
    const edges = [];
    const response = await fetch(`http://127.0.0.1:5000/nn_compressed?batch=${batch}&layers=${originalSizes}&layer_count=${visibleNeuronsPerGroup}`);
    const data = await response.json();
    const grad = data["gradients"]
    const activ = data["activations"]

    // color dict
    const color_dict = { false: '#c2c2c2', true: '#2c2c2c' };

    for (let i = 0; i < layerGroups.length - 1; i++) {
        const first = neuronLayers[i];
        const second = neuronLayers[i + 1];
        const gradKey = `fc${i + 1}.grad`;
        const activKey = `fc${i + 1}.activ`;
        const matrixGrad = grad[gradKey];
        const listActiv = activ[activKey];
        const color = color_dict[layerVisibility[i] && layerVisibility[i + 1]];

        for (let j = 0; j < first.length; j++) {
            for (let k = 0; k < second.length; k++) {
                const fneuron = first[j];
                const sneuron = second[k];
                sneuron.weight = listActiv[k]
                edges.push({
                    src: fneuron.id,
                    tgt: sneuron.id,
                    id: 'edge' + '_' + fneuron.id + '-' + sneuron.id,
                    color: color,
                    weight: matrixGrad[k][j]
                });
            }
        }
    }
    return edges;
}


const buildGraph = function(graph, neuronLayers, edges) {
    // drop all current nodes (edges are dropped as well)
    graph.forEachNode((node, _) => {
        graph.dropNode(node);
    });

    // dummy nodes, otherwise sigma tries to be smart and scale coordinates
    graph.addNode("dummy1", {x: 0, y: 0, color: '#ffffff'});
    graph.addNode("dummy2", {x: CONTAINER_WIDTH, y: CONTAINER_HEIGHT, color: '#ffffff'});

    neuronLayers.forEach(layer => {
        layer.forEach(node => {
            graph.addNode(node.id, {
                x: node.x,
                y: node.y,
                size: node.size,
                color: '#c0c0c0',
                weight: node.weight
            });
        });
    });

    edges.forEach(edge => {
        graph.addEdge(edge.src, edge.tgt, {
            id: edge.id,
            size: 0.5,
            zIndex: 0,
            color: edge.color,
            weight: edge.weight
        });
    });
}

module.exports = { groupNeurons, buildGraph };
