import os
import time
import torch
import torch.nn as nn
import torch.optim as optim
import torchvision
import torchvision.transforms as transforms
from torch.utils.data import DataLoader

from model_interface import NeuralNetInterface
from scripts.extract_data import extract_graph_structure, ActivationTracker
from registry import register_model, register_trainer, register_runner


@register_model
class FashionMLP(NeuralNetInterface):
    def __init__(self):
        super().__init__()
        self.flatten = nn.Flatten()
        self.fc1 = nn.Linear(28 * 28, 256)
        self.relu1 = nn.ReLU()
        self.fc2 = nn.Linear(256, 128)
        self.relu2 = nn.ReLU()
        self.fc3 = nn.Linear(128, 10)

    def forward(self, x):
        x = self.flatten(x)
        x = self.relu1(self.fc1(x))
        x = self.relu2(self.fc2(x))
        return self.fc3(x)


@register_trainer
class FashionTrainer:
    @staticmethod
    def train(model: NeuralNetInterface, tracker: ActivationTracker,
              num_epochs: int, output_dir: str):

        transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize((0.5,), (0.5,))
        ])

        dataset = torchvision.datasets.FashionMNIST(
            root="./data", train=True, transform=transform, download=True
        )

        loader = DataLoader(dataset, batch_size=256, shuffle=True)

        criterion = nn.CrossEntropyLoss()
        optimizer = optim.Adam(model.parameters(), lr=0.001)

        extract_graph_structure(model, save_path=f"./{output_dir}/graph_structure.json")

        start = time.time()
        model.train()
        for epoch in range(num_epochs):
            if tracker:
                tracker.clear()
            end = time.time()
            print(end - start)
            for images, labels in loader:
                optimizer.zero_grad()
                outputs = model(images)
                loss = criterion(outputs, labels)
                loss.backward()
                optimizer.step()
                if tracker:
                    tracker.reset_after_batch()

            if tracker:
                tracker.save_to_json(epoch, save_dir=output_dir)

        if tracker:
            tracker.remove_hooks()


@register_runner
def run(model: NeuralNetInterface,
        tracker: ActivationTracker,
        input_tensor: torch.Tensor,
        saved_model_path: str,
        output_dir: str):

    model.load_state_dict(torch.load(saved_model_path))
    model.eval()

    with torch.no_grad():
        tracker.clear()
        model(input_tensor)
        tracker.save_test_to_json(save_dir=output_dir)

    print("Finished running Fashion-MNIST MLP on input image.")
    tracker.remove_hooks()