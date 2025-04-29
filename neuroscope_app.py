from flask import Flask, jsonify
from scripts.extract_data import get_model_structure
import torch.nn as nn
import numpy as np

app = Flask(__name__)


def generate_mlp_layout(input_size, hidden_sizes, output_size):
    layout = []
    max_neurons = max([input_size, output_size] + hidden_sizes)
    num_layers = len(hidden_sizes) + 1
    
	# assuming height=720 and width=960 (as in HTML string)
    x_start, y_start = 0, 0
    x_move, y_move = 960 / num_layers, 720 / (max_neurons - 1)

	# input layer positions
    y_offset = y_move * (max_neurons - input_size) / 2

    for i in range(input_size):
        y = y_start + y_offset + y_move * i
        layout.append((x_start, y))
        
	# hidden layers positions
    for i in range(len(hidden_sizes)):
        y_offset = y_move * (max_neurons - hidden_sizes[i]) / 2
        x = x_start + (i+1) * x_move

        for j in range(hidden_sizes[i]):
            y = y_start + y_offset + y_move * j
            layout.append((x, y))
            
	# output layer positions
    y_offset = y_move * (max_neurons - output_size) / 2
    x = x_start + num_layers * x_move

    for i in range(output_size):
        y = y_start + y_offset + y_move * i
        layout.append((x, y))

    return layout


@app.route('/nn_visualization', methods=['GET'])
def graph_data():
    class NeuralNet(nn.Module):
        def __init__(self, input_size, hidden_sizes, output_size):
            super(NeuralNet, self).__init__()
            self.input_layer = nn.Linear(input_size, hidden_sizes[0])
            self.hidden_layers = nn.ModuleList([
                nn.Linear(hidden_sizes[i], hidden_sizes[i+1]) 
                for i in range(len(hidden_sizes) - 1)
            ])
            self.output_layer = nn.Linear(hidden_sizes[-1], output_size)
            self.relu = nn.ReLU()

        def forward(self, x):
            x = x.view(x.size(0), -1)
            x = self.relu(self.input_layer(x))
            for layer in self.hidden_layers:
                x = self.relu(layer(x))
            x = self.output_layer(x)
            return x

	# sizes of respective neuron layers
    input_size = 784
    hidden_sizes = [128]
    output_size = 10

    model = NeuralNet(input_size, hidden_sizes, output_size)
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

    positions = generate_mlp_layout(input_size, hidden_sizes, output_size)

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


app.run(debug=True)
