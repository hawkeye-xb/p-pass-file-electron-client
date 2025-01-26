import { app, BrowserWindow } from 'electron';
import path from 'path';
import { ChildProcess, fork } from 'child_process';
import './ipcListeners';
import log from 'electron-log';

const resourcesPath = app.isPackaged
  ? __dirname // path.join(process.resourcesPath) // .../Contents/Resources
  : path.join(__dirname, '..', 'dist'); // 

process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
});

let mainWindow: BrowserWindow | null = null;

// 启动服务器
let serverProcess: ChildProcess; 
const initServerProcess = () => {
  const serverPath = path.join(resourcesPath, 'server', 'index.js');
  serverProcess = fork(serverPath);

  serverProcess.on('message', (message) => {
    console.log('Server message:', message);
  });
  
  serverProcess.on('error', (err) => {
    console.error('Server error:', err);
  });
  
  serverProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error('Server process exited with error code:', code);
    } else {
      console.log('Server process exited normally.');
    }
  });  
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false, // 禁用 Node.js 集成
      contextIsolation: true, // 启用上下文隔离
      preload: path.join(resourcesPath, 'preload.js'), // 加载预加载脚本
    },
  });

  // 加载远端 URL
  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173/'); // 替换为你的远端 URL
  } else {
    mainWindow.loadFile(path.join(resourcesPath, 'ui', 'index.html'));
  }
  // 打开开发者工具（可选）
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  createWindow();
  initServerProcess();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// 监听应用退出事件
app.on('will-quit', () => {
  console.log('Application is quitting, killing server process...');
  serverProcess?.kill(); // 销毁子进程
});
