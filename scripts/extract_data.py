import torch.nn as nn
import torch
import torch.nn.functional as F
from neural_graph import NeuralGraph


def get_model_structure(model):
    graph = NeuralGraph()

    graph.build_graph(model)

    extract_activation(model, graph)
    extract_gradients(model, graph)

    dummy_input = torch.randn(1, 1, 28, 28)
    dummy_output = model(dummy_input)

    target = torch.tensor([3])
    loss = F.cross_entropy(dummy_output, target)

    loss.backward()

    return graph


def save_activation(name, graph):
    def hook(module, input, output):
        graph.activations[name] = output.detach().cpu().numpy()

    return hook


def extract_activation(model, graph):
    for name, module in model.named_modules():
        if isinstance(module, nn.ReLU) or isinstance(module, nn.Linear):
            module.register_forward_hook(save_activation(name, graph))


def save_gradient(name, graph):
    def hook(grad_output):
        graph.gradients[name] = grad_output.detach().cpu().numpy()

    return hook


def extract_gradients(model, graph):
    for name, param in model.named_parameters():
        param.register_hook(save_gradient(name, graph))
