import { ipcMain, shell } from "electron";
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