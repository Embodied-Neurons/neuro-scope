def compress_neuron_layers(no_neuron_layers, group_size):
    compressed = []
    for layer_size in no_neuron_layers:
        compressed.append(compress_neurons(layer_size, group_size))
    return compressed


def compress_neurons(layer_size, group_size):
    if layer_size % group_size == 0:
        return (layer_size // group_size, group_size, 0)
    if layer_size < group_size:
        return (1, layer_size, 0)
    return (layer_size // group_size + 1, group_size, layer_size % group_size)
