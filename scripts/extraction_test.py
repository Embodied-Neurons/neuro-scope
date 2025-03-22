from simple_mnist import model
import extract_data as ed


ng = ed.get_model_structure(model)
print(ng.gradients)
print(ng.activations)
#print(ng.nodes)
print(ng.nodes[128].layer)
print(ng.nodes[0].layer)
print(ng.nodes[50].layer)
print(ng.nodes[0].connections)
print(ng.nodes[784].connections)
print(ng.nodes[921].connections)
print(ng.nodes[922].connections)
print(ng.nodes[921].layer)
print(ng.nodes[922].layer)

