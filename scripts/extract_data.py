import torch
import torch.nn as nn
import torch.nn.functional as F
from scripts.neural_graph import NeuralGraph

def save_activation(name, activations):
    def hook(module, input, output):
        activations[name] = output.detach().cpu().numpy()
    return hook

def extract_activation(model, activations):
    for name, module in model.named_modules():
        if isinstance(module, (nn.ReLU, nn.Linear)):
            module.register_forward_hook(save_activation(name, activations))

def save_gradient(name, gradients):
    def hook(grad_output):
        if isinstance(grad_output, tuple):
            gradients[name] = grad_output[0].detach().cpu().numpy()
        else:
            gradients[name] = grad_output.detach().cpu().numpy()
    return hook

def extract_gradients(model, gradients):
    for name, param in model.named_parameters():
        param.register_hook(save_gradient(name, gradients))

def get_model_structure(model):
    graph = NeuralGraph()
    graph.build_graph(model)

    activations = {}
    gradients = {}

    extract_activation(model, activations)
    extract_gradients(model, gradients)

    dummy_input = torch.randn(1, 1, 28, 28)
    dummy_output = model(dummy_input)

    target = torch.tensor([3])
    loss = F.cross_entropy(dummy_output, target)
    loss.backward()

    data = graph.get_data()
    data.activations = activations
    data.gradients = gradients

    return data

if __name__ == '__main__':
    class SimpleNet(nn.Module):
        def __init__(self):
            super(SimpleNet, self).__init__()
            self.fc1 = nn.Linear(28 * 28, 128)
            self.relu = nn.ReLU()
            self.fc2 = nn.Linear(128, 10)

        def forward(self, x):
            x = x.view(x.size(0), -1)
            x = self.fc1(x)
            x = self.relu(x)
            x = self.fc2(x)
            return x

