import os
import torch
import torch.nn as nn
import torch.optim as optim
import torchvision
import torchvision.transforms as transforms
from torch.utils.data import DataLoader

from model_interface import NeuralNetInterface, TrainerInterface
from scripts.extract_data import extract_graph_structure, ActivationTracker
from registry import register_model, register_trainer, register_runner

# changing to main directory if it is not current working directory
if os.getcwd().endswith("models"):
    os.chdir(os.path.join(".."))


@register_model
class SimpleNN(NeuralNetInterface):
    def __init__(self):
        super(SimpleNN, self).__init__()
        self.flatten = nn.Flatten()
        self.fc1 = nn.Linear(28 * 28, 128)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(128, 10)


    def forward(self, x):
        x = self.flatten(x)
        x = self.fc1(x)
        x = self.relu(x)
        x = self.fc2(x)
        return x


@register_trainer
class Trainer(TrainerInterface):
    @staticmethod
    def train(model: NeuralNetInterface, tracker: ActivationTracker, num_epochs: int, output_dir: str):
        transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize((0.5,), (0.5,))
        ])

        train_dataset = torchvision.datasets.MNIST(
            root="./data", train=True, transform=transform, download=True)
        train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)

        criterion = nn.CrossEntropyLoss()
        optimizer = optim.Adam(model.parameters(), lr=0.001)

        print("🔍 Extracting model structure...")
        extract_graph_structure(model, save_path=f"./{output_dir}/graph_structure.json")

        print("📦 Training started...")
        model.train()

        for epoch in range(num_epochs):
            tracker.clear()

            for _, (images, labels) in enumerate(train_loader):
                optimizer.zero_grad()
                outputs = model(images)
                loss = criterion(outputs, labels)
                loss.backward()
                optimizer.step()
                tracker.reset_after_batch()

            tracker.save_to_json(epoch, save_dir=output_dir)

        print(f"✅ Finished training. {num_epochs} epochs processed.")
        tracker.remove_hooks()


@register_runner
def run(model: NeuralNetInterface, tracker: ActivationTracker, input_tensor: torch.Tensor, saved_model_path: str, output_dir: str):
    model.load_state_dict(torch.load(saved_model_path))
    model.eval()

    with torch.no_grad():
        tracker.clear()
        model(input_tensor)
        tracker.save_test_to_json(save_dir=f"{output_dir}")

    print("✅ Finished running the model on the input image.")
    tracker.remove_hooks()
