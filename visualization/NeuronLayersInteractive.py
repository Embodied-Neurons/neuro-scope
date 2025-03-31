from manim import *
import sys
from scripts.neuron_compresser import *


class Neuron(Circle):
    def __init__(self, id, layer_id, **args):
        super().__init__(**args)
        self.id = id
        self.layer_id = layer_id


class NeuronLayersInteractive(Scene):
    def __init__(self, no_neurons_layers, **args):
        super().__init__(**args)
        self.neurons = []
        self.edges = []
        self.current_no_neuron_layer = compress_neuron_layers(no_neurons_layers)
        self.history = []
        self.finished = False

    def construct(self):
        self.create_neural_network()
        self.start()
        self.wait(30, frozen_frame=False)
        sys.exit()

    def create_neural_network(self):
        max_neurons = 10
        radius = 0.25
        buff = 0.35
        y_max = (radius + 0.5 * buff) * (max_neurons - 1)
        x = (len(self.current_no_neuron_layer) - 1) * -1.5
        layer_id = 0
        for no_neurons_layer in self.current_no_neuron_layer:
            offset = (max_neurons - no_neurons_layer[0]) * (radius + 0.5 * buff)
            layer = []

            for i in range(no_neurons_layer[0]):
                neuron = Neuron(i + 1, layer_id, radius=radius, color=WHITE, fill_opacity=0.8)
                neuron.move_to([x, y_max - offset, 0])
                if no_neurons_layer[1] != 1:
                    if i + 1 == no_neurons_layer[0] and no_neurons_layer[2] != 0:
                        label = Text(str(no_neurons_layer[2]), font_size=15, color=RED)
                    else:
                        label = Text(str(no_neurons_layer[1]), font_size=15, color=RED)
                    label.move_to(neuron.get_center())
                    self.add(label)
                offset += radius * 2 + buff
                self.add(neuron)
                layer.append(neuron)

            self.neurons.append(layer)
            x += 3
            layer_id += 1

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

    def zoom_in(self, id, layer_id):

        layer = self.current_no_neuron_layer[layer_id]
        # if we have to compress
        if layer[1] != 1:
            self.history.append(self.current_no_neuron_layer.copy())
            # if this is last neuron in layer
            if id == layer[0]:
                # if last neuron deserves special treatment
                if layer[2] == 0:
                    self.current_no_neuron_layer[layer_id] = compress_neurons(layer[1])
                else:
                    self.current_no_neuron_layer[layer_id] = compress_neurons(layer[2])

            else:
                self.current_no_neuron_layer[layer_id] = compress_neurons(layer[1])
            self.clear()
            self.neurons = []
            self.edges = []
            self.create_neural_network()
            self.finished = False
            self.start()

    def zoom_out(self):
        if len(self.history) != 0:
            self.current_no_neuron_layer = self.history.pop()
            self.clear()
            self.neurons = []
            self.edges = []
            self.create_neural_network()
            self.finished = False
            self.start()

    def on_mouse_press(self, point, button, modifiers):
        if button == "LEFT" and self.finished:
            for layer in self.neurons:
                for neuron in layer:
                    if np.linalg.norm(self.mouse_point.get_center() - neuron.get_center()) < 0.25:
                        self.zoom_in(neuron.id, neuron.layer_id)
        if button == "RIGHT" and self.finished:
            self.zoom_out()


config.window_position = '460,240'
config.pixel_width = 1920
config.pixel_height = 1080
config.frame_width = 16
config.frame_height = 9
config.frame_rate = 60
config.preview = True
