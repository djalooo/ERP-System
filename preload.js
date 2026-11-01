const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  db: {
    // Generic CRUD
    getAll: (table) => ipcRenderer.invoke('db:getAll', table),
    getById: (table, id) => ipcRenderer.invoke('db:getById', table, id),
    insert: (table, data) => ipcRenderer.invoke('db:insert', table, data),
    update: (table, id, data) => ipcRenderer.invoke('db:update', table, id, data),
    delete: (table, id) => ipcRenderer.invoke('db:delete', table, id),
    
    // Exact Query / Custom Operations
    query: (sql, params) => ipcRenderer.invoke('db:query', sql, params),
    
    // Bulk operations (for migration)
    insertMany: (table, items) => ipcRenderer.invoke('db:insertMany', table, items),
    
    // Clear/Reset
    clear: (table) => ipcRenderer.invoke('db:clear', table),
  },
  system: {
    getVersion: () => ipcRenderer.invoke('system:getVersion'),
  }
});
