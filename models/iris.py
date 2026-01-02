# models/iris_mlp.py
import os
import torch
import time
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from model_interface import NeuralNetInterface
from scripts.extract_data import extract_graph_structure, ActivationTracker
from registry import register_model, register_trainer, register_runner


@register_model
class IrisMLP(NeuralNetInterface):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(4, 16)
        self.relu1 = nn.ReLU()
        self.fc2 = nn.Linear(16, 8)
        self.relu2 = nn.ReLU()
        self.fc3 = nn.Linear(8, 3)

    def forward(self, x):
        x = self.relu1(self.fc1(x))
        x = self.relu2(self.fc2(x))
        return self.fc3(x)


@register_trainer
class IrisTrainer:
    @staticmethod
    def train(model: NeuralNetInterface, tracker: ActivationTracker,
              num_epochs: int, output_dir: str):

        iris = load_iris()
        X, y = iris.data, iris.target

        scaler = StandardScaler()
        X = scaler.fit_transform(X)

        X_train, _, y_train, _ = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        dataset = TensorDataset(
            torch.tensor(X_train, dtype=torch.float32),
            torch.tensor(y_train, dtype=torch.long)
        )

        loader = DataLoader(dataset, batch_size=64, shuffle=True)

        criterion = nn.CrossEntropyLoss()
        optimizer = optim.Adam(model.parameters(), lr=0.01)

        extract_graph_structure(model, save_path=f"./{output_dir}/graph_structure.json")

        start = time.time()
        model.train()
        for epoch in range(num_epochs):
            if tracker:
                tracker.clear()
            end = time.time()
            print(end - start)
            for x, labels in loader:
                optimizer.zero_grad()
                outputs = model(x)
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
def run(model: NeuralNetInterface, tracker: ActivationTracker,
        input_tensor: torch.Tensor, saved_model_path: str, output_dir: str):

    model.load_state_dict(torch.load(saved_model_path))
    model.eval()

    with torch.no_grad():
        tracker.clear()
        model(input_tensor)
        tracker.save_test_to_json(save_dir=output_dir)

    tracker.remove_hooks()
