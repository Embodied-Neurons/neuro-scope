from abc import ABC, abstractmethod
import torch.nn as nn
from scripts.extract_data import ActivationTracker


class NeuralNetInterface(nn.Module, ABC):
    """User's model must subclass this instead of nn.Module."""
    @abstractmethod
    def forward(self, x):
        pass


class TrainerInterface(ABC):
    """User's module must implement this function."""
    @staticmethod
    @abstractmethod
    def train(model: NeuralNetInterface, tracker: ActivationTracker, num_batches: int):
        """
        Trains the given model with the provided tracker and number of batches.
        All outputs must go to the `outputs/` directory.
        """
        pass
