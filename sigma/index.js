const { app, BrowserWindow, screen } = require('electron');

let mainWindow;

function createWindow() {
    const display = screen.getPrimaryDisplay();
    const workArea = display.workArea;

    mainWindow = new BrowserWindow({
        x: workArea.x,
        y: workArea.y,
        width: workArea.width,
        height: workArea.height,
        frame: true,
        resizable: false,
        minimizable: true,
        maximizable: false,
        fullscreenable: false,
        webPreferences: {
            devTools: false,
            // devTools: true,
            nodeIntegration: true,
            contextIsolation: false
        },
    });

    mainWindow.setBounds(workArea);
    mainWindow.loadFile('index.html');
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    if (mainWindow === null) createWindow();
});
