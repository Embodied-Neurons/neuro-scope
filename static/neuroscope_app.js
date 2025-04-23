// max neuron groups
const MAX_GROUPS = 50;

function groupNeurons(nodes, layerSizes) {
  const graph = new graphology.Graph();
  const maxNeurons = Math.max(...layerSizes);
  const neuronsPerGroup = Math.ceil(maxNeurons / MAX_GROUPS);

  let layerGroups = [];
  let neuronLayers = [];
  let neuronIndex = 0;
  let edges = [];

  for(let size of layerSizes) {
    layerGroups.push(Math.ceil(size / neuronsPerGroup));
  }

  for(let i = 0; i < layerGroups.length; i++) {
    // new neuron layer
    neuronLayers.push([]);

    for(let j = 0; j < layerGroups[i] - 1; j++, neuronIndex += neuronsPerGroup) {
      neuronLayers[neuronLayers.length - 1].push({
        id: nodes[neuronIndex].id,
        x: nodes[neuronIndex].x,
        y: nodes[neuronIndex + 0.5*neuronsPerGroup].y,
        size: nodes[neuronIndex + 0.5*neuronsPerGroup].y - nodes[neuronIndex].y
      });
    }
    
    const mod = layerSizes[i] % neuronsPerGroup;
    if(mod) {
      neuronLayers[neuronLayers.length - 1].push({
        id: nodes[neuronIndex].id,
        x: nodes[neuronIndex].x,
        y: nodes[neuronIndex + 0.5*mod].y,
        size: nodes[neuronIndex + 0.5*mod].y - nodes[neuronIndex].y
      });
      neuronIndex += mod;
    } else {
      neuronLayers[neuronLayers.length - 1].push({
        id: nodes[neuronIndex].id,
        x: nodes[neuronIndex].x,
        y: nodes[neuronIndex + 0.5*neuronsPerGroup].y,
        size: nodes[neuronIndex + 0.5*neuronsPerGroup].y - nodes[neuronIndex].y
      });
      neuronIndex += neuronsPerGroup;
    }
  }

  for(let i = 0; i < layerGroups.length - 1; i++) {
    const first = neuronLayers[i];
    const second = neuronLayers[i+1];

    for(let fneuron of first) {
      for(let sneuron of second) {
        edges.push({
          src: fneuron.id, 
          tgt: sneuron.id,
          id: 'edge' + '_' + fneuron.id + '-' + sneuron.id
        });    
      }
    }
  }

  // add saved nodes and edges to graph
  neuronLayers.forEach(layer => {
    layer.forEach(node => {
      graph.addNode(node.id, {
        x: node.x,
        y: node.y,
        size: node.size,
        color: '#c0c0c0'
      })
    })
  })

  edges.forEach(edge => {
    graph.addEdge(edge.src, edge.tgt, {
      id: edge.id,
      size: 0.5,
      zIndex: 0,
      color: '#2c2c2c'
    })
  })

  return graph;
}

// Load the graph data
fetch('/nn_visualization')
  .then(response => response.json())
  .then(graphData => {
    console.log('Graph Data:', graphData);

    // Create a new Graphology graph
    const graph = groupNeurons(graphData.nodes, graphData.layer_sizes);
    console.log('Graphology:', graphology);

    let selectedNode = null;

    // Set up Sigma.js renderer
    const container = document.getElementById('sigma-container');
    const renderer = new Sigma(graph, container, {
      minCameraRatio: 0.08, 
      maxCameraRatio: 1.1,
      zIndex: true 
    });
    /*renderer.on("clickEdge", (event) => {
      const edge = event.edge;
      console.log(edge);
      if(highlightedEdge != null) {
        graph.setEdgeAttribute(highlightedEdge, 'color', '#2c2c2c');
      }
      highlightedEdge = edge;
      graph.setEdgeAttribute(edge, 'color', '#c0c0c0');
    });*/

    const camera = renderer.getCamera();
    camera.setState({ratio: 1.0});

    document.addEventListener("mouseup", _ => {
      const { x, y } = camera.getState();
      const newX = Math.max(Math.min(x, 0.9), 0.1);
      const newY = Math.max(Math.min(y, 0.6), 0.4);
      container.style.pointerEvents = "none";
      
      setTimeout(() => {
        container.style.pointerEvents = "auto";
        setTimeout(() => {
          camera.setState({ x: newX, y: newY });
        }, 200);
      }, 200)
    })

    renderer.on("clickNode", ({ node }) => {
      if(selectedNode != null) {
        graph.setNodeAttribute(selectedNode, 'color', '#c0c0c0');
        const pastEdges = graph.edges(selectedNode);
  
        for(let edge of pastEdges) {
          graph.setEdgeAttribute(edge, 'color', '#2c2c2c');
          graph.setEdgeAttribute(edge, 'size', 0.5);
          graph.setEdgeAttribute(edge, 'zIndex', 0);
        }
      }

      if(selectedNode != node) {
        selectedNode = node;
        graph.setNodeAttribute(node, 'color', '#b00b8c');
        const edges = graph.edges(node);

        for(let edge of edges) {
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
