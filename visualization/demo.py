import sys
import os

current = os.path.dirname(os.path.realpath(__file__))
parent = os.path.dirname(current)
sys.path.append(parent)
from scripts.simple_mnist import SimpleNN, model
from scripts import extract_data as ed
import torch
from visualization.NeuronLayersInteractive import NeuronLayersInteractive

s_model = SimpleNN()
model.load_state_dict(torch.load("../data/models/mnist.pt"))
ng = ed.get_model_structure(s_model)
nl = NeuronLayersInteractive(ng.get_layer_size())
nl.render()
