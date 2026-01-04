import os
import torch
import importlib.util
import sys
import argparse

from extract_data import ActivationTracker, extract_graph_structure
from registry import model_registry, trainer_registry
from contextlib import contextmanager

@contextmanager
def working_directory(path):
    prev = os.getcwd()
    os.chdir(path)
    try:
        yield
    finally:
        os.chdir(prev)


MODEL_PATH_TO_SAVE = "../models/data/saved_models/"
MODEL_PATH_TO_TRAIN = "../models/"
OUTPUT_DIR = "../outputs/"
NUM_EPOCHS = 0


def train_and_save():
    if not os.path.exists(MODEL_PATH_TO_TRAIN):
        raise FileNotFoundError(f"Model file does not exist at: {MODEL_PATH_TO_TRAIN}")

    model_file = os.path.abspath(MODEL_PATH_TO_TRAIN)
    model_dir = os.path.dirname(model_file)

    PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    if PROJECT_ROOT not in sys.path:
        sys.path.insert(0, PROJECT_ROOT)

    # Dynamically load the module
    spec = importlib.util.spec_from_file_location("custom_model", MODEL_PATH_TO_TRAIN)
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
    with working_directory(model_dir):
        trainer_cls.train(dummy_model, tracker, NUM_EPOCHS, OUTPUT_DIR)
    torch.save(dummy_model.state_dict(), MODEL_PATH_TO_SAVE)
    tracker.remove_hooks()
    extract_graph_structure(dummy_model, save_path=os.path.join(OUTPUT_DIR, "graph_structure.json"))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--model-name", required=True, help="Name of the model file"
    )

    parser.add_argument(
        "--output-dir", required=True, help="Path to save epochs and graph structure in json"
    )

    parser.add_argument(
        "--epochs", required=False, type=int, default=10, help="Number of epochs to save"
    )

    args = vars(parser.parse_args())

    MODEL_PATH_TO_SAVE += args['model_name'] + ".pt"
    MODEL_PATH_TO_TRAIN += args["model_name"] + ".py"
    OUTPUT_DIR += args['output_dir']
    NUM_EPOCHS += args['epochs']

    if NUM_EPOCHS <= 0 or NUM_EPOCHS > 100:
        print("Number of epochs should be positive and at most 100. Received:", NUM_EPOCHS)
        exit(0)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    train_and_save()
