from manim import *
import random

# simple class
class NeuronLayer(Scene):
    def construct(self):
        no_neurons = 8
        neurons = []

        for _ in range(no_neurons):
            neuron = Circle(radius=0.25)
            neuron.move_to([0, 2.5, 0])
            neuron.set_fill(PINK, opacity=0.5)

            if neurons:
                neuron.next_to(neurons[-1], DOWN, buff=0.2)

            neurons.append(neuron)
        
        self.play([Create(neuron) for neuron in neurons])

# let's do more layers
class NeuronLayers(Scene):
    def construct(self):
        # number of neurons in each layer
        no_neurons_layers = [4, 8, 8, 2]

        # simply max(no_neurons_layers)
        max_neurons = 8

        # radius of a neuron
        radius = 0.25

        # buffer between neurons
        buff = 0.3

        # top y coordinate (works for this example)
        y_max = (radius + 0.5 * buff) * max_neurons

        # x coordinate (works for this example)
        x = (len(no_neurons_layers) - 1) * -1.5

        # neurons stored here
        neurons = []

        # adding neurons
        for no_neurons_layer in no_neurons_layers:
            # offset for top neuron
            offset = (max_neurons - no_neurons_layer) * (radius + 0.5 * buff)

            # new neuron layer
            neurons.append([])

            for _ in range(no_neurons_layer):
                neuron = Circle(radius=radius)
                neuron.set_fill(PINK, opacity=0.5)

                # if first neuron in a layer
                if not neurons[-1]:
                    neuron.move_to([x, y_max - offset, 0])
                else: # otherwise relative position
                    neuron.next_to(neurons[-1][-1], DOWN, buff=buff)

                neurons[-1].append(neuron)

            # update x coordinate
            x += 3

        # edges stored here
        edges = []

        # adding edges
        for i in range(len(neurons) - 1):
            first_layer = neurons[i]
            second_layer = neurons[i+1]

            # new edges between neuron layers
            edges.append([])

            for fneuron in first_layer:
                # edges from fneuron to all neurons in second layer
                edges[-1].append([])

                for sneuron in second_layer:
                    edges[-1][-1].append(Line(
                        fneuron.point_at_angle(0), 
                        sneuron.point_at_angle(PI), 
                        buff=0.02, 
                        stroke_width = 3
                    ))
        
        # putting neurons on a scene
        self.play([
            Create(neuron) 
            for neuron_layer in neurons 
            for neuron in neuron_layer
        ])

        # edges as well
        self.play([
            Create(edge) 
            for edge_layer in edges 
            for neuron_edges in edge_layer 
            for edge in neuron_edges
        ])

        # let's mark some random neurons and edges
        for i, edge_layer in enumerate(edges):
            neuron_idx = random.randint(0, len(edge_layer) - 1)

            # mark corresponding neuron first
            self.play(neurons[i][neuron_idx].animate.set_fill(YELLOW, opacity=0.5))

            # moving marked edges to the foreground
            for edge in edge_layer[neuron_idx]:
                edge.set_z_index(1)

            # so that animations happen simultaneously
            self.play([
                ApplyFunction(self.animate_edge, edge) 
                for edge in edge_layer[neuron_idx]
            ])

        self.wait(0.5)

    # helper function - otherwise only last animation counts
    def animate_edge(self, edge):
        edge.set_color(GREEN)
        edge.set_stroke_width(6)

        # return modified object
        return edge
