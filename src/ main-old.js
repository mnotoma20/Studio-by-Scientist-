const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let controlWindow;
let displayWindow;

function createWindows() {
  console.log('🚀 Creating windows...');
  console.log('📁 Current directory:', __dirname);
  
  // Control Window
  controlWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    x: 50,
    y: 50,
    title: 'Studio Control',
    backgroundColor: '#1a1a2e',
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  const controlPath = path.join(__dirname, 'control.html');
  console.log('📄 Loading control from:', controlPath);
  
  controlWindow.loadFile(controlPath).then(() => {
    console.log('✅ Control window loaded!');
    controlWindow.show();
    controlWindow.focus();
    controlWindow.webContents.openDevTools();
  }).catch(err => {
    console.error('❌ Control window error:', err);
  });

  // Display Window
  displayWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    x: 150,
    y: 150,
    title: 'Studio Display',
    backgroundColor: '#000000',
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  const displayPath = path.join(__dirname, 'display.html');
  console.log('📄 Loading display from:', displayPath);
  
  displayWindow.loadFile(displayPath).then(() => {
    console.log('✅ Display window loaded!');
    displayWindow.show();
    displayWindow.webContents.openDevTools();
  }).catch(err => {
    console.error('❌ Display window error:', err);
  });
}

// 🚨 IPC HANDLERS - THIS IS THE IMPORTANT PART!
ipcMain.on('display-verse', (event, verseData) => {
  console.log('📺📺📺 MAIN PROCESS RECEIVED:', verseData);
  console.log('📺 Forwarding to display window...');
  if (displayWindow && displayWindow.webContents) {
    displayWindow.webContents.send('show-verse', verseData);
    console.log('✅ Sent to display window!');
  } else {
    console.error('❌ Display window not available!');
  }
});

ipcMain.on('clear-screen', () => {
  console.log('🧹 Main process: Clearing display');
  if (displayWindow && displayWindow.webContents) {
    displayWindow.webContents.send('clear-display');
  }
});

app.whenReady().then(() => {
  console.log('✅ Electron app is ready!');
  console.log('✅ IPC handlers registered!');
  createWindows();
});

app.on('window-all-closed', () => {
  console.log('🛑 All windows closed');
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindows();
  }
});

console.log('🎬 App starting...');