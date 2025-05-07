const Graph = require('graphology');
const Sigma = require('sigma').default;

const MAX_GROUPS = 50;
const CONTAINER_WIDTH = 960;
const CONTAINER_HEIGHT = 720;

function groupNeurons(nodes, layerSizes) {
  const graph = new Graph();
  const maxNeurons = Math.max(...layerSizes);
  const neuronsPerGroup = Math.ceil(maxNeurons / MAX_GROUPS);

  let layerGroups = [];
  let neuronLayers = [];
  let neuronIndex = 0;
  let edges = [];

  for (let size of layerSizes) {
    layerGroups.push(Math.ceil(size / neuronsPerGroup));
  }

  for (let i = 0; i < layerGroups.length; i++) {
    neuronLayers.push([]);

    for (let j = 0; j < layerGroups[i] - 1; j++, neuronIndex += neuronsPerGroup) {
      neuronLayers[neuronLayers.length - 1].push({
        id: nodes[neuronIndex].id,
        x: nodes[neuronIndex].x,
        y: nodes[neuronIndex + 0.5 * neuronsPerGroup].y,
        size: nodes[neuronIndex + 0.5 * neuronsPerGroup].y - nodes[neuronIndex].y
      });
    }

    const mod = layerSizes[i] % neuronsPerGroup;
    if (mod) {
      neuronLayers[neuronLayers.length - 1].push({
        id: nodes[neuronIndex].id,
        x: nodes[neuronIndex].x,
        y: nodes[neuronIndex + 0.5 * mod].y,
        size: nodes[neuronIndex + 0.5 * mod].y - nodes[neuronIndex].y
      });
      neuronIndex += mod;
    } else {
      neuronLayers[neuronLayers.length - 1].push({
        id: nodes[neuronIndex].id,
        x: nodes[neuronIndex].x,
        y: nodes[neuronIndex + 0.5 * neuronsPerGroup].y,
        size: nodes[neuronIndex + 0.5 * neuronsPerGroup].y - nodes[neuronIndex].y
      });
      neuronIndex += neuronsPerGroup;
    }
  }

  for (let i = 0; i < layerGroups.length - 1; i++) {
    const first = neuronLayers[i];
    const second = neuronLayers[i + 1];

    for (let fneuron of first) {
      for (let sneuron of second) {
        edges.push({
          src: fneuron.id,
          tgt: sneuron.id,
          id: 'edge' + '_' + fneuron.id + '-' + sneuron.id
        });
      }
    }
  }

  neuronLayers.forEach(layer => {
    layer.forEach(node => {
      graph.addNode(node.id, {
        x: node.x,
        y: node.y,
        size: node.size,
        color: '#c0c0c0'
      });
    });
  });

  edges.forEach(edge => {
    graph.addEdge(edge.src, edge.tgt, {
      id: edge.id,
      size: 0.5,
      zIndex: 0,
      color: '#2c2c2c'
    });
  });

  let posInfo = [];

  for (const layer of neuronLayers) {
    let flag = true;
    let x, minY, maxY;

    for (const node of layer) {
      if (flag) {
        x = node.x;
        minY = maxY = node.y;
        flag = false;
      } else {
        if (node.y < minY) {
          minY = node.y;
        } else if (node.y > maxY) {
          maxY = node.y;
        }
      }
    }

    posInfo.push({
      x: x / CONTAINER_WIDTH,
      minY: minY / CONTAINER_HEIGHT,
      maxY: maxY / CONTAINER_HEIGHT
    });
  }

  return { graph, posInfo };
}

