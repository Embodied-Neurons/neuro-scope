from simple_mnist import SimpleNN, model
import extract_data as ed
import torch

s_model = SimpleNN()
model.load_state_dict(torch.load("../data/models/mnist.pt"))

ng = ed.get_model_structure(s_model)
print(ng.gradients)
print(ng.activations)
# print(ng.nodes)
print(ng.nodes[128].layer)
print(ng.nodes[0].layer)
print(ng.nodes[50].layer)
print(ng.nodes[0].connections)
print(ng.nodes[784].connections)
print(ng.nodes[921].connections)
print(ng.nodes[922].connections)
print(ng.nodes[921].layer)
print(ng.nodes[922].layer)
