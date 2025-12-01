import torch
from torch_geometric.data import Data
import torch.nn as nn


class NeuralGraph:
    def __init__(self):
        self.data = None


    def build_graph(self, model):
        edge_list = []
        layer_sizes = []
        node_features = []
        node_labels = []
        node_index = 0

        first_linear = next((layer for layer in model.modules() if isinstance(layer, nn.Linear)), None)
        
        if first_linear is None:
            raise ValueError("Model must have at least one nn.Linear layer!")
        
        input_size = first_linear.in_features
        input_nodes = list(range(node_index, node_index + input_size))
        node_index += input_size
        node_labels.extend(["Input"] * input_size)
        node_features.extend([torch.zeros(1) for _ in range(input_size)])
        prev_nodes = input_nodes
        layer_sizes.append(input_size)

        for name, layer in model.named_modules():
            if isinstance(layer, nn.Linear):
                current_nodes = list(range(node_index, node_index + layer.out_features))
                node_index += layer.out_features
                node_labels.extend([name] * layer.out_features)
                node_features.extend([torch.zeros(1) for _ in range(layer.out_features)])
                layer_sizes.append(layer.out_features)

                for src in prev_nodes:
                    for dst in current_nodes:
                        edge_list.append([src, dst])

                prev_nodes = current_nodes

        if edge_list:
            edge_index = torch.tensor(edge_list, dtype=torch.long).t().contiguous()
        else:
            edge_index = torch.empty((2, 0), dtype=torch.long)

        x = torch.stack(node_features, dim=0)
        self.data = Data(x=x, edge_index=edge_index)
        self.data.input_size = input_size
        self.data.node_labels = node_labels
        self.data.layer_sizes = layer_sizes


    def get_data(self):
        return self.data
