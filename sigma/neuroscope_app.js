// imports
const Graph = require('graphology');
const Sigma = require('sigma').default;

// global consts
const MAX_GROUPS = 28;
const CONTAINER_WIDTH = 960;
const CONTAINER_HEIGHT = 720;

// helper functions
function getAllNodesByLayers(nodes, layerSizes) {
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


function getNeuronsPosInfo(nodesByLayers) {
    const posInfo = [];
    let x, minY, maxY;

    for (const nodesLayer of nodesByLayers) {
        x = nodesLayer[0].x;
        minY = nodesLayer[0].y;
        maxY = nodesLayer[nodesLayer.length - 1].y;

        posInfo.push({
            x: x / CONTAINER_WIDTH,
            minY: minY / CONTAINER_HEIGHT,
            maxY: maxY / CONTAINER_HEIGHT
        });
    }

    return posInfo;
}


async function groupNeurons(visibleNodes, allNodes, originalSizes, batch, zoomRatio = 1.0) {
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


function buildGraph(graph, neuronLayers, edges) {
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


function visibleNodesChanged(newNodes, oldNodes) {
    for (let i = 0; i < newNodes.length; i++) {
        if (newNodes[i].length !== oldNodes[i].length) {
            return true;
        }
    }

    return false;
}


function anyNodeVisible(nodesByLayers) {
    return nodesByLayers.map((layer) => layer.length).reduce((sum, el) => sum + el, 0);
}


function calculateDynamicBounds(x, y, ratio, posInfo) {
    let newX, newY;
    let {minY, maxY} = findYExtremes(x, posInfo);
    newY = Math.max(Math.min(y, maxY), minY);

    if (ratio >= 0.6) {
        if (x - 0.4 * ratio > posInfo[posInfo.length - 2].x) {
            newX = posInfo[posInfo.length - 2].x + 0.4 * ratio;
        } else if (x + 0.4 * ratio < posInfo[1].x) {
            newX = posInfo[1].x - 0.4 * ratio;
        } else {
            newX = x;
        }
    } else {
        newX = Math.max(Math.min(x, posInfo[posInfo.length - 1].x), posInfo[0].x);
    }

    return {newX, newY};
}


function findYExtremes(x, posInfo) {
    let minY, maxY, buff;

    if (x < posInfo[0].x) {
        minY = posInfo[0].minY;
        maxY = posInfo[0].maxY;
        buff = 0.125 * (maxY - minY);
    } else if (x > posInfo[posInfo.length - 1].x) {
        minY = posInfo[posInfo.length - 1].minY;
        maxY = posInfo[posInfo.length - 1].maxY;
        buff = 0.125 * (maxY - minY);
    } else {
        for (let i = 0; i < posInfo.length - 1; i++) {
            if (x >= posInfo[i].x && x <= posInfo[i + 1].x) {
                const w1 = (x - posInfo[i].x) / (posInfo[i + 1].x - posInfo[i].x);
                const w2 = (posInfo[i + 1].x - x) / (posInfo[i + 1].x - posInfo[i].x);
                minY = w2 * posInfo[i].minY + w1 * posInfo[i + 1].minY;
                maxY = w2 * posInfo[i].maxY + w1 * posInfo[i + 1].maxY;
                buff = 0.125 * (maxY - minY);
                break;
            }
        }
    }

    return {minY: minY + buff, maxY: maxY - buff};
}


function getCenterCoords(renderer, container) {
    return renderer.viewportToGraph({
        x: container.offsetWidth / 2,
        y: container.offsetHeight / 2
    });
}


function getVisibilityRanges(camera, renderer, container) {
    const {ratio} = camera.getState();
    let {x, y} = getCenterCoords(renderer, container);

    x /= CONTAINER_WIDTH;
    y /= CONTAINER_HEIGHT;

    return {
        minX: x - 0.56 * ratio,
        maxX: x + 0.56 * ratio,
        minY: y - 0.6 * ratio,
        maxY: y + 0.6 * ratio
    }
}


function getVisibleNodes(nodes, visibilityRanges) {
    const {minX, maxX, minY, maxY} = visibilityRanges;
    const visibleNodes = [];

    for (const nodeLayer of nodes) {
        visibleNodes.push([]);

        if (nodeLayer[0].x / CONTAINER_WIDTH < minX || nodeLayer[0].x / CONTAINER_WIDTH > maxX) {
            continue;
        }

        for (const node of nodeLayer) {
            if (node.y / CONTAINER_HEIGHT >= minY && node.y / CONTAINER_HEIGHT <= maxY) {
                visibleNodes[visibleNodes.length - 1].push(node);
            }
        }
    }

    return visibleNodes;
}

// ------------------------------------------------------------

// Get batch count first
function fetchAndDisplayGraph(batch = 0) {
    fetch(`http://127.0.0.1:5000/nn_visualization?batch=${batch}`)
        .then(response => response.json())
        .then(async data => {
            const nodes = getAllNodesByLayers(data.nodes, data.layer_sizes);
            const posInfo = getNeuronsPosInfo(nodes);
            const {neuronLayers, edges} = await groupNeurons(nodes, nodes, data.layer_sizes, batch);
            const graph = new Graph();

            buildGraph(graph, neuronLayers, edges);

            let selectedNode = null;
            let selectedEdgesColors = [];
            let currentVisibleNodes = nodes;

            const container = document.getElementById('sigma-container');
            container.innerHTML = '';

            const renderer = new Sigma(graph, container, {
                minCameraRatio: 0.02,
                maxCameraRatio: 1,
                zIndex: true
            });

            const camera = renderer.getCamera();
            camera.setState({ratio: 1.0});
            camera.on("updated", () => {
                const {x, y, ratio} = camera.getState();
                const {newX, newY} = calculateDynamicBounds(x, y, ratio, posInfo);

                if (newX !== x || newY !== y) {
                    camera.setState({x: newX, y: newY});
                }
            });

            let buildGraphHandler = async function() {
                const visibilityRanges = getVisibilityRanges(camera, renderer, container);
                const visibleNodes = getVisibleNodes(nodes, visibilityRanges);

                if (visibleNodesChanged(visibleNodes, currentVisibleNodes) && anyNodeVisible(visibleNodes)) {
                    const {ratio} = camera.getState();
                    const {neuronLayers, edges} = await groupNeurons(visibleNodes, nodes, data.layer_sizes, batch, ratio);
                    buildGraph(graph, neuronLayers, edges);

                    currentVisibleNodes = visibleNodes;
                    selectedNode = null;
                    selectedEdgesColors = [];
                }
            };

            let debounceTimer;

            renderer.on("upStage", () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    buildGraphHandler();
                }, 500);
            });

            renderer.on("wheelStage", () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    buildGraphHandler();
                }, 500);
            });

            renderer.on("clickNode", ({node}) => {
                if (["dummy1", "dummy2"].includes(node)) {
                    return;
                }

                if (selectedNode != null) {
                    graph.setNodeAttribute(selectedNode, 'color', '#c0c0c0');
                    const pastEdges = graph.edges(selectedNode);
                    
                    for (let i = 0; i < pastEdges.length; i++) {
                        const edge = pastEdges[i];
                        graph.setEdgeAttribute(edge, 'color', selectedEdgesColors[i]);
                        graph.setEdgeAttribute(edge, 'size', 0.5);
                        graph.setEdgeAttribute(edge, 'zIndex', 0);
                    }
                }

                if (selectedNode !== node) {
                    selectedNode = node;
                    selectedEdgesColors = [];

                    const weight = graph.getNodeAttribute(node, 'weight') || 0;
                    const r = Math.round(255 * (1 - weight));
                    const g = Math.round(255 * weight);
                    const b = 0;
                    const color = `rgb(${r},${g},${b})`;
                    graph.setNodeAttribute(node, 'color', color);
                    const edges = graph.edges(node);
                    edges.forEach(edge => {
                        selectedEdgesColors.push(graph.getEdgeAttribute(edge, 'color'));
                    });

                    for (let edge of edges) {
                        const weight = graph.getEdgeAttribute(edge, 'weight') || 0;

                        const r = Math.round(255 * (1 - weight));
                        const g = Math.round(255 * weight);
                        const b = 0;
                        const color = `rgb(${r},${g},${b})`;

                        graph.setEdgeAttribute(edge, 'color', color);
                        graph.setEdgeAttribute(edge, 'size', 1);
                        graph.setEdgeAttribute(edge, 'zIndex', 1);
                    }
                } else {
                    selectedNode = null;
                    selectedEdgesColors = [];
                }
            });
        })
        .catch(error => {
            console.error('Error loading graph data:', error);
        });
}

