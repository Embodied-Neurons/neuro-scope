import MAX_GROUPS from './consts';
import * as types from './types/index';


async function groupNeurons(
    visibleNodes: Array<types.NodesArray>,
    allNodes: Array<types.NodesArray>,
    containerHeight: number, 
    originalSizes: Array<number>,
    batch: number, 
    zoomRatio: number = 1.0
) /* Tutaj miałem problemy z określeniem typu zwracanym */ {
    const layerVisibility: Array<boolean> = [];
    let maxVisibleNeurons: number = 0;
    let yExtent: number = 1;

    for (let i = 0; i < visibleNodes.length; i++) {
        const nodeLayer: Array< { x: number, y: number } > = visibleNodes[i];
        layerVisibility.push(nodeLayer.length > 0);

        if (nodeLayer.length > maxVisibleNeurons) {
            maxVisibleNeurons = nodeLayer.length;
            yExtent = nodeLayer[nodeLayer.length - 1].y - nodeLayer[0].y;
        }
    }

    yExtent = Math.min(1, yExtent / containerHeight / zoomRatio);

    const neuronsPerGroup: number = Math.ceil(Math.max(...originalSizes) / MAX_GROUPS);
    const visibleNeuronsPerGroup: number = Math.ceil(maxVisibleNeurons / MAX_GROUPS / yExtent);
    let layerGroups: Array<number> = [];
    let flag: boolean = false;

    for (let i = 0; i < visibleNodes.length; i++) {
        if (layerVisibility[i]) {
            const size: number = visibleNodes[i].length;
            layerGroups.push(Math.ceil(size / visibleNeuronsPerGroup));
            flag = true;
        } else if (flag || (i < visibleNodes.length - 1 && layerVisibility[i + 1])) {
            const size: number = originalSizes[i];
            layerGroups.push(Math.ceil(size / neuronsPerGroup));
            flag = false;
        } else {
            layerGroups.push(0);
        }
    }

    let neuronLayers: Array<types.NodesArray> = [];

    for (let i = 0; i < layerGroups.length; i++) {
        neuronLayers.push([]);
        let nodes: types.NodesArray;
        let neuronIndex: number = 0;
        let lastGroupShift: number;

        if (layerVisibility[i]) {
            nodes = visibleNodes[i];
            let groupShift: number = Math.floor(0.5 * visibleNeuronsPerGroup);

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
            let groupShift: number = Math.floor(0.5 * neuronsPerGroup);

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

    const edges: types.EdgesArray = await fetchCompressedEdges(
        batch, originalSizes, visibleNeuronsPerGroup, layerGroups, neuronLayers, layerVisibility
    );

    return { neuronLayers, edges };
}


async function fetchCompressedEdges(
    batch: number, 
    originalSizes: Array<number>, 
    visibleNeuronsPerGroup: number,
    layerGroups: Array<number>, 
    neuronLayers: Array<types.NodesArray>, 
    layerVisibility: Array<boolean>
): Promise<types.EdgesArray> {
    const edges: types.EdgesArray = [];

    try {
        const url: string = `http://127.0.0.1:5000/nn_compressed?batch=${batch}&layers=${originalSizes}&layer_count=${visibleNeuronsPerGroup}`;
        const response: Response = await fetch(url);

        if (!response.ok) {
            console.error("Failed to fetch", response.status, response.statusText);
            return edges;
        }

        const data: any = await response.json();
        const gradients: { string: Array<Array<types.Stats>> } = data.gradients || {};
        const activations: { string: Array<types.Stats> } = data.activations || {};
        const colorMap = new Map<boolean, string>([
            [false, '#c2c2c2'],
            [true,  '#2c2c2c']
        ]);


        for (let i = 0; i < layerGroups.length - 1; i++) {
            const first: types.NodesArray = neuronLayers[i];
            const second: types.NodesArray = neuronLayers[i + 1];
            const gradKey: string = `fc${i + 1}.grad`;
            const activKey: string = `fc${i + 1}.activ`;
            const gradMatrix: Array<Array<types.Stats>> | null = gradients[gradKey];
            const activList: Array<types.Stats> | null = activations[activKey];
            const color: string = colorMap.get(layerVisibility[i] && layerVisibility[i + 1]) ?? '#000000';

            if (!gradMatrix || !activList) continue;

            for (let j = 0; j < first.length; j++) {
                for (let k = 0; k < second.length; k++) {
                    const fNeuron: types.Node = first[j];
                    const sNeuron: types.Node = second[k];

                    let activStats: types.Stats | null = null;
                    if (activList) activStats = activList[k];

                    let gradStats: types.Stats | null = null;
                    if (gradMatrix) gradStats = gradMatrix[k][j];

                    sNeuron.activation = activStats?.value ?? 0;
                    sNeuron.mean = activStats?.mean ?? 0;
                    sNeuron.min = activStats?.min ?? 0;
                    sNeuron.max = activStats?.max ?? 0;
                    sNeuron.weight = activStats?.normalized ?? 0

                    edges.push({
                        id: `edge_${fNeuron.id}-${sNeuron.id}`,
                        src: fNeuron.id,
                        tgt: sNeuron.id,
                        color: color,
                        weight: gradStats?.normalized ?? 0,
                        gradValue: gradStats?.value ?? 0,
                        gradMean: gradStats?.mean ?? 0,
                        gradMin: gradStats?.min ?? 0,
                        gradMax: gradStats?.max ?? 0,
                    });
                }
            }
        }

        return edges;
    } catch (err) {
        console.error("Error fetching compressed edges:", err);
        return edges;
    }
}


function buildGraph(
    graph: types.Graph, 
    containerWidth: number,
    containerHeight: number,
    neuronLayers: Array<types.NodesArray>,
    edges: types.EdgesArray
): void {
    // drop all current nodes (edges are dropped as well)
    graph.forEachNode((node, _) => {
        graph.dropNode(node);
    });

    // dummy nodes, otherwise sigma tries to be smart and scale coordinates
    graph.addNode("dummy1", { x: 0, y: 0, color: '#ffffff' });
    graph.addNode("dummy2", { x: containerWidth, y: containerHeight, color: '#ffffff' });

    neuronLayers.forEach(layer => {
        layer.forEach(node => {
            graph.addNode(node.id, {
                x: node.x,
                y: node.y,
                size: node.size,
                color: '#c0c0c0',
                weight: node.weight,
                activation: node.activation,
                mean: node.mean,
                min: node.min,
                max: node.max
            });
        });
    });

    edges.forEach(edge => {
        graph.addEdge(edge.src, edge.tgt, {
            id: edge.id,
            size: 0.5,
            zIndex: 0,
            color: edge.color,
            weight: edge.weight,
            gradValue: edge.gradValue,
            gradMean: edge.gradMean,
            gradMin: edge.gradMin,
            gradMax: edge.gradMax
        });
    });
}

export default { groupNeurons, buildGraph };
