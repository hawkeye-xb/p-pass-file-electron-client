// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
	// 唤起文件选择器，返回所选择的目录或者文件地址
	openFileSelector: (options: any) => ipcRenderer.invoke('open-resource-selector', {
		properties: ['openFile', 'openDirectory', 'multiSelections'], // 允许选择文件和目录
		...options,
	}),
	showItemInFolder: (path: string) => ipcRenderer.send('show-item-in-folder', path),
	systemInfo: {
		platform: process.platform,
		arch: process.arch,
		electron: process.versions.electron,
		node: process.versions.node,
		appVersion: process.env.APP_VERSION,
	},
	// 添加重启应用的方法
	relaunchApp: () => ipcRenderer.send('relaunch-app'),
	// 添加主题相关 API
	theme: {
		getCurrentTheme: () => ipcRenderer.invoke('get-theme'),
		setTheme: (t: 'system' | 'light' | 'dark') => {
			ipcRenderer.send('set-theme', t);
		},
		onThemeChange: (callback: (theme: 'light' | 'dark') => void) => {
			ipcRenderer.on('theme-changed', (_event, theme) => callback(theme));
		},
		removeThemeChangeListener: () => {
			ipcRenderer.removeAllListeners('theme-changed');
		}
	}
});