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
SIGMA_START = "cd sigma && npm start"

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
        self.train = None
        self.sigma = None


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


    def start_app(self):
        model_file = os.path.join(PROJECT_ROOT, MODEL_PATH_FILE)

        if not os.path.exists(model_file):
            messagebox.showerror("No Model", "Please select a model file before starting the app.")
            return
        
        # 'disable' start button, 'activate' stop button after starting the server
        self.start_button.pack_forget()
        self.root.update()

        try:
            self.train = self.create_subprocess(SIGMA_TRAIN)

            if not is_port_open(5000):
                # display info message while waiting for the server to start
                info_label = tk.Label(
                    self.root, 
                    text="Waiting for server to start...", 
                    font=("Arial", 14)
                )

                info_label.place(relx=.5, rely=.67, anchor=tk.CENTER)
                self.root.update()
                self.root.after(250, info_label.destroy)
                self.create_subprocess(SIGMA_SERVE)

                while not is_port_open(5000):
                    sleep(0.25)

            # launching sigma application in a separate thread for two-way stop
            self.sigma = self.create_subprocess(SIGMA_START)
            threading.Thread(target=self.sigma_wait, daemon=True).start()
            self.stop_button.pack(pady=10)

        except Exception as e:
            # 'activate' start button and 'disable' stop button in case of failure
            self.stop_button.pack_forget()
            self.start_button.pack(pady=10)

            messagebox.showerror("Error", f"Failed to launch processes:\n{e}")


    def sigma_wait(self):
        self.sigma.wait()
        self.sigma = None
        self.root.after(0, self.stop_app)


    # killing subprocesses depending on a platform
    def stop_app(self):
        # 'activate' start button and 'disable' stop button after stopping the app
        self.stop_button.pack_forget()
        self.start_button.pack(pady=10)
        self.root.update()

        try:
            if sys.platform == "win32":
                if self.train is not None: 
                    subprocess.run(
                        ["taskkill", "/PID", str(self.train.pid), "/T", "/F"],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                        creationflags=subprocess.CREATE_NO_WINDOW
                    )
                    self.train = None
                
                if self.sigma is not None:
                    subprocess.run(
                        ["taskkill", "/PID", str(self.sigma.pid), "/T", "/F"],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                        creationflags=subprocess.CREATE_NO_WINDOW
                    )
                    self.sigma = None
            elif sys.platform == "linux":
                if self.train is not None: 
                    os.killpg(os.getpgid(self.train.pid), signal.SIGTERM)
                    self.train = None
                
                if self.sigma is not None: 
                    os.killpg(os.getpgid(self.sigma.pid), signal.SIGTERM)
                    self.sigma = None
        except Exception as e:
            print(f"Error while closing subprocess: {e}")


    def close_app(self):
        self.stop_app()
        self.root.destroy()


    def build_gui(self):
        self.root = tk.Tk()
        self.root.title("Neuroscope App Menu")
        self.root.geometry("400x200")

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
