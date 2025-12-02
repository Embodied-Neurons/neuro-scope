import os
import importlib.util
import sys
import argparse

from scripts.extract_data import ActivationTracker
from registry import model_registry, runner_registry
from PIL import Image
from torchvision import transforms
from json import load
from math import sqrt


SAVED_MODEL_PATH = "./data/models/"
MODEL_PATH_TO_RUN = "./models/"
OUTPUT_DIR = "./"
IMAGE_PATH = ""


def transform_image_and_run_test():
    with open(f"{OUTPUT_DIR}/graph_structure.json", "r") as f:
        structure = load(f)
        input_size = structure["inputSize"]
        input_size = round(sqrt(input_size))

    if not os.path.exists(IMAGE_PATH):
        raise FileNotFoundError(f"Image file does not exist at: {IMAGE_PATH}")

    input_image = Image.open(IMAGE_PATH).convert("L")
    preprocess = transforms.Compose([
        transforms.Resize((input_size, input_size)),
        transforms.ToTensor()
    ])

    input_tensor = preprocess(input_image)
    input_tensor = input_tensor.unsqueeze(0)

    if not os.path.exists(SAVED_MODEL_PATH):
        raise FileNotFoundError(f"Saved model file does not exist at: {SAVED_MODEL_PATH}")

    if not os.path.exists(MODEL_PATH_TO_RUN):
        raise FileNotFoundError(f"Model file does not exist at: {MODEL_PATH_TO_RUN}")

    # Dynamically load the module
    spec = importlib.util.spec_from_file_location("custom_model", MODEL_PATH_TO_RUN)
    module = importlib.util.module_from_spec(spec)
    sys.modules["custom_model"] = module
    spec.loader.exec_module(module)

    model_cls = model_registry.get("model")
    runner_cls = runner_registry.get("runner")

    if not model_cls:
        raise AttributeError("No model registered. Use @register_model on your NeuralNet class.")
    
    if not runner_cls:
        raise AttributeError("No runner registered. Use @register_runner on the function running the model.")

    print("Running model on the provided input image...")

    dummy_model = model_cls(*[], **{})
    tracker = ActivationTracker(dummy_model)
    runner_cls(dummy_model, tracker, input_tensor, SAVED_MODEL_PATH, OUTPUT_DIR)
    tracker.remove_hooks()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--model-name", required=True, help="Name of the model file"
    )

    parser.add_argument(
        "--output-dir", required=True, help="Path to save batches and graph structure in json"
    )

    parser.add_argument(
        "--image-path", required=True, help="Path to image to be fed into the model"
    )

    args = vars(parser.parse_args())

    SAVED_MODEL_PATH += args['model_name'] + ".pt"
    MODEL_PATH_TO_RUN += args["model_name"] + ".py"
    OUTPUT_DIR += args['output_dir']
    IMAGE_PATH += args['image_path']

    transform_image_and_run_test()
