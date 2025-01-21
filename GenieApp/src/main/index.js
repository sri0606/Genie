import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import axios from 'axios';
import path from 'path';
import ffmpeg from "fluent-ffmpeg";
import ffprobeStatic from "ffprobe-static";
import express from "express";
import fs from 'fs';
import VideoEditor from './autove.js'; // Load the VideoEditor class
import {projectMenu ,defaultMenu} from './menuTemplate.js';

// Ensure FFmpeg uses the ffprobe-static binary
ffmpeg.setFfprobePath(ffprobeStatic.path);

const projectResourcesServer = express();
const projectResourcesDir = path.join(app.getPath('userData'), 'projects');
// Create an instance of the VideoEditor
const videoEditorInstance = new VideoEditor();

//Serve media files from the media directory
projectResourcesServer.use('/media', express.static(projectResourcesDir));

// Start the Express server on a specific port
const port = process.env.MEDIA_PORT || 3000;
let server = projectResourcesServer.listen(port, () => {
    console.log(`projectResourcesServer server is running at http://localhost:${port}/media`);
});

const projectResourcesEndpoint = `http://localhost:${port}/media`

// Handle graceful shutdown for Electron app and media server
function shutdownServer() {
    console.log('Shutting down media server...');
    server.close(() => {
        console.log('Media server stopped.');
        app.quit();  // Quit the Electron app after the server stops
    });
}
function createWindow(projectId = null) {
  const mainWindow = new BrowserWindow({
    title: 'Genie',
    icon: path.join(__dirname, 'genie.webp'),
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      devTools: true,
    },
  });
  const menu = projectId ? projectMenu : defaultMenu;
  mainWindow.setMenu(menu);
  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });
 mainWindow.webContents.openDevTools();
  // Check if it's dev mode or production and load the appropriate URL
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    if (projectId) {
      mainWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?projectId=${projectId}`);
    } else {
      mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
    }
  } else {
    if (projectId) {
      mainWindow.loadFile(join(__dirname, '../renderer/index.html'), {
        query: { projectId: projectId },
      });
    } else {
      mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }
  }

  return mainWindow;
}


app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.electron');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  ipcMain.on('ping', () => console.log('pong'));

  try {

    let mainWindow = createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createWindow();
      }

    });
  } catch (error) {
    console.error('Failed to start server:', error);
    app.quit();
  }
});

// Handle process signals (e.g., CTRL+C or app close)
process.on('SIGINT', () => {
    console.log('Received SIGINT. Initiating shutdown...');
    shutdownServer();
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Initiating shutdown...');
    shutdownServer();
});


app.on('window-all-closed', async () => {
  shutdownServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


// IPC handlers

  ipcMain.handle('get-projects', async () => {
  try {
    const directories = await fs.promises.readdir(projectResourcesDir, { withFileTypes: true });
    // Filter to only include directories
    const projects = directories.filter(dirent => dirent.isDirectory()).map(dirent => ({
      id: dirent.name,
      name: dirent.name
    }));
    return projects;
  } catch (error) {
    console.error('Error reading project directories:', error);
    return [];
  }
});

async function getNumberOfFilesInDirectory(directoryPath) {
    try {
        const files = await fs.promises.readdir(directoryPath, { withFileTypes: true });
        return files.filter(file => file.isFile()).length; // Filter out directories, only count files
    } catch (err) {
        console.error(`Error reading directory ${directoryPath}:`, err);
        return 0;
    }
}

ipcMain.handle('get-videos-in-project', async (event, projectId) => {
  const projectDir = path.join(projectResourcesDir, projectId); // Construct the project directory path
  try {
    const directories = await fs.promises.readdir(projectDir, { withFileTypes: true });

    const videos = [];

    for (const dirent of directories) {
    if (dirent.isDirectory()) {
        const videoDir = path.join(projectDir, dirent.name); // Path to the video subdirectory
        const files = await fs.promises.readdir(videoDir, { withFileTypes: true });

        // Look for the video file in the subdirectory
        const videoFile = files.find(file => file.isFile() && /\.(mp4|webm|ogg)$/.test(file.name));

        if (videoFile) {
            // Check for the number of edits in the 'edits' subdirectory
            const editsDir = path.join(videoDir, 'edits');
            const numEdits = await getNumberOfFilesInDirectory(editsDir); // Count number of files in edits dir

            videos.push({
                name: videoFile.name,
                url: `http://localhost:3000/media/${projectId}/${dirent.name}/${videoFile.name}`,
                dirURL: `http://localhost:3000/media/${projectId}/${dirent.name}`,
                dirLocation: videoDir,
                numEdits: numEdits 
            });
        }
    }
}
    return videos;
  } catch (error) {
    console.error('Error reading video files:', error);
    return [];
  }
});


