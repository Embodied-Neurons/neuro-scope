import os
import torch
from torch import nn, optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
from tqdm import tqdm

from model_interface import NeuralNetInterface, TrainerInterface
from scripts.extract_data import extract_graph_structure, ActivationTracker
from registry import register_model, register_trainer

# changing to main directory if it is not current working directory
if os.getcwd().endswith("models"):
    os.chdir(os.path.join(".."))


data_dir = './data/Jute_Pest_Dataset'
train_dir = os.path.join(data_dir, 'train')
val_dir = os.path.join(data_dir, 'val')
test_dir = os.path.join(data_dir, 'test')
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


@register_model
class SimpleCNN(NeuralNetInterface):
    def __init__(self, num_classes=17):
        super(SimpleCNN, self).__init__()
        self.flatten = nn.Flatten()
        self.fc1 = nn.Linear(32 * 32 * 3, 160)
        self.relu1 = nn.ReLU()
        self.fc2 = nn.Linear(160, 48)
        self.relu2 = nn.ReLU()
        self.fc3 = nn.Linear(48, num_classes)
    

    def forward(self, x):
        x = self.flatten(x)
        x = self.fc1(x)
        x = self.relu1(x)
        x = self.fc2(x)
        x = self.relu2(x)
        x = self.fc3(x)
        return x


@register_trainer
class Trainer(TrainerInterface):
    @staticmethod
    def train(model: NeuralNetInterface, tracker: ActivationTracker, num_batches: int, output_dir: str, epochs=5):
        transform = transforms.Compose([
            transforms.Resize((32, 32)),
            transforms.ToTensor(),
            transforms.Normalize([0.5] * 3, [0.5] * 3)
        ])

        train_dataset = datasets.ImageFolder(train_dir, transform=transform)
        val_dataset = datasets.ImageFolder(val_dir, transform=transform)

        loader = DataLoader(train_dataset, batch_size=64, shuffle=True)
        val_loader = DataLoader(val_dataset, batch_size=64)

        num_classes = len(train_dataset.classes)
        model = SimpleCNN(num_classes).to(device)
        tracker = ActivationTracker(model)

        criterion = nn.CrossEntropyLoss()
        optimizer = optim.Adam(model.parameters(), lr=0.001)

        extract_graph_structure(model, save_path=f"./{output_dir}/graph_structure.json")
        total_batch_count = 0

        for epoch in range(epochs):
            model.train()
            running_loss = 0.0
            
            if total_batch_count >= num_batches:
                break
                
            for images, labels in tqdm(loader, desc=f"Epoch {epoch+1}"):
                if total_batch_count >= num_batches:
                    break

                images, labels = images.to(device), labels.to(device)
                optimizer.zero_grad()

                tracker.clear()

                output = model(images)
                loss = criterion(output, labels)
                loss.backward()
                optimizer.step()
                running_loss += loss.item()

                tracker.save_to_json(total_batch_count, save_dir=f"{output_dir}")
                total_batch_count += 1

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
