import os
import json
from flask import Flask, jsonify, request
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

from scripts.group_normalizer import normalize_groups_grad, normalize_groups_act
from scripts.neuron_compresser import compress_neuron_layers
from scripts.extract_data import ActivationTracker, extract_graph_structure

MODEL_PATH = os.path.join("..", "data", "models", "mnist.pt")
OUTPUT_DIR = os.path.join("visualization", "outputs")
NUM_BATCHES_TO_SAVE = 100

os.makedirs(OUTPUT_DIR, exist_ok=True)


class NeuralNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.flatten = nn.Flatten()
        self.fc1 = nn.Linear(28 * 28, 128)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(128, 10)

    def forward(self, x):
        x = self.flatten(x)
        x = self.relu(self.fc1(x))
        x = self.fc2(x)
        return x


def train_and_save(num_batches=NUM_BATCHES_TO_SAVE):
    model = NeuralNet()
    tracker = ActivationTracker(model)

    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.5,), (0.5,))
    ])
    train_dataset = datasets.MNIST(root="../data", train=True, transform=transform, download=True)
    train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)

    model.train()
    for batch_idx, (images, labels) in enumerate(train_loader):
        if batch_idx >= num_batches:
            break
        optimizer.zero_grad()
        tracker.clear()

        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        tracker.save_to_json(batch_idx, save_dir=OUTPUT_DIR)

    torch.save(model.state_dict(), MODEL_PATH)
    tracker.remove_hooks()

    extract_graph_structure(model, save_path=os.path.join(OUTPUT_DIR, "graph_structure.json"))


train_and_save()

app = Flask(__name__)


def generate_mlp_layout(layer_sizes):
    layout = []
    max_neurons = max(layer_sizes)
    num_layers = len(layer_sizes)
    width, height = 960, 720
    x_step = width / (num_layers - 1) if num_layers > 1 else 0
    y_step = height / (max_neurons - 1) if max_neurons > 1 else 0

    for layer_idx, size in enumerate(layer_sizes):
        x = layer_idx * x_step
        y_offset = (height - y_step * (size - 1)) / 2
        for i in range(size):
            y = y_offset + i * y_step
            layout.append((x, y))
    return layout


@app.route('/nn_visualization', methods=['GET'])
def graph_data():
    graph_path = os.path.join(OUTPUT_DIR, "graph_structure.json")
    if not os.path.exists(graph_path):
        return jsonify({"error": "Graph structure not found"}), 404
    with open(graph_path, 'r') as f:
        structure = json.load(f)

    batch_id = request.args.get('batch', default=0, type=int)
    act_path = os.path.join(OUTPUT_DIR, f"batch_{batch_id}_activations.json")
    grad_path = os.path.join(OUTPUT_DIR, f"batch_{batch_id}_gradients.json")

    activations = {}
    gradients = {}
    if os.path.exists(act_path) and os.path.exists(grad_path):
        with open(act_path, 'r') as fa:
            activations = json.load(fa)
        with open(grad_path, 'r') as fg:
            gradients = json.load(fg)

    nodes = []
    positions = generate_mlp_layout(structure['layer_sizes'])
    for i, node in enumerate(structure['nodes']):
        x, y = positions[i]
        nodes.append({
            'id': str(i),
            'label': node['label'],
            'x': x,
            'y': y
        })

    edges = []
    for idx, (src, dst) in enumerate(structure['edges']):
        edges.append({
            'id': f"e{idx}",
            'source': str(src),
            'target': str(dst)
        })

    return jsonify({
        'nodes': nodes,
        'edges': edges,
        'activations': activations,
        'gradients': gradients,
        'layer_sizes': structure['layer_sizes'],
        'node_labels': [n['label'] for n in structure['nodes']]
    })


@app.route('/nn_compressed', methods=['GET'])
def nn_compressed():
    batch_id = int(request.args.get('batch'))
    layer_str = str(request.args.get("layers"))
    layer_sizes = list(map(int, layer_str.split(',')))
    layer_count = int(request.args.get('layer_count'))

    act_path = os.path.join(OUTPUT_DIR, f"batch_{batch_id}_activations.json")
    grad_path = os.path.join(OUTPUT_DIR, f"batch_{batch_id}_gradients.json")

    activations = {}
    gradients = {}
    if os.path.exists(act_path) and os.path.exists(grad_path):
        with open(act_path, 'r') as fa:
            activations = json.load(fa)
        with open(grad_path, 'r') as fg:
            gradients = json.load(fg)

    n = len(layer_sizes)
    compressed = compress_neuron_layers(layer_sizes, layer_count)
    grouped_gradients = {}
    for i in range(1, n):
        key = f"fc{i}.weight"
        k = f"fc{i}.grad"
        grouped_gradients[k] = normalize_groups_grad(gradients[key], compressed[i - 1], compressed[i]).tolist()

    last_val = {}
    for key in activations:
        val = len(activations[key][0])
        last_val[val] = key
    grouped_activations = {}
    i = 1
    for key in activations:
        if last_val[len(activations[key][0])] != key:
            continue
        k = f"fc{i}.activ"
        grouped_activations[k] = normalize_groups_act(activations[key], compressed[i]).tolist()
        i += 1
    grouped = {"gradients": grouped_gradients, "activations": grouped_activations}
    return grouped


if __name__ == '__main__':
    app.run(debug=True)
