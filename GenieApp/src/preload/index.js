import { contextBridge } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import path from 'path';
import fs from 'fs';

// Custom APIs for renderer
const api = {

  openFileDialog: () => electronAPI.ipcRenderer.invoke('open-file-dialog'),
  getAppDir: () => electronAPI.ipcRenderer.invoke('get-app-dir'),
  pathJoin: (...paths) => path.join(...paths),
  pathBasename: (filePath) => path.basename(filePath),
  pathWithoutExtension: (filePath) => path.basename(filePath, path.extname(filePath)),
  ensureDirExists: (dirPath) => {
    return new Promise((resolve, reject) => {
      fs.mkdir(dirPath, { recursive: true }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },
  copyFile: (source, destination) => {
    return new Promise((resolve, reject) => {
      fs.copyFile(source, destination, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },
  generateThumbnails: (thumbnailDir) => {
    return electronAPI.ipcRenderer.invoke('generate-thumbnails', thumbnailDir);
  },
  receiveBotResponse: (callback) => electronAPI.ipcRenderer.on('bot-response', (event, response) => callback(response)),
  removeAllListeners: (channel) => electronAPI.ipcRenderer.removeAllListeners(channel),
  sendUserInput: (message) => electronAPI.ipcRenderer.invoke('user-input', message),
  sendVideoPath: (videoPath) => electronAPI.ipcRenderer.send('video-uploaded', videoPath),
};


// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.Electron = electronAPI;
  window.api = api;
}
