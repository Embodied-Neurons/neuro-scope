import numpy as np


def normalize_groups_grad(neurocons, start_size, end_size):
    """
    Compresses the values of connections to correspond to compressed layer sizes and normalizes 
    them to range 0 - 1., e.g.:
    We got 128x784 neurocons matrix, (8,100,84) start size and (2,100,28) end size,
    it gets compressed to 2x8 matrix, and after that it gets normalized to 0-1 range.
    :param neurocons: Connections between neurons with value corresponding to gradient/activation
    :param start_size: Compressed size of layer that starts the connection
    :param end_size: Compressed size of layer that ends the connection
    :return: Normalized connections between neurons
    """
    row_chunks = _get_chunks(end_size)
    col_chunks = _get_chunks(start_size)

    result = sum_chunks_stats(neurocons, row_chunks, col_chunks)
    return result


def sum_chunks_stats(matrix, row_chunks, col_chunks):
    matrix = np.array(matrix)
    result = []

    row_start = 0
    for i, row_count in enumerate(row_chunks):
        row_end = row_start + row_count
        col_start = 0
        row_data = []

        for j, col_count in enumerate(col_chunks):
            col_end = col_start + col_count
            chunk = matrix[row_start:row_end, col_start:col_end]

            min_val = float(np.min(chunk))
            max_val = float(np.max(chunk))
            mean_val = float(np.mean(chunk))
            normalized = 0

            row_data.append({
                "value": np.sum(chunk),
                "min": min_val,
                "max": max_val,
                "mean": mean_val,
                "normalized": normalized
            })

            col_start = col_end
        result.append(row_data)
        row_start = row_end

    all_values = np.array([[cell["value"] for cell in row] for row in result])
    min_val = np.min(all_values)
    max_val = np.max(all_values)
    norm_values = (all_values - min_val) / (max_val - min_val + 1e-8)

    for i in range(len(result)):
        for j in range(len(result[i])):
            result[i][j]["normalized"] = float(norm_values[i, j])
    return result


def normalize_groups_act(matrix, start_size):
    chunks = _get_chunks(start_size)
    matrix = np.array(matrix)
    col_means = np.mean(matrix, axis=0)

    grouped = []
    index = 0
    for size in chunks:
        group = col_means[index:index + size]
        grouped.append({
            "value": float(np.sum(group)),
            "min": float(np.min(group)),
            "max": float(np.max(group)),
            "mean": float(np.mean(group)),
        })
        index += size

    values = np.array([g["value"] for g in grouped])
    min_val, max_val = np.min(values), np.max(values)
    norm_values = (values - min_val) / (max_val - min_val + 1e-8)

    for g, n in zip(grouped, norm_values):
        g["normalized"] = float(n)
    return grouped


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


def _get_chunks(size):
    if size[0] == 1:
        return [size[1]]
    elif size[2] == 0:
        return [size[1]] * size[0]
    else:
        return [size[1]] * (size[0] - 1) + [size[2]]
