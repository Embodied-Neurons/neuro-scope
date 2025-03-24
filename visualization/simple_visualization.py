from manim import *
import random


class NeuronLayersInteractive(Scene):
    def __init__(self, *args):
        super().__init__(*args)
        self.neurons = []
        self.edges = []
        self.no_neurons_layers = [9, 4, 9]
        self.finished = False

    def construct(self):
        self.create_neural_network()
        self.start()
        self.wait(5, frozen_frame=False)

    def create_neural_network(self):
        # todo make it so neurons always fit on screen and are nicely spaced for numbers bigger then 9
        max_neurons = max(self.no_neurons_layers)
        radius = 0.2
        buff = 0.4
        y_max = (radius + 0.4 * buff) * max_neurons
        x = (len(self.no_neurons_layers) - 1) * -1.5

        for no_neurons_layer in self.no_neurons_layers:
            offset = (max_neurons - no_neurons_layer) * (radius + 0.5 * buff)
            layer = []

            for _ in range(no_neurons_layer):
                neuron = Circle(radius=radius, color=WHITE, fill_opacity=0.8)
                neuron.move_to([x, y_max - offset, 0])
                offset += radius * 2 + buff
                self.add(neuron)
                layer.append(neuron)

            self.neurons.append(layer)
            x += 3
            for i in range(len(self.neurons) - 1):
                first_layer = self.neurons[i]
                second_layer = self.neurons[i + 1]

                self.edges.append([])

                for fneuron in first_layer:
                    self.edges[-1].append([])

                    for sneuron in second_layer:
                        self.edges[-1][-1].append(Line(
                            fneuron.point_at_angle(0),
                            sneuron.point_at_angle(PI),
                            buff=0.02,
                            stroke_width=3
                        ))

    def start(self):
        self.play([
            Create(neuron)
            for neuron_layer in self.neurons
            for neuron in neuron_layer
        ])

        self.play([
            Create(edge)
            for edge_layer in self.edges
            for neuron_edges in edge_layer
            for edge in neuron_edges
        ])
        self.finished = True

    def get_layers(self):
        # it should load the neurons tied with summary neuron that was clicked, for now is uses random numbers
        # todo make it so it uses real numbers of neurons
        self.no_neurons_layers = [random.randint(1, 9) for _ in range(3)]

    def on_mouse_press(self, point, button, modifiers):
        if button == "LEFT" and self.finished:
            for layer in self.neurons:
                for neuron in layer:
                    if np.linalg.norm(self.mouse_point.get_center() - neuron.get_center()) < 0.2:
                        self.clear()
                        self.neurons = []
                        self.edges = []
                        self.get_layers()
                        self.create_neural_network()
                        self.finished = False
                        self.start()


config.window_position = '460,240'
