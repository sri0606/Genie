import { contextBridge } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import path from 'path';
import fs from 'fs';
import {createVideoObject, createProjectObject} from './templates.js';

const writeFile = (filePath, data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, data, 'utf8', (err) => {
      if (err) {
        reject(err); // Reject the promise if there's an error
      } else {
        resolve('File written successfully!'); // Resolve the promise if successful
      }
    });
  });
};

const readFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err); // Reject the promise if there's an error
      } else {
        resolve(data); // Resolve the promise with the file data
      }
    });
  });
};

const copyFile = (source, destination) => {
    return new Promise((resolve, reject) => {
      fs.copyFile(source, destination, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
};

const deleteFile = (path) => {
  
}
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
  openProject: (projectId) => electronAPI.ipcRenderer.invoke('open-project',projectId),
  ensureDirExists: (dirPath) => {
    return new Promise((resolve, reject) => {
      fs.mkdir(dirPath, { recursive: true }, (err) => {
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
  executeFunction: (action,paths) => electronAPI.ipcRenderer.invoke('execute',action,paths),
  pathJoinURL:(url,...vals)=> url + '/' + vals.join('/'),
  handleUpload: async (id,projectDataDir, projectURL) => {
    const filePath = await api.openFileDialog();
    console.log('Selected file path:', filePath);
    console.log("handleUpload called with params:", {
  id,
  projectDataDir,
  projectURL
});

    if (filePath) {
      const fileName = api.pathBasename(filePath);
      const fileBaseName = api.pathWithoutExtension(fileName);
      const workingDir = api.pathJoin(projectDataDir, fileBaseName);
      const editsDir = api.pathJoin(projectDataDir, fileBaseName,"edits");
      await api.ensureDirExists(workingDir);
      await api.ensureDirExists(editsDir);
      await api.ensureDirExists(api.pathJoin(editsDir,"video"));
      await api.ensureDirExists(api.pathJoin(editsDir,"audio"));
      await api.ensureDirExists(api.pathJoin(projectDataDir, fileBaseName, "thumbnails"));
      const destinationPath = api.pathJoin(workingDir, fileName);
      await copyFile(filePath, destinationPath);
      const audioTrackPath = await electronAPI.ipcRenderer.invoke('extract-audio', destinationPath);

      const newVideo = createVideoObject({
        id: id,
        name: fileName,
        projectDataDir: projectDataDir,
        projectURL: projectURL,
        fileBaseName: fileBaseName,
        fileName: fileName,
        audioTrackPath: audioTrackPath,
        location: destinationPath
      });
      
      return newVideo;
    }
  },
  onUploadMenuClicked: (callback) => electronAPI.ipcRenderer.on('upload-menu-clicked', () => callback()),
  onGoToHomeClicked : (callback) => electronAPI.ipcRenderer.on('go-to-home-page',()=> callback()),
  onSaveProjectClicked : (callback) => electronAPI.ipcRenderer.on('save-project',()=> callback()),
  createNewProject: async (appDataDirectory) => {
      const timestamp = Date.now(); // Current time in milliseconds
      const randomComponent = Math.random().toString(36).substr(2, 5); // Random string
      const newProjectId = `${timestamp}-${randomComponent}`; // Unique ID based on timestamp and random string
      const projectDir = api.pathJoin(appDataDirectory, newProjectId);
      api.ensureDirExists(projectDir);

      const project = createProjectObject({
          id: newProjectId,
          projectDataDir: projectDir,
        })
            // Construct the path to the project file (e.g., project.json)
      const projectFilePath = api.pathJoin(projectDir, 'project.json');

      // Convert the project object to a JSON string
      const projectData = JSON.stringify(project, null, 2);

      // Save the JSON string to the project file
      await writeFile(projectFilePath, projectData);

      return project;
  },
  saveProject : async (project) => {
    try {
      const projectObject = createProjectObject({

      id:project.id,
      name: project.id,
      projectURL: project.projectURL,
      projectDataDir: project.projectDataDir,
      videos: project.videos,
      chatMessages: project.chatMessages,
    });
    console.log("asfasfasgsdgsdgsdhg",projectObject);
      // Construct the path to the project file (e.g., project.json)
      const projectFilePath = api.pathJoin(project.projectDataDir, 'project.json');

      // Update the last modified date
      projectObject.metadata.lastModified = new Date().toISOString();

      // Convert the project object to a JSON string
      const projectData = JSON.stringify(projectObject, null, 2);

      // Save the JSON string to the project file
      await writeFile(projectFilePath, projectData);

      console.log('Project saved successfully:', projectFilePath);
    } catch (error) {
      console.error('Error saving project:', error);
    }
    },
  loadProject : async (projectId) => {
    try {
      const projectResourcesDir = await api.getProjectResourcesDir();
      const projectDataDir = api.pathJoin(projectResourcesDir, projectId);
      // Construct the path to the project file (e.g., project.json)
      const projectFilePath = api.pathJoin(projectDataDir, 'project.json');

      // Read the project file
      const projectData = await readFile(projectFilePath);

      // Parse the JSON data into a JavaScript object
      const project = JSON.parse(projectData);

      console.log('Project loaded successfully:', project);

      return project;
    } catch (error) {
      console.error('Error loading project:', error);
      return null;
    }
  },
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
