import { contextBridge } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import path from 'path';
import fs from 'fs';

// Custom APIs for renderer
const api = {

  openFileDialog: () => electronAPI.ipcRenderer.invoke('open-file-dialog'),
  getProjectResourcesDir: () => electronAPI.ipcRenderer.invoke('get-project-resources-dir'),
  getProjectResourcesEndpoint: () => electronAPI.ipcRenderer.invoke('get-project-resources-endpoint'),
  pathJoin: (...paths) => path.join(...paths),
  getProjects: () => electronAPI.ipcRenderer.invoke('get-projects'),
  getVideosInProject:(projectId)=> electronAPI.ipcRenderer.invoke('get-videos-in-project', projectId),
  pathBasename: (filePath) => path.basename(filePath),
  pathWithoutExtension: (filePath) => path.basename(filePath, path.extname(filePath)),
  createNewProjectId: () => electronAPI.ipcRenderer.invoke('create-new-project-id'), 
  openProject: (projectId) => electronAPI.ipcRenderer.invoke('open-project',projectId),
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
  sendUserInput: (message,input_path, output_path) => electronAPI.ipcRenderer.invoke('user-input', message, input_path, output_path),
  executeFunction: (extractedResults,input_path,output_path) => electronAPI.ipcRenderer.invoke('execute',extractedResults,input_path,output_path),
  pathJoinURL:(url,...vals)=> url + '/' + vals.join('/'),
  handleUpload: async (projectDataDir, projectURL) => {
    const filePath = await api.openFileDialog();
    console.log('Selected file path:', filePath);

    if (filePath) {
      const fileName = api.pathBasename(filePath);
      const fileBaseName = api.pathWithoutExtension(fileName);
      const workingDir = api.pathJoin(projectDataDir, fileBaseName);
      await api.ensureDirExists(workingDir);
      await api.ensureDirExists(api.pathJoin(projectDataDir, fileBaseName, "edits"));

      const destinationPath = api.pathJoin(workingDir, fileName);
      await api.copyFile(filePath, destinationPath);
      console.log('File copied to:', destinationPath);
      console.log("find vide here",api.pathJoinURL(projectURL, fileBaseName, fileName))
      const newVideo = { 
        name: fileName, 
        url: api.pathJoinURL(projectURL, fileBaseName, fileName), 
        dirLocation: api.pathJoin(projectDataDir, fileBaseName),
        dirURL : api.pathJoinURL(projectURL, fileBaseName),
        numEdits: 0
      };
      return {newVideo,destinationPath};
    }
  },
  onUploadMenuClicked: (callback) => electronAPI.ipcRenderer.on('upload-menu-clicked', () => callback()),
  onGoToHomeClicked : (callback) => electronAPI.ipcRenderer.on('go-to-home-page',()=> callback()),
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
