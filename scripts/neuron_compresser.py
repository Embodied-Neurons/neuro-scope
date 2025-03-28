def compress_neuron_layers(no_neuron_layers):
    compressed = []
    for layer_size in no_neuron_layers:
        compressed.append(compress_neurons(layer_size))
    return compressed


def compress_neurons(layer_size):
    if layer_size > 100:
        if layer_size % 100 == 0:
            return (layer_size // 100, 100, 0)
        return (layer_size // 100 + 1, 100, layer_size % 100)
    elif layer_size > 10:
        if layer_size % 10 == 0:
            return (layer_size // 10, 10, 0)
        return (layer_size // 10 + 1, 10, layer_size % 10)
    else:
        return (layer_size, 1, 0)