ipcMain.handle('open-project', (event, projectId) => {
  // Create a new project window
  const projectWindow = createWindow(projectId);

  // Close the current window (which might be homepage or another project)
  const currentWindow = BrowserWindow.getFocusedWindow();
  if (currentWindow) {
    currentWindow.close();
  }
});




ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Videos', extensions: ['mp4', 'webm', 'ogg'] }],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('get-project-resources-dir', () => {
  return projectResourcesDir;
});

ipcMain.handle('get-project-resources-endpoint', () => {
  return projectResourcesEndpoint;
});


ipcMain.handle('generate-thumbnails', async (event, videoPath) => {
  const videoDir = path.dirname(videoPath);
  const thumbnailDir = path.join(videoDir, 'thumbnails');

  try {
    // Get video duration using ffprobe
    const { duration } = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata.format);
      });
    });

    // Create a list of timestamps for thumbnails
    const intervals = [];
    for (let i = 0; i < duration; i += 5) { // Change 5 to your desired interval
      intervals.push(i);
    }

    // Generate thumbnails
    await Promise.all(intervals.map(time => {
      return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .on('end', resolve)
          .on('error', reject)
          .screenshots({
            timestamps: [time],
            folder: thumbnailDir,
            filename: `${time}.png`, // Use time as filename
            size: '320x240'
          });
      });
    }));

    return 'Thumbnails generated successfully';
  } catch (error) {
    throw new Error(`Error generating thumbnails: ${error.message}`);
  }
});

// Handle user input and execute the function
ipcMain.handle('user-input', async (event, userInput) => {
  const extractionResults = await runExtraction(userInput);
  // event.reply('bot-response', response); // Emit the bot response event
  return extractionResults;
});

ipcMain.handle('execute', async (event, extractedresults,input_path,output_path) => {
  const response = await runExecution(extractedresults,input_path,output_path);
  // event.reply('bot-response', response); // Emit the bot response event
  return response;
});

ipcMain.handle("extract-audio", async (event, input_path) => {
    try {
        // Extract the base name without extension
        const output_path = path.join(
            path.dirname(input_path),
            path.basename(input_path, path.extname(input_path))
        );
        const paths = {video: {input: input_path, output: null}, audio:{input:null, output:output_path}}
        // Call the extract_audio_from_video method
        const result = await videoEditorInstance.extract_audio_from_video(paths);
        return result.paths.audio.output; // return the result back to renderer
    } catch (error) {
        console.error("Error during audio extraction:", error);
        throw error; // handle error as needed
    }
});

async function runExtraction(userInput){
      // Send a request to the server to extract functions and their arguments
    const extractFunctionsResponse = await axios.post('http://localhost:8000/extract_actions_with_args', {
      text: userInput,
      top_k: 1,
      threshold: 0.45,
    });
    // Extract the function and its arguments from the response
    const result = JSON.parse(extractFunctionsResponse.data);
    return result;
}

async function runExecution(action, paths) {

  try {
    const functionName = action.action; // e.g., "add", "resize_video"
    const functionArgs = action.args; // e.g., {values: [3, 4]} or {width: 480, height: 720}
    
    // Add paths to function arguments if necessary
    functionArgs["paths"] = paths;

    console.log(`Executing function: ${functionName} with args:`, functionArgs);

    
    // Check if the method exists on the instance
    if (typeof videoEditorInstance[functionName] === 'function') {
      // Call the method on the class instance
      const result = await executeFunction(functionName, functionArgs);
      return result;
    } else {

      return {
        status: 'error', 
        message: `Function ${functionName} not found`,
        videoEdited: false,
        audioEdited: false,
        paths: paths
      };
    }

  } catch (error) {
    console.error('Error in runExecution:', error);
    return {status: "error", 
        message: `Error: ${error.message}`,
        videoEdited: false,
        audioEdited: false,
        paths: paths};
  }

}



// Execute the function with its arguments on the instance
async function executeFunction(functionName, functionArgs) {
  try {
    // Extract the arguments in the correct order (if necessary)
    const args = Object.values(functionArgs); // [480, 720] for resize_video

    // Execute the function dynamically with the provided arguments
    const result = videoEditorInstance[functionName](...args); // Call the instance method
    console.log(`Result of ${functionName}:`, result);
    return result;
  } catch (error) {
    console.error(`Error in executing ${functionName}:`, error);
    return `Error: ${error.message}`;
  }
}
