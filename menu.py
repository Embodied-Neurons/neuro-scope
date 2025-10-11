import threading
import subprocess
from time import sleep
import tkinter as tk
from tkinter import filedialog, messagebox
import os
import sys
import signal
import socket


MODEL_PATH_FILE = "model_path.txt"
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join("outputs")
SIGMA_START = "cd sigma && npm start"
PORT = 5000
WIDTH = 400
HEIGHT = 200

if sys.platform == "win32":
    NEW_CONSOLE = subprocess.CREATE_NEW_CONSOLE
    NEW_PROCESS_GROUP = subprocess.CREATE_NEW_PROCESS_GROUP
    SIGMA_TRAIN = "cd sigma && npm run train"
    SIGMA_SERVE = "cd sigma && npm run serve"
elif sys.platform == "linux":
    DEVNULL = subprocess.DEVNULL
    SIGMA_TRAIN = "cd sigma && npm run train-linux"
    SIGMA_SERVE = "cd sigma && npm run serve-linux"


# helper function to determine if server is running
def is_port_open(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        return sock.connect_ex(('localhost', port)) == 0


class MenuApp:
    def __init__(self):
        self.sigma_start = None
        self.overlay = None


    def select_model(self):
        file_path = filedialog.askopenfilename(filetypes=[("Python files", "*.py")])

        if not file_path:
            return
        with open(os.path.join(PROJECT_ROOT, MODEL_PATH_FILE), "w") as f:
            f.write(file_path)
        
        messagebox.showinfo("Model Selected", f"Model path saved:\n{file_path}")
    

    # creating subprocesses depending on a platform
    def create_subprocess(self, command):
        if sys.platform == "win32":
            return subprocess.Popen(
                command,
                cwd=PROJECT_ROOT,
                shell=True,
                creationflags=NEW_CONSOLE | NEW_PROCESS_GROUP
            )
        elif sys.platform == "linux":
            return subprocess.Popen(
                command,
                cwd=PROJECT_ROOT,
                shell=True,
                preexec_fn=os.setsid,
                stdin=DEVNULL,
                stdout=DEVNULL,
                stderr=DEVNULL,
            )
    

    def create_overlay(self, info):
        if self.overlay is None:
            # creating overlay during training/starting server
            self.overlay = tk.Frame(self.root)
            self.overlay.place(x=0, y=0, relwidth=1.0, relheight=1.0)
            self.overlay.lift()

            # adding info text
            label = tk.Label(self.overlay, text=info, font=("Arial", 18))
            label.place(relx=.5, rely=.5, anchor=tk.CENTER)

            # grabbing focus to overlay
            self.root.protocol("WM_DELETE_WINDOW", lambda: None)
            self.overlay.grab_set()
            self.overlay.focus_set()
    

    def destroy_overlay(self):
        if self.overlay is not None:
            try:
                self.overlay.grab_release()
            except Exception:
                pass

            self.overlay.destroy()
            self.root.protocol("WM_DELETE_WINDOW", self.close_app)
            self.overlay = None


    def start_app(self):
        model_file = os.path.join(PROJECT_ROOT, MODEL_PATH_FILE)

        if not os.path.exists(model_file):
            messagebox.showerror("No Model", "Please select a model file before starting the app.")
            return

        try:
            # start training, next stages are performed sequentially
            self.start_training()
        except Exception as e:
            # 'activate' start button and 'disable' stop button in case of failure
            self.destroy_overlay()  
            self.stop_button.pack_forget()
            self.start_button.pack(pady=10)
            self.root.update()

            messagebox.showerror("Error", f"Failed to launch processes:\n{e}")
    

    def start_training(self):
        # check if training is needed
        if not (os.path.exists(OUTPUT_DIR) and any(f.endswith(".json") for f in os.listdir(OUTPUT_DIR))):
            # create overlay with info message
            self.create_overlay("Training in progress...")

            # wait for training to complete
            self.training_subprocess = self.create_subprocess(SIGMA_TRAIN)
            threading.Thread(target=self.training_wait, daemon=True).start()
        else:
            self.start_server()


    def training_wait(self):
        self.training_subprocess.wait()
        self.destroy_overlay()
        self.start_server()


    def start_server(self):
        # it is here to decrease delay caused by 'is_open_port' function
        self.start_button.config(state=tk.DISABLED)
        self.root.update()

        # check if server is running
        if not is_port_open(PORT):
            # create overlay with info message
            self.create_overlay("Starting server...")

            # wait for server to start
            self.create_subprocess(SIGMA_SERVE)
            self.poll_port()
        else:
            self.start_sigma()

    
    def poll_port(self):
        if is_port_open(PORT):
            self.destroy_overlay()
            self.start_sigma()
        else:
            self.root.after(250, self.poll_port)


    def start_sigma(self):
        # launching sigma application in a separate thread for two-way stop
        self.sigma_start = self.create_subprocess(SIGMA_START)
        threading.Thread(target=self.sigma_wait, daemon=True).start()
        self.start_button.pack_forget()
        self.start_button.config(state=tk.NORMAL)
        self.stop_button.pack(pady=10)


    def sigma_wait(self):
        self.sigma_start.wait()
        self.sigma_start = None
        self.stop_app()


    # killing sigma subprocess depending on a platform
    def stop_app(self):
        # 'activate' start button and 'disable' stop button after stopping the app
        self.stop_button.pack_forget()
        self.start_button.pack(pady=10)
        self.root.update()

        try:
            if sys.platform == "win32":                
                if self.sigma_start is not None:
                    subprocess.run(
                        ["taskkill", "/PID", str(self.sigma_start.pid), "/T", "/F"],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                        creationflags=subprocess.CREATE_NO_WINDOW
                    )
                    self.sigma_start = None
            elif sys.platform == "linux":                
                if self.sigma_start is not None: 
                    os.killpg(os.getpgid(self.sigma_start.pid), signal.SIGTERM)
                    self.sigma_start = None
        except Exception as e:
            print(f"Error while closing subprocess: {e}")


    def close_app(self):
        self.stop_app()
        self.root.destroy()


    # blocking window resize in linux
    def on_configure_linux(self, event):
        if event.width != WIDTH or event.height != HEIGHT:
            if getattr(self, "root_after_id", None):
                self.root.after_cancel(self.root_after_id)
            
            self.root_after_id = self.root.after(20, lambda: self.root.geometry(f"{WIDTH}x{HEIGHT}"))


    def build_gui(self):
        self.root = tk.Tk()
        self.root.title("Neuroscope App Menu")

        x = int((self.root.winfo_screenwidth() / 2) - (WIDTH / 2))
        y = int((self.root.winfo_screenheight() / 2) - (HEIGHT / 2))
        self.root.geometry(f"{WIDTH}x{HEIGHT}+{x}+{y}")

        # blocking window resize depending on a platform
        if sys.platform == "win32":
            self.root.resizable(False, False)
        elif sys.platform == "linux":
            self.root.bind("<Configure>", self.on_configure_linux)

        tk.Label(self.root, text="Neuroscope App Menu", font=("Arial", 16)).pack(pady=10)
        tk.Button(self.root, text="Select Model File", command=self.select_model, width=30).pack(pady=10)
        self.start_button = tk.Button(self.root, text="Start Application", command=self.start_app, width=30)
        self.stop_button = tk.Button(self.root, text="Stop Application", command=self.stop_app, width=30)

        # 'activate' start button, 'disable' stop button at the beginning
        self.start_button.pack(pady=10)
        self.stop_button.pack_forget()

        self.root.protocol("WM_DELETE_WINDOW", self.close_app)
        self.root.mainloop()


if __name__ == "__main__":
    app = MenuApp()
    app.build_gui()
