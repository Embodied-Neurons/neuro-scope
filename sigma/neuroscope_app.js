// library imports
const Graph = require('graphology');
const Sigma = require('sigma').default;

// graph building functions
const {groupNeurons, buildGraph} = require('./modules/graph_building.js');

// node functions
const {
    getAllNodesByLayers,
    getNodesPosInfo,
    visibleNodesChanged,
    anyNodeVisible,
    getVisibleNodes
} = require('./modules/node_manipulation.js');

// graph bounds & ranges functions
const {calculateDynamicBounds, getVisibilityRanges} = require('./modules/graph_bounding.js');


// Get batch count first
function fetchAndDisplayGraph(batch = 0) {
    fetch(`http://127.0.0.1:5000/nn_visualization?batch=${batch}`)
        .then(response => response.json())
        .then(async data => {
            const container = document.getElementById('sigma-container');
            container.innerHTML = '';
            const containerWidth = container.offsetWidth;
            const containerHeight = container.offsetHeight;

            const nodes = getAllNodesByLayers(data.nodes, data.layer_sizes);
            const posInfo = getNodesPosInfo(nodes, containerWidth, containerHeight);
            const {neuronLayers, edges} = await groupNeurons(nodes, nodes, containerHeight, data.layer_sizes, batch);
            const graph = new Graph();

            buildGraph(graph, containerWidth, containerHeight, neuronLayers, edges);

            let selectedNode = null;
            let selectedEdgesColors = [];
            let currentVisibleNodes = nodes;

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

            let buildGraphHandler = async function () {
                const visibilityRanges = getVisibilityRanges(camera, renderer, container);
                const visibleNodes = getVisibleNodes(nodes, containerWidth, containerHeight, visibilityRanges);

                if (visibleNodesChanged(visibleNodes, currentVisibleNodes) && anyNodeVisible(visibleNodes)) {
                    const {ratio} = camera.getState();
                    const {
                        neuronLayers,
                        edges
                    } = await groupNeurons(visibleNodes, nodes, containerHeight, data.layer_sizes, batch, ratio);
                    buildGraph(graph, containerWidth, containerHeight, neuronLayers, edges);

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
                const detailsPanel = document.getElementById("details-content");

                if (selectedNode != null) {
                    graph.setNodeAttribute(selectedNode, "color", "#c0c0c0");
                    const pastEdges = graph.edges(selectedNode);
                    for (let i = 0; i < pastEdges.length; i++) {
                        const edge = pastEdges[i];
                        graph.setEdgeAttribute(edge, "color", selectedEdgesColors[i]);
                        graph.setEdgeAttribute(edge, "size", 0.5);
                        graph.setEdgeAttribute(edge, "zIndex", 0);
                    }
                }

                if (selectedNode !== node) {
                    selectedNode = node;
                    selectedEdgesColors = [];

                    const nodeData = graph.getNodeAttributes(node);
                    const {x, y, size, color, weight, activation, mean, min, max,} = nodeData;

                    const highlightColor = `rgb(${Math.round(255 * (1 - (weight || 0)))}, ${Math.round(255 * (weight || 0))}, 0)`;
                    graph.setNodeAttribute(node, "color", highlightColor);

                    const connectedEdges = graph.edges(node);

                    connectedEdges.forEach(edge => {
                        selectedEdgesColors.push(graph.getEdgeAttribute(edge, "color"));
                    });

                    const edgeStats = [];

                    connectedEdges.forEach(edge => {
                        const attrs = graph.getEdgeAttributes(edge);
                        const w = attrs.weight || 0;
                        const gradMean = attrs.gradMean ?? "—";
                        const gradMin = attrs.gradMin ?? "—";
                        const gradMax = attrs.gradMax ?? "—";

                        const color = `rgb(${Math.round(255 * (1 - w))}, ${Math.round(255 * w)}, 0)`;

                        graph.setEdgeAttribute(edge, "color", color);
                        graph.setEdgeAttribute(edge, "size", 1.5);
                        graph.setEdgeAttribute(edge, "zIndex", 2);

                        edgeStats.push({
                            id: attrs.id,
                            weight: w.toFixed(3),
                            gradMean: gradMean.toFixed ? gradMean.toFixed(3) : gradMean,
                            gradMin: gradMin.toFixed ? gradMin.toFixed(3) : gradMin,
                            gradMax: gradMax.toFixed ? gradMax.toFixed(3) : gradMax
                        });
                    });


                    detailsPanel.innerHTML = `
      <h2 style="margin-top:0;">Neuron ${node}</h2>
      <table>
        <tr><td><b>ID:</b></td><td>${node}</td></tr>
        <tr><td><b>X:</b></td><td>${x.toFixed(2)}</td></tr>
        <tr><td><b>Y:</b></td><td>${y.toFixed(2)}</td></tr>
        <tr><td><b>Size:</b></td><td>${size}</td></tr>
        <tr><td><b>Activation (norm):</b></td><td>${(weight ?? 0).toFixed(3)}</td></tr>
        <tr><td><b>Mean:</b></td><td>${(mean ?? 0).toFixed(3)}</td></tr>
        <tr><td><b>Min:</b></td><td>${(min ?? 0).toFixed(3)}</td></tr>
        <tr><td><b>Max:</b></td><td>${(max ?? 0).toFixed(3)}</td></tr>
      </table>
      <h3>Connected Edges (${edgeStats.length})</h3>
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:1px solid #ccc;">
            <th align="left">Edge ID</th>
            <th align="left">Weight</th>
            <th align="left">Mean</th>
            <th align="left">Min</th>
            <th align="left">Max</th>
          </tr>
        </thead>
        <tbody>
          ${edgeStats
                        .map(
                            e => `
              <tr>
                <td>${e.id}</td>
                <td>${e.weight}</td>
                <td>${e.gradMean}</td>
                <td>${e.gradMin}</td>
                <td>${e.gradMax}</td>
              </tr>`
                        )
                        .join("")}
        </tbody>
      </table>
    `;
                } else {
                    selectedNode = null;
                    selectedEdgesColors = [];
                    detailsPanel.innerHTML = `<p>Select a neuron to see details.</p>`;
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
    document.getElementById('batch-panel').appendChild(controls);

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
                if (batch > 0) {
                    alert(`All ${batch} batches detected.`);
                }
            });
    })();
};
