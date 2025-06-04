import subprocess
import tkinter as tk
from tkinter import filedialog, messagebox
import os
import sys


MODEL_PATH_FILE = "model_path.txt"
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))

if sys.platform == "win32":
    NEW_CONSOLE = subprocess.CREATE_NEW_CONSOLE
else:
    NEW_CONSOLE = 0


def select_model():
    file_path = filedialog.askopenfilename(filetypes=[("Python files", "*.py")])
    if not file_path:
        return
    with open(os.path.join(PROJECT_ROOT, MODEL_PATH_FILE), "w") as f:
        f.write(file_path)
    messagebox.showinfo("Model Selected", f"Model path saved:\n{file_path}")


def start_app():
    model_file = os.path.join(PROJECT_ROOT, MODEL_PATH_FILE)
    if not os.path.exists(model_file):
        messagebox.showerror("No Model", "Please select a model file before starting the app.")
        return

    try:
        subprocess.Popen(
            "npm run train",
            cwd=PROJECT_ROOT,
            shell=True,
            creationflags=NEW_CONSOLE
        )

        subprocess.Popen(
            "npm run serve",
            cwd=PROJECT_ROOT,
            shell=True,
            creationflags=NEW_CONSOLE
        )

        subprocess.Popen(
            "npm start",
            cwd=PROJECT_ROOT,
            shell=True,
            creationflags=NEW_CONSOLE
        )

    except Exception as e:
        messagebox.showerror("Error", f"Failed to launch processes:\n{e}")


def build_gui():
    root = tk.Tk()
    root.title("Neuroscope App Menu")
    root.geometry("400x200")

    tk.Label(root, text="Neuroscope App Menu", font=("Arial", 16)).pack(pady=10)
    tk.Button(root, text="Select Model File", command=select_model, width=30).pack(pady=10)
    tk.Button(root, text="Start Application", command=start_app, width=30).pack(pady=10)

    root.mainloop()


if __name__ == "__main__":
    build_gui()
