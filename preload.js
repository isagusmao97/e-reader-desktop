
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    openBook: () => ipcRenderer.invoke('books:open'),

    listBooks: () => ipcRenderer.invoke('books:list'),

    readBook: (bookId) => ipcRenderer.invoke('books:read', bookId),

    updateBookInfo: (bookId, info) =>
        ipcRenderer.invoke('books:updateInfo', bookId, info)
});
