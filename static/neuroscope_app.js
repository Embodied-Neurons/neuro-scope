// neuroscope_app.js

// Load the graph data
fetch('/graph_data.json')
  .then(response => response.json())
  .then(graphData => {
    console.log('Graph Data:', graphData);

    // Create a new Graphology graph
    const graph = new graphology.Graph();

    console.log('Graphology:', graphology);


    // Add nodes
    graphData.nodes.forEach(node => {
      graph.addNode(node.id, {
        label: node.label,
        x: node.x,
        y: node.y,
        size: 2,
        color: '#ec5148'
      });
    });

    // Add edges
    graphData.edges.forEach(edge => {
      graph.addEdge(edge.source, edge.target, {
        id: edge.id,
        color: '#c0c0c0'
      });
    });

    // Set up Sigma.js renderer
    const container = document.getElementById('sigma-container');
    const renderer = new Sigma(graph, container);

    // Optional: Fit camera to graph bounds initially
    const camera = renderer.getCamera();
    const bounds = sigma.utils.extent(graph);

    // If bounds are valid, center camera to show full graph
    if (bounds.x && bounds.y) {
      const centerX = (bounds.x[0] + bounds.x[1]) / 2;
      const centerY = (bounds.y[0] + bounds.y[1]) / 2;
      const maxExtent = Math.max(bounds.x[1] - bounds.x[0], bounds.y[1] - bounds.y[0]);

      camera.setState({
        x: centerX,
        y: centerY,
        ratio: 1.5 / Math.sqrt(maxExtent) // Zoom level
      });
    }
  })
  .catch(error => {
    console.error('Error loading graph data:', error);
  });
