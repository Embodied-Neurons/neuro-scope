import os
import json
from flask import Flask, jsonify, request
import torch
import importlib.util
import sys

from scripts.group_normalizer import normalize_groups_grad, normalize_groups_act
from scripts.neuron_compresser import compress_neuron_layers
from scripts.extract_data import ActivationTracker, extract_graph_structure
from registry import model_registry, trainer_registry


MODEL_PATH = os.path.join("data", "models", "mnist.pt")
OUTPUT_DIR = os.path.join("outputs")
NUM_BATCHES_TO_SAVE = 100

os.makedirs(OUTPUT_DIR, exist_ok=True)


def load_user_model():
    model_path_file = "model_path.txt"
    if not os.path.exists(model_path_file):
        raise FileNotFoundError("No model_path.txt found. Please select a model using the menu.")

    with open(model_path_file, "r") as f:
        full_model_path = f.read().strip()

    if not os.path.exists(full_model_path):
        raise FileNotFoundError(f"Model file does not exist at:\n{full_model_path}")

    spec = importlib.util.spec_from_file_location("custom_model", full_model_path)
    module = importlib.util.module_from_spec(spec)
    sys.modules["custom_model"] = module
    spec.loader.exec_module(module)

    model_cls = model_registry.get("model")
    if not model_cls:
        raise AttributeError("No model registered. Use @register_model on your NeuralNet class.")

    return model_cls()


def train_and_save(num_batches=NUM_BATCHES_TO_SAVE):
    if os.path.exists(OUTPUT_DIR) and any(
            f.endswith(".json") for f in os.listdir(OUTPUT_DIR)):
        print("[INFO] Outputs already exist. Skipping training.")
        return

    model_path_file = "model_path.txt"
    if not os.path.exists(model_path_file):
        raise FileNotFoundError("No model_path.txt found. Please select a model using the menu.")

    with open(model_path_file, "r") as f:
        full_model_path = f.read().strip()

    if not os.path.exists(full_model_path):
        raise FileNotFoundError(f"Model file does not exist at:\n{full_model_path}")

    # Dynamically load the module
    spec = importlib.util.spec_from_file_location("custom_model", full_model_path)
    module = importlib.util.module_from_spec(spec)
    sys.modules["custom_model"] = module
    spec.loader.exec_module(module)

    model_cls = model_registry.get("model")
    trainer_cls = trainer_registry.get("trainer")

    if not model_cls:
        raise AttributeError("No model registered. Use @register_model on your NeuralNet class.")
    if not trainer_cls:
        raise AttributeError("No trainer registered. Use @register_trainer on your Trainer class.")

    print("Running user-defined training function...")

    dummy_model = model_cls(*[], **{})
    tracker = ActivationTracker(dummy_model)

    trainer_cls.train(dummy_model, tracker, num_batches)

    torch.save(dummy_model.state_dict(), MODEL_PATH)
    tracker.remove_hooks()
    extract_graph_structure(dummy_model, save_path=os.path.join(OUTPUT_DIR, "graph_structure.json"))


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


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--train", action="store_true",
        help="Train the model and exit"
    )

    parser.add_argument(
        "--serve", action="store_true",
        help="Run the Flask server"
    )

    args = parser.parse_args()

    if args.train:
        train_and_save()
        sys.exit(0)

    if args.serve:
        app.run(debug=True)

    train_and_save()
    app.run(debug=True)
