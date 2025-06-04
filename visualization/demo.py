import sys
import os

current = os.path.dirname(os.path.realpath(__file__))
parent = os.path.dirname(current)
sys.path.append(parent)

from scripts.simple_mnist import SimpleNN, model
from scripts import extract_data as ed
import torch
from visualization.NeuronLayersInteractive import app, set_neuron_layers

s_model = SimpleNN()
model_path = os.path.join("..", "data", "models", "mnist.pt")
model.load_state_dict(torch.load(model_path))


ng = ed.get_model_structure(s_model)
layer_sizes = [50] * 50
no_neurons_layers = [(size, 1, 0) for size in layer_sizes]
set_neuron_layers(no_neurons_layers)

if __name__ == '__main__':
    app.run(debug=True)
