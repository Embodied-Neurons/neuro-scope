import sys
import os
import json
import torch

from scripts.simple_mnist import SimpleNN, train_model, model_path
from scripts.extract_data import extract_graph_structure
from visualization.NeuronLayersInteractive import app, set_neuron_layers



current = os.path.dirname(os.path.realpath(__file__))
parent = os.path.dirname(current)
sys.path.append(parent)


if not os.path.exists(model_path):
    print("Training model and extracting data...")
    train_model()
else:
    print("Model already trained at:", model_path)



graph_path = os.path.join("outputs", "graph_structure.json")
if not os.path.exists(graph_path):
    print("Graph structure not found. Extracting...")
    model = SimpleNN()
    model.load_state_dict(torch.load(model_path))
    extract_graph_structure(model, save_path=graph_path)

with open(graph_path, "r") as f:
    graph_data = json.load(f)

layer_sizes = graph_data["layer_sizes"]
no_neuron_layers = [(size, 1, 0) for size in layer_sizes]
set_neuron_layers(no_neuron_layers)



if __name__ == '__main__':
    app.run(debug=True)
