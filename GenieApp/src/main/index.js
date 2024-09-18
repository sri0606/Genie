import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import axios from 'axios';
import path from 'path';
import ffmpeg from "fluent-ffmpeg";
import ffprobeStatic from "ffprobe-static";
import fs from 'fs';
import VideoEditor from './autove.js'; // Load the VideoEditor class


// Create an instance of the VideoEditor
const videoEditorInstance = new VideoEditor();

function createWindow() {
  const mainWindow = new BrowserWindow({
    title: 'Genie',
    icon: path.join(__dirname, 'genie.webp'),
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    // ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
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

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


// IPC handlers
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

ipcMain.handle('get-app-dir', () => {
  return path.join("C:/Users/srira/Projects/AutoVE/ElectronGUI", 'mediaDirectory');
});

// Ensure FFmpeg uses the ffprobe-static binary
ffmpeg.setFfprobePath(ffprobeStatic.path);

ipcMain.handle('generate-thumbnails', async (event, videoPath) => {
  const videoDir = path.dirname(videoPath);
  const thumbnailDir = path.join(videoDir, 'thumbnails');

  try {
    // Check if the 'thumbnails' directory exists
    await fs.promises.access(thumbnailDir, fs.constants.F_OK)
      .catch(() => fs.promises.mkdir(thumbnailDir, { recursive: true }));

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


// Handle the video upload and update the path
ipcMain.on('video-uploaded', (event, videoPath) => {
  console.log('Video uploaded: ', videoPath);
  // Update the path of the videoEditorInstance
  videoEditorInstance.current_path = videoPath;
});

// Handle user input and execute the function
ipcMain.handle('user-input', async (event, userInput) => {
  const response = await extractAndExecute(userInput);
  // event.reply('bot-response', response); // Emit the bot response event
  return response;
});


async function extractAndExecute(userInput) {
  try {
    // Send a request to the server to extract functions and their arguments
    const extractFunctionsResponse = await axios.post('http://localhost:8000/extract', {
      text: userInput,
      top_k: 1,
      threshold: 0.45,
    });

    // Extract the function and its arguments from the response
    const extractedFunctions = JSON.parse(extractFunctionsResponse.data);
    console.log('Extracted functions:', extractedFunctions);

    let results = [];
    // Iterate over the extracted functions and execute each one
    for (const extractedFunction of extractedFunctions) {
      const functionName = Object.keys(extractedFunction)[0]; // e.g., "resize_video"
      const functionArgs = extractedFunction[functionName]; // e.g., {width: 480, height: 720}

      // Check if the method exists on the instance
      if (typeof videoEditorInstance[functionName] === 'function') {
        // Call the method on the class instance
        const result = await executeFunction(functionName, functionArgs);
        results.push(`${functionName}: ${result}`);
      } else {
        results.push(`Function ${functionName} not found`);
      }
    }
    return results.join('\n');
  } catch (error) {
    console.error('Error in extractAndExecute:', error);
    return `Error: ${error.message}`;
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
