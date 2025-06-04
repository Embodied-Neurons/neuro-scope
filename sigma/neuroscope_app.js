// library imports
const Graph = require('graphology');
const Sigma = require('sigma').default;

// graph building functions
const { groupNeurons, buildGraph } = require('./modules/graph_building.js');

// node functions
const { 
    getAllNodesByLayers, 
    getNodesPosInfo, 
    visibleNodesChanged, 
    anyNodeVisible,
    getVisibleNodes
} = require('./modules/node_manipulation.js');

// graph bounds & ranges functions
const { calculateDynamicBounds, getVisibilityRanges } = require('./modules/graph_bounding.js');


// Get batch count first
function fetchAndDisplayGraph(batch = 0) {
    fetch(`http://127.0.0.1:5000/nn_visualization?batch=${batch}`)
        .then(response => response.json())
        .then(async data => {
            const nodes = getAllNodesByLayers(data.nodes, data.layer_sizes);
            const posInfo = getNodesPosInfo(nodes);
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

    // Needs to be done after inserting into DOM
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