// UI bindings
window.onload = () => {
    const button = document.createElement('button');
    button.textContent = 'Load Batch';
    button.style.margin = '2px';
    button.id = 'load-btn';

    const select = document.createElement('select');
    select.style.margin = '2px';
    select.id = 'batch-select';

    const controls = document.createElement('div');
    controls.style.margin = '0px 10px';
    controls.appendChild(select);
    controls.appendChild(document.createElement('br'));
    controls.appendChild(button);
    document.body.insertBefore(controls, document.getElementById('sigma-container'));

    // needs to be done after inserting into DOM
    select.style.width = `${button.offsetWidth}px`;

    button.addEventListener('click', () => {
        const batch = parseInt(document.getElementById('batch-select').value);
        fetchAndDisplayGraph(batch);
    });

    // Try batches until fetch fails
    let batch = 0;
    (function detectBatches() {
        fetch(`http://127.0.0.1:5000/nn_visualization?batch=${batch}`)
            .then(res => {
                if (!res.ok) throw new Error("done");
                return res.json();
            })
            .then(data => {

                const hasData = data.activations && Object.keys(data.activations).length > 0 &&
                    data.gradients && Object.keys(data.gradients).length > 0;

                if (!hasData) throw new Error("no more batches");

                const option = document.createElement('option');
                option.value = batch;
                option.textContent = `Batch ${batch}`;
                select.appendChild(option);

                batch++;
                detectBatches();
            })
            .catch(() => {
                if (batch > 0) fetchAndDisplayGraph(0);
            });
    })();
};
