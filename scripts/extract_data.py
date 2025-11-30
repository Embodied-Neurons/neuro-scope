import torch.nn as nn
import json
import os

from models.neural_graph import NeuralGraph


class ActivationTracker:
    def __init__(self, model):
        self.model = model
        self.activations = {}
        self.gradients = {}
        self.handles = []
        self._register_hooks()
        self.activations_idx = 1
        self.gradients_idx = 1


    def _save_activation(self, name):
        def hook(module, input, output):

            self.activations[f"fc{self.activations_idx}.activ"] = output.detach().mean(dim=0).cpu().numpy().tolist()
            self.activations_idx += 1

        return hook


    def _save_gradient(self, name):
        def hook(grad_output):
            if "weight" in name:
                if isinstance(grad_output, tuple):
                    self.gradients[f"fc{self.gradients_idx}.grad"] = grad_output[0].detach().cpu().numpy().tolist()
                else:
                    self.gradients[f"fc{self.gradients_idx}.grad"] = grad_output.detach().cpu().numpy().tolist()
                self.gradients_idx += 1

        return hook


    def _register_hooks(self):
        for name, module in self.model.named_modules():
            if isinstance(module, nn.Linear):
                self.handles.append(module.register_forward_hook(self._save_activation(name)))

        for name, param in self.model.named_parameters():
            self.handles.append(param.register_hook(self._save_gradient(name)))


    def clear(self):
        self.activations.clear()
        self.gradients.clear()
        self.activations_idx=1
        self.gradients_idx=1


    def save_to_json(self, batch_idx, save_dir="outputs"):
        os.makedirs(save_dir, exist_ok=True)

        with open(os.path.join(save_dir, f"batch_{batch_idx}_activations.json"), "w") as fa:
            json.dump(self.activations, fa)
        
        with open(os.path.join(save_dir, f"batch_{batch_idx}_gradients.json"), "w") as fg:
            json.dump(self.gradients, fg)


    def remove_hooks(self):
        for handle in self.handles:
            handle.remove()


def extract_graph_structure(model, save_path="outputs/graph_structure.json"):
    graph = NeuralGraph()
    graph.build_graph(model)

    data = graph.get_data()
    structure = {
        "nodes": [{"label": label} for label in data.node_labels],
        "edges": data.edge_index.t().tolist(),
        "layerSizes": data.layer_sizes
    }

    os.makedirs(os.path.dirname(save_path), exist_ok=True)

    with open(save_path, "w") as f:
        json.dump(structure, f)

    return data
