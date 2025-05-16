import numpy as np


def normalize_groups_grad(neurocons, start_size, end_size):
    """
    Compresses the values of connections to correspond to compressed layer sizes and normalizes them to range 0 - 1.,
    e.g.
    We got 128x784 neurocons matrix, (8,100,84) start size and (2,100,28) end size,
    it gets compressed to 2x8 matrix, and after that it gets normalized to 0-1 range.
    :param neurocons: Connections between neurons with value corresponding to gradient/activation
    :param start_size: Compressed size of layer that starts the connection
    :param end_size: Compressed size of layer that ends the connection
    :return: Normalized connections between neurons
    """
    if end_size[0] == 1:
        row_chunks = (end_size[0]) * [end_size[1]]
    else:
        if end_size[2] == 0:
            row_chunks = (end_size[0]) * [end_size[1]]
        else:
            row_chunks = (end_size[0] - 1) * [end_size[1]] + [end_size[2]]
    if start_size[0] == 1:
        col_chunks = (start_size[0]) * [start_size[1]]
    else:
        if start_size[2] == 0:
            col_chunks = (start_size[0]) * [start_size[1]]
        else:
            col_chunks = (start_size[0] - 1) * [start_size[1]] + [start_size[2]]
    result = sum_chunks(neurocons, row_chunks, col_chunks)
    return normalize(result)


def sum_chunks(matrix, row_chunks, col_chunks):
    matrix = np.array(matrix)
    result = np.zeros((len(row_chunks), len(col_chunks)))
    row_start = 0
    for i, row_count in enumerate(row_chunks):
        row_end = row_start + row_count
        col_start = 0
        for j, col_count in enumerate(col_chunks):
            col_end = col_start + col_count
            chunk_sum = np.sum(matrix[row_start:row_end, col_start:col_end])
            result[i, j] = chunk_sum
            col_start = col_end
        row_start = row_end
    return result


def normalize(matrix):
    min_val = np.min(matrix)
    max_val = np.max(matrix)
    return (matrix - min_val) / (max_val - min_val)


def normalize_groups_act(matrix, start_size):
    if start_size[0] == 1:
        chunks = (start_size[0]) * [start_size[1]]
    else:
        if start_size[2] == 0:
            chunks = (start_size[0]) * [start_size[1]]
        else:
            chunks = (start_size[0] - 1) * [start_size[1]] + [start_size[2]]

    matrix = np.array(matrix)
    col_means = np.mean(matrix, axis=0)
    grouped_sums = []
    index = 0
    for size in chunks:
        group_sum = np.sum(col_means[index: index + size])
        grouped_sums.append(group_sum)
        index += size

    grouped_sums = np.array(grouped_sums)
    min_val = grouped_sums.min()
    max_val = grouped_sums.max()
    normalized = (grouped_sums - min_val) / (max_val - min_val+ 1e-8)
    return normalized
