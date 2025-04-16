# neuroscope_app.py
from flask import Flask, jsonify, render_template_string
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from scripts.neural_graph import NeuralGraph
from scripts.extract_data import get_model_structure
import math

# Basic HTML page that includes the container for Sigma and loads neuroscope_app.js.
HTML_PAGE = """
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Neuroscope</title>
  <!-- Load Graphology and Sigma.js from CDN -->
  <script src="https://unpkg.com/graphology@0.23.1/dist/graphology.umd.min.js"></script>
  <script src="https://unpkg.com/sigma@2.3.0/build/sigma.min.js"></script>
  <style>
    #sigma-container {
      width: 100%;
      height: 600px;
      border: 1px solid #ccc;
    }
  </style>
</head>
<body>
  <h1>Neuroscope</h1>
  <div id="sigma-container"></div>
  <!-- Load your custom Sigma.js initialization script -->
  <script src="/static/neuroscope_app.js"></script>
</body>
</html>
"""

app = Flask(__name__)



def generate_spiral_layout(num_nodes, spacing=5.0):
    layout = []
    for i in range(num_nodes):
        angle = 0.1 * i
        x = spacing * angle * math.cos(angle)
        y = spacing * angle * math.sin(angle)
        layout.append((x, y))
    return layout



@app.route('/')
def index():
    # Serve the HTML page.
    return render_template_string(HTML_PAGE)


@app.route('/graph_data.json')
def graph_data():
    class DeepLargeNet(nn.Module):
        def __init__(self, input_size=28*28, hidden_size=200, num_layers=2, output_size=10):
            super(DeepLargeNet, self).__init__()
            self.input_layer = nn.Linear(input_size, hidden_size)
            self.hidden_layers = nn.ModuleList([
                nn.Linear(hidden_size, hidden_size) for _ in range(num_layers)
            ])
            self.output_layer = nn.Linear(hidden_size, output_size)
            self.relu = nn.ReLU()

        def forward(self, x):
            x = x.view(x.size(0), -1)
            x = self.relu(self.input_layer(x))
            for layer in self.hidden_layers:
                x = self.relu(layer(x))
            x = self.output_layer(x)
            return x

    model = DeepLargeNet()
    data = get_model_structure(model)

    activations = {
        k: (v.tolist() if isinstance(v, np.ndarray) else v)
        for k, v in data.activations.items()
    }
    gradients = {
        k: (v.tolist() if isinstance(v, np.ndarray) else v)
        for k, v in data.gradients.items()
    }

    graph_dict = {
        "nodes": [],
        "edges": [],
        "activations": activations,
        "gradients": gradients,
        "node_labels": data.node_labels,
        "layer_sizes": data.layer_sizes,
    }

    positions = generate_spiral_layout(len(data.node_labels))

    for i, label in enumerate(data.node_labels):
        x, y = positions[i]
        graph_dict["nodes"].append({
            "id": str(i),
            "label": label,
            "x": x,
            "y": y,
        })

    if data.edge_index.numel() > 0:
        edge_index = data.edge_index.numpy().T
        for idx, (src, dst) in enumerate(edge_index):
            graph_dict["edges"].append({
                "id": f"e{idx}",
                "source": str(src),
                "target": str(dst),
            })
    return jsonify(graph_dict)



if __name__ == '__main__':
    app.run(debug=True)