function calculateDynamicBounds(x, y, ratio, posInfo) {
  let newX = x;
  let { minY, maxY } = findYExtremes(x, 0.05 * ratio, posInfo);
  let newY = Math.max(Math.min(y, maxY), minY);

  if (ratio >= 0.9) {
    if (x + 0.6 * ratio < posInfo[posInfo.length - 1].x) {
      newX = posInfo[posInfo.length - 1].x - 0.55 * ratio;
    } else if (x - 0.6 * ratio > posInfo[0].x) {
      newX = posInfo[0].x + 0.55 * ratio;
    }
  } else if (ratio >= 0.5) {
    if (x + 0.6 * ratio < posInfo[posInfo.length - 2].x) {
      newX = posInfo[posInfo.length - 2].x - 0.55 * ratio;
    } else if (x - 0.6 * ratio > posInfo[1].x) {
      newX = posInfo[1].x + 0.55 * ratio;
    }
  } else {
    if (x + 0.1 * ratio < posInfo[0].x) {
      newX = posInfo[0].x - 0.05 * ratio;
    } else if (x - 0.1 * ratio > posInfo[posInfo.length - 1].x) {
      newX = posInfo[posInfo.length - 1].x + 0.05 * ratio;
    }
  }

  return { newX, newY };
}

function findYExtremes(x, buff, posInfo) {
  let minY, maxY;

  if (x < posInfo[0].x) {
    minY = posInfo[0].minY - buff;
    maxY = posInfo[0].maxY + buff;
    return { minY, maxY };
  } else if (x > posInfo[posInfo.length - 1].x) {
    minY = posInfo[posInfo.length - 1].minY - buff;
    maxY = posInfo[posInfo.length - 1].maxY + buff;
    return { minY, maxY };
  } else {
    for (let i = 0; i < posInfo.length - 1; i++) {
      if (x >= posInfo[i].x && x < posInfo[i + 1].x) {
        const w1 = (x - posInfo[i].x) / (posInfo[i + 1].x - posInfo[i].x);
        const w2 = (posInfo[i + 1].x - x) / (posInfo[i + 1].x - posInfo[i].x);
        minY = w2 * posInfo[i].minY + w1 * posInfo[i + 1].minY + buff;
        maxY = w2 * posInfo[i].maxY + w1 * posInfo[i + 1].maxY - buff;
        return { minY, maxY };
      }
    }
  }
}

// Get batch count first
function fetchAndDisplayGraph(batch = 0) {
  fetch(`http://127.0.0.1:5000/nn_visualization?batch=${batch}`)
    .then(response => response.json())
    .then(data => {
      const { graph, posInfo } = groupNeurons(data.nodes, data.layer_sizes);
      let selectedNode = null;

      const container = document.getElementById('sigma-container');
      container.innerHTML = '';

      const renderer = new Sigma(graph, container, {
        minCameraRatio: 0.08,
        maxCameraRatio: 1,
        zIndex: true
      });

      const camera = renderer.getCamera();
      camera.setState({ ratio: 1.0 });

      camera.on("updated", () => {
        setTimeout(() => {
          const { x, y, ratio } = camera.getState();
          const { newX, newY } = calculateDynamicBounds(x, y, ratio, posInfo);
          if (newX !== x || newY !== y) {
            camera.setState({ x: newX, y: newY });
          }
        }, 100);
      });

      renderer.on("clickNode", ({ node }) => {
        if (selectedNode != null) {
          graph.setNodeAttribute(selectedNode, 'color', '#c0c0c0');
          const pastEdges = graph.edges(selectedNode);
          for (let edge of pastEdges) {
            graph.setEdgeAttribute(edge, 'color', '#2c2c2c');
            graph.setEdgeAttribute(edge, 'size', 0.5);
            graph.setEdgeAttribute(edge, 'zIndex', 0);
          }
        }

        if (selectedNode !== node) {
          selectedNode = node;
          graph.setNodeAttribute(node, 'color', '#b00b8c');
          const edges = graph.edges(node);
          for (let edge of edges) {
            graph.setEdgeAttribute(edge, 'color', '#ec5148');
            graph.setEdgeAttribute(edge, 'size', 1);
            graph.setEdgeAttribute(edge, 'zIndex', 1);
          }
        } else {
          selectedNode = null;
        }
      });
    })
    .catch(error => {
      console.error('Error loading graph data:', error);
    });
}

// UI bindings
window.onload = () => {
  const select = document.createElement('select');
  select.id = 'batch-select';

  const button = document.createElement('button');
  button.textContent = 'Load Batch';
  button.id = 'load-btn';

  const controls = document.createElement('div');
  controls.style.margin = '10px';
  controls.appendChild(select);
  controls.appendChild(button);
  document.body.insertBefore(controls, document.getElementById('sigma-container'));

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
