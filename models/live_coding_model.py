import os
import torch
from torch import nn, optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
from tqdm import tqdm

from model_interface import NeuralNetInterface, TrainerInterface
from scripts.extract_data import extract_graph_structure, ActivationTracker
from registry import register_model, register_trainer


data_dir = 'data/Jute_Pest_Dataset'
train_dir = os.path.join(data_dir, 'train')
val_dir = os.path.join(data_dir, 'val')
test_dir = os.path.join(data_dir, 'test')

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


@register_model
class SimpleCNN(NeuralNetInterface):
    def __init__(self, num_classes=0):
        super(SimpleCNN, self).__init__()
        self.model = nn.Sequential(
            nn.Conv2d(3, 16, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(16, 32, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Flatten(),
            nn.Linear(64 * 16 * 16, 256), nn.ReLU(),
            nn.Linear(256, num_classes)
        )


    def forward(self, x):
        return self.model(x)


@register_trainer
class Trainer(TrainerInterface):
    @staticmethod
    def train(model: NeuralNetInterface, tracker: ActivationTracker, num_batches: int, epochs=1):
        transform = transforms.Compose([
            transforms.Resize((128, 128)),
            transforms.ToTensor(),
            transforms.Normalize([0.5] * 3, [0.5] * 3)
        ])

        train_dataset = datasets.ImageFolder(train_dir, transform=transform)
        val_dataset = datasets.ImageFolder(val_dir, transform=transform)

        loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
        val_loader = DataLoader(val_dataset, batch_size=32)

        num_classes = len(train_dataset.classes)
        model = SimpleCNN(num_classes).to(device)
        tracker = ActivationTracker(model)

        criterion = nn.CrossEntropyLoss()
        optimizer = optim.Adam(model.parameters(), lr=0.001)

        extract_graph_structure(model, save_path="outputs/graph_structure.json")

        for epoch in range(epochs):
            model.train()
            running_loss = 0.0
            batch_count = 0

            for images, labels in tqdm(loader, desc=f"Epoch {epoch+1}"):
                images, labels = images.to(device), labels.to(device)
                optimizer.zero_grad()

                tracker.clear()

                output = model(images)
                loss = criterion(output, labels)
                loss.backward()
                optimizer.step()
                running_loss += loss.item()

                tracker.save_to_json(batch_count, save_dir="outputs")
                batch_count += 1

            print(f"Epoch {epoch+1}, Loss: {running_loss/len(loader):.4f}")

            model.eval()
            correct = 0
            total = 0

            with torch.no_grad():
                for images, labels in val_loader:
                    images, labels = images.to(device), labels.to(device)
                    outputs = model(images)
                    _, predicted = torch.max(outputs, 1)
                    total += labels.size(0)
                    correct += (predicted == labels).sum().item()
                    
            print(f'Validation Accuracy: {100 * correct / total:.2f}%')

        tracker.remove_hooks()
