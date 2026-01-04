from abc import ABC, abstractmethod
import torch.nn as nn
from extract_data import ActivationTracker


class NeuralNetInterface(nn.Module, ABC):
    """User's model must subclass this instead of nn.Module."""
    @abstractmethod
    def forward(self, x):
        pass


class TrainerInterface(ABC):
    """User's module must implement this function."""
    @staticmethod
    @abstractmethod
    def train(model: NeuralNetInterface, tracker: ActivationTracker, num_epochs: int):
        """
        Trains the given model with the provided tracker and number of epochs.
        All outputs must go to the designated outputs directory.
        """
        pass
