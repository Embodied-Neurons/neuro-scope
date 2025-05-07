import torch
import torch.nn as nn
import torch.optim as optim
import torchvision
import torchvision.transforms as transforms
from torch.utils.data import DataLoader
import os


from scripts.extract_data import extract_graph_structure, ActivationTracker



transform = transforms.Compose([transforms.ToTensor(), transforms.Normalize((0.5,), (0.5,))])

train_dataset = torchvision.datasets.MNIST(root="../data", train=True, transform=transform, download=True)
test_dataset = torchvision.datasets.MNIST(root="../data", train=False, transform=transform, download=True)

train_loader = DataLoader(train_dataset, batch_size=10000, shuffle=True)
test_loader = DataLoader(test_dataset, batch_size=10000, shuffle=False)



class SimpleNN(nn.Module):
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



model = SimpleNN()
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)




def train_model(num_epochs=2):
    print("🔍 Extracting model structure...")
    extract_graph_structure(model, save_path="outputs/graph_structure.json")

    print("Registering activation and gradient hooks...")
    tracker = ActivationTracker(model)

    for epoch in range(num_epochs):
        total_loss = 0.0
        num_batches = 0

        for batch_idx, (images, labels) in enumerate(train_loader):
            optimizer.zero_grad()
            tracker.clear()

            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            tracker.save_to_json(batch_idx, save_dir="outputs")

            total_loss += loss.item()
            num_batches += 1

        avg_loss = total_loss / num_batches
        print(f"Epoch [{epoch + 1}/{num_epochs}] - Avg Loss: {avg_loss:.4f}")

    tracker.remove_hooks()




model_path = "../data/models/mnist.pt"
if not os.path.exists(model_path):
    print("Training and saving new model...")
    train_model()
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    torch.save(model.state_dict(), model_path)
else:
    print("Found existing model, skipping training.")
