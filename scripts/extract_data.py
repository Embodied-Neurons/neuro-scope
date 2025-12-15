import torch.nn as nn
import numpy as np
import json
import os

from collections import defaultdict
from models.neural_graph import NeuralGraph


class ActivationTracker:
    def __init__(self, model):
        self.model = model
        self.activations = defaultdict(list)
        self.gradients = defaultdict(list)
        self.handles = []
        self._register_hooks()
        self.activations_idx = 0
        self.gradients_idx = 1


    def _save_activation(self):
        def hook(module, input, output):
            self.activations[f"fc{self.activations_idx}.activ"].append(output.detach().mean(dim=0).cpu().numpy().tolist())
            self.activations_idx += 1

        return hook


    def _save_gradient(self, name):
        def hook(grad_output):
            if "weight" in name:
                if isinstance(grad_output, tuple):
                    self.gradients[f"fc{self.gradients_idx}.grad"].append(grad_output[0].detach().cpu().numpy().tolist())
                else:
                    self.gradients[f"fc{self.gradients_idx}.grad"].append(grad_output.detach().cpu().numpy().tolist())
                
                self.gradients_idx += 1

        return hook


    def _register_hooks(self):
        prev_layer = None
        flag = True

        for _, module in self.model.named_modules():
            if isinstance(module, nn.Linear):
                if prev_layer is not None and flag:
                    self.handles.append(prev_layer.register_forward_hook(self._save_activation()))
                    flag = False

                self.handles.append(module.register_forward_hook(self._save_activation()))
            
            prev_layer = module

        for name, param in self.model.named_parameters():
            self.handles.append(param.register_hook(self._save_gradient(name)))


    def clear(self):
        self.activations.clear()
        self.gradients.clear()
        self.reset_after_batch()

    
    def reset_after_batch(self):
        self.activations_idx = 0
        self.gradients_idx = 1


    def save_to_json(self, epoch, save_dir="outputs"):
        for activ_key in self.activations:
            self.activations[activ_key] = np.mean(self.activations[activ_key], axis=0).tolist()

        for grad_key in self.gradients:
            self.gradients[grad_key] = np.sum(self.gradients[grad_key], axis=0).tolist()
        
        os.makedirs(save_dir, exist_ok=True)

        with open(os.path.join(save_dir, f"epoch_{epoch}_activations.json"), "w") as fa:
            json.dump(self.activations, fa)
        
        with open(os.path.join(save_dir, f"epoch_{epoch}_gradients.json"), "w") as fg:
            json.dump(self.gradients, fg)


    def save_test_to_json(self, save_dir="outputs"):
        for activ_key in self.activations:
            self.activations[activ_key] = self.activations[activ_key][0]

        os.makedirs(save_dir, exist_ok=True)

        with open(os.path.join(save_dir, f"test_activations.json"), "w") as fa:
            json.dump(self.activations, fa)


    def remove_hooks(self):
        for handle in self.handles:
            handle.remove()


def extract_graph_structure(model, save_path="outputs/graph_structure.json"):
    graph = NeuralGraph()
    graph.build_graph(model)

    data = graph.get_data()
    structure = {
        "inputSize": data.input_size,
        "layerSizes": data.layer_sizes
    }

    os.makedirs(os.path.dirname(save_path), exist_ok=True)

    with open(save_path, "w") as f:
        json.dump(structure, f)

    return data
