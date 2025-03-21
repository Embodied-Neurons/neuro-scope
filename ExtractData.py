import torch.nn as nn
import torch
import torch.nn.functional as F


gradients = {}
activations = {}


def get_gradients(model):
    gradients.clear()
    extract_gradients(model)

    dummy_input = torch.randn(1, 1, 28, 28)
    dummy_output = model(dummy_input)

    target = torch.tensor([3])
    loss = F.cross_entropy(dummy_output, target)

    loss.backward()

    return gradients


def get_activations(model):
    activations.clear()
    extract_activation(model)

    dummy_input = torch.randn(1, 1, 28, 28)
    model(dummy_input)

    return activations


def get_model_structure(model):
    layers = []
    connections = []
    prev_name = None

    for name, layer in model.named_modules():
        if isinstance(layer, nn.Linear):
            layers.append(name)

            if prev_name is not None:
                connections.append((prev_name, name))

            prev_name = name

    return layers, connections




def save_activation(name):
    def hook(module, input, output):
        activations[name] = output.detach().cpu().numpy()
    return hook


def extract_activation(model):
    for name, module in model.named_modules():
        if isinstance(module, nn.ReLU) or isinstance(module, nn.Linear):
            module.register_forward_hook(save_activation(name))




def save_gradient(name):
    def hook(grad_output):
        gradients[name] = grad_output.detach().cpu().numpy()
    return hook




def extract_gradients(model):
    for name, param in model.named_parameters():
        param.register_hook(save_gradient(name))





