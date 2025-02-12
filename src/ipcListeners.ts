import { BrowserWindow, ipcMain, nativeTheme, shell, app } from "electron";
import Store from 'electron-store';

const schema = {
  theme: {
    type: 'string',
    enum: ['system', 'light', 'dark'],
    default: 'dark'
  }
}
const store: any = new Store({schema});
const initTheme = () => {
  const savedTheme = store.get('theme', 'dark');
  nativeTheme.themeSource = savedTheme;
};

ipcMain.handle('get-theme', () => {
  return nativeTheme.themeSource;
});
ipcMain.on('set-theme', (_event, theme: 'system' | 'light' | 'dark') => {
  nativeTheme.themeSource = theme;
  store.set('theme', theme);
});
nativeTheme.on('updated', () => {
  const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
	console.debug(`System theme changed to: ${theme}`);

  BrowserWindow.getAllWindows().forEach(window => {
    window.webContents.send('theme-changed', theme);
  });
});

// 在应用启动时初始化主题
initTheme();
// ----

// 监听请求：唤起文件选择器，返回所选择的目录或者文件地址
// openFileSelector: (options: any) => ipcRenderer.invoke('open-file-selector', options),
ipcMain.handle('open-resource-selector', async (event, options) => {
	const { dialog } = require('electron');
	const result = await dialog.showOpenDialog(options);
	return result;
});

ipcMain.on('show-item-in-folder', (_, path: string) => {
	shell.showItemInFolder(path)
})

// 添加重启应用的监听器
ipcMain.on('relaunch-app', () => {
    app.relaunch();
    app.exit(0);
});
