import { app, BrowserWindow } from 'electron';
import path from 'path';
import { ChildProcess, fork } from 'child_process';
import './ipcListeners';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import isDev from 'electron-is-dev';

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
  serverProcess = fork(serverPath, {
    env: {
      ...process.env,
      ELECTRON_CACHE_PATH: app.getPath('userData'), // 缓存路径
    }
  });

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

// 检查更新功能
const checkForUpdates = () => {
  if (isDev) {
    log.info('Running in development mode, skipping auto-update check');
    return;
  }

  log.info('Checking for updates...');
  
  autoUpdater.logger = log;
  autoUpdater.logger.transports.file.level = 'info';
  
  // 配置事件监听
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
  });
  
  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info);
    if (mainWindow) {
      mainWindow.webContents.send('update-available', info);
    }
  });
  
  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available:', info);
  });
  
  autoUpdater.on('error', (err) => {
    log.error('Error in auto-updater:', err);
  });
  
  autoUpdater.on('download-progress', (progressObj) => {
    let logMessage = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
    log.info(logMessage);
    if (mainWindow) {
      mainWindow.webContents.send('download-progress', progressObj);
    }
  });
  
  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded; will install now', info);
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', info);
      // 可以选择立即安装或者提醒用户稍后安装
      // autoUpdater.quitAndInstall();
    }
  });
  
  // 检查更新
  autoUpdater.checkForUpdatesAndNotify();
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
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
    // mainWindow.loadFile(path.join(resourcesPath, 'ui', 'index.html'));
    mainWindow.loadURL('https://p-pass-file.deno.dev/');
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
  checkForUpdates();
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