import { BrowserWindow, Menu, MenuItem } from 'electron';

// Default menu template
const defaultMenuTemplate = [
  {
    label: 'File',
    submenu: [

      { role: 'quit' }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' }
    ]
  }
];

// Create a function to send an event to the renderer process
function triggerUploadInRenderer() {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    win.webContents.send('upload-menu-clicked');
  }
}
function triggerSaveInRenderer() {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    win.webContents.send('save-project');
  }
}
function triggerGoToHome(){
     const win = BrowserWindow.getFocusedWindow();
  if (win) {
    win.webContents.send('go-to-home-page');
  }
}

const projectMenuTemplate = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Upload Video',
        click: () => {
          // Trigger upload in the renderer process
          triggerUploadInRenderer();
        }
      },
      {
        label:"Go to HomePage",
        click: () => {
          // Trigger upload in the renderer process
          triggerGoToHome();
        }
    },
    {
      label: 'Save Project',
      click: () => {
          // Trigger upload in the renderer process
          triggerSaveInRenderer();
        }
    },
      { role: 'quit' }
    ]
  },

];

// Now use this menu template when creating the menu
const projectMenu = Menu.buildFromTemplate(projectMenuTemplate);
const defaultMenu = Menu.buildFromTemplate(defaultMenuTemplate);

export {defaultMenu, projectMenu};