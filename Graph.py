


class Node():
    def __init__(self, id, layer):
        self.id = id
        self.layer = layer
        self.connection = []


    def set_connection(self, target):
        self.connection.append(target)




class NeuralGraph():
    def __init__(self):
        self.id = 0
        self.layers = []
        self.nodes = []
        self.edges = []


    def add_node(self, neuron):
        node = Node(self.id, neuron.name)
        self.nodes.append(node)


    def build_graph(self, neurons):

        for neuron in neurons:
            self.add_node(neuron)
