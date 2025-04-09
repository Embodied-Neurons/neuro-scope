def compress_neuron_layers(no_neuron_layers):
    compressed = []
    for layer_size in no_neuron_layers:
        compressed.append(compress_neurons(layer_size))
    return compressed


def compress_neurons(layer_size):
    '''
    Compresses a neuron layer size to format used in code
    number of neurons -> (number of compressed neurons,
    neurons in each compressed neuron except last one,
    neurons in last compressed neuron)
    e.g. 128 -> (2,100,28)
    :param layer_size: Number of neurons in each layer
    :return: Compressed number of neurons in each layer
    '''

    mag = 1
    while True:
        if layer_size <= mag * 10:
            break
        mag *= 10
    if mag == 1:
        return (layer_size, 1, 0)
    if layer_size % mag == 0:
        return (layer_size // mag, mag, 0)
    return (layer_size // mag + 1, mag, layer_size % mag)
