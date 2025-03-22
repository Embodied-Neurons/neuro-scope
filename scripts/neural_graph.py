import torch.nn as nn


class Node:
    def __init__(self, node_id, layer_name, layer_id):
        self.id = node_id
        self.layer = layer_name
        self.layer_id = layer_id
        self.connections = []

    def add_connection(self, target):
        self.connections.append(target)


class NeuralGraph:
    def __init__(self):
        self.nodes = []
        self.node_dict = {}
        self.activations = {}
        self.gradients = {}

    def add_node(self, layer_name, layer_id):
        node_id = len(self.nodes)
        node = Node(node_id, layer_name, layer_id)
        self.nodes.append(node)
        self.node_dict[node_id] = node
        return node_id

    def add_edge(self, from_node, to_node):
        if from_node in self.node_dict and to_node in self.node_dict:
            self.node_dict[from_node].add_connection(to_node)
            #self.node_dict[to_node].add_connection(from_node)

    def build_graph(self, model):
        prev_neurons = []
        layer_counter = 0

        first_linear = next((layer for layer in model.modules() if isinstance(layer, nn.Linear)), None)
        if first_linear:
            input_size = first_linear.in_features
        else:
            raise ValueError("Model must have at least one nn.Linear layer!")

        input_neurons = []
        for i in range(input_size):
            neuron_id = self.add_node("Input", layer_counter)
            input_neurons.append(neuron_id)

        prev_neurons = input_neurons
        layer_counter += 1

        for name, layer in model.named_modules():
            if isinstance(layer, nn.Linear):
                current_neurons = []

                for i in range(layer.out_features):
                    neuron_id = self.add_node(name, layer_counter)
                    current_neurons.append(neuron_id)

                    for prev_neuron in prev_neurons:
                        self.add_edge(prev_neuron, neuron_id)

                prev_neurons = current_neurons
                layer_counter += 1

        output_neurons = []
        for i in range(len(prev_neurons)):
            neuron_id = self.add_node("Output", layer_counter)
            output_neurons.append(neuron_id)

            for prev_neuron in prev_neurons:
                self.add_edge(prev_neuron, neuron_id)

    def get_structure(self):
        return [(node.id, node.layer, node.layer_id, node.connections) for node in self.nodes]
