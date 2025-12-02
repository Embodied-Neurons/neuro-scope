import torch
from torch_geometric.data import Data
import torch.nn as nn


class NeuralGraph:
    def __init__(self):
        self.data = None


    def build_graph(self, model):
        layer_sizes = []
        node_features = []

        first_linear = next((layer for layer in model.modules() if isinstance(layer, nn.Linear)), None)
        
        if first_linear is None:
            raise ValueError("Model must have at least one nn.Linear layer!")
        
        input_size = first_linear.in_features
        node_features.extend([torch.zeros(1) for _ in range(input_size)])
        layer_sizes.append(input_size)

        for _, layer in model.named_modules():
            if isinstance(layer, nn.Linear):
                node_features.extend([torch.zeros(1) for _ in range(layer.out_features)])
                layer_sizes.append(layer.out_features)

        x = torch.stack(node_features, dim=0)
        self.data = Data(x=x)
        self.data.input_size = input_size
        self.data.layer_sizes = layer_sizes


    def get_data(self):
        return self.data
