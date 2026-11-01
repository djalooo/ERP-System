import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDatabase, dbHandlers } from './database-main.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB
initDatabase();

// Setup IPC Handlers
ipcMain.handle('db:getAll', (event, table) => dbHandlers.getAll(table));
ipcMain.handle('db:getById', (event, table, id) => dbHandlers.getById(table, id));
ipcMain.handle('db:insert', (event, table, data) => dbHandlers.insert(table, data));
ipcMain.handle('db:update', (event, table, id, data) => dbHandlers.update(table, id, data));
ipcMain.handle('db:delete', (event, table, id) => dbHandlers.delete(table, id));
ipcMain.handle('db:query', (event, sql, params) => dbHandlers.query(sql, params));
ipcMain.handle('db:insertMany', (event, table, items) => dbHandlers.insertMany(table, items));
ipcMain.handle('db:clear', (event, table) => dbHandlers.clear(table));
ipcMain.handle('system:getVersion', () => app.getVersion());

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │`
process.env.DIST = path.join(__dirname, 'dist');
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.DIST, '../public')
  : process.env.DIST;

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // 3. Open devtools in development
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: 'undocked' });
  } else {
    // Use loadFile instead of loadURL for production. It handles relative paths correctly.
    win.loadFile(path.join(process.env.DIST, 'index.html'));
  }

  // 2. Show the window only when the content is ready
  win.once('ready-to-show', () => {
    win.show();
  });

  // Handle failed loads for better debugging
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`Failed to load ${validatedURL}: ${errorDescription} (Code: ${errorCode})`);
  });

  // Handle the 'render-process-gone' event, which can happen on a crash
  win.webContents.on('render-process-gone', (event, details) => {
    console.error(`Renderer process gone: ${details.reason}`);
    if (details.reason === 'crashed') {
      // Reload the window on crash
      win.reload();
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
