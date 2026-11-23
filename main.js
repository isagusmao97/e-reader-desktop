
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let win;

// Arquivo permanente da biblioteca
const libraryFile = () => path.join(app.getPath('userData'), 'library.json');

// Lê a biblioteca salva
async function getLibrary() {
    try {
        const content = await fs.promises.readFile(libraryFile(), 'utf8');
        const books = JSON.parse(content);
        return Array.isArray(books) ? books : [];
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        console.error('Erro ao ler biblioteca:', error);
        throw new Error('Não foi possível carregar a biblioteca.');
    }
}

// Salva a biblioteca
async function saveLibrary(books) {
    await fs.promises.mkdir(app.getPath('userData'), {
        recursive: true
    });

    await fs.promises.writeFile(
        libraryFile(),
        JSON.stringify(books, null, 2),
        'utf8'
    );
}

// Lê um EPUB e prepara os dados para o leitor
async function loadBookData(book) {
    const fileBuffer = await fs.promises.readFile(book.filePath);

    return {
        id: book.id,
        filePath: book.filePath,
        fileName: book.fileName,
        data: new Uint8Array(fileBuffer)
    };
}

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 650,
        backgroundColor: '#222222',
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

    win.on('closed', () => {
        win = null;
    });
}

// Retorna os livros cadastrados
ipcMain.handle('books:list', async () => {
    return await getLibrary();
});

// Abre a janela de seleção e cadastra o livro
ipcMain.handle('books:open', async () => {
    const result = await dialog.showOpenDialog(win, {
        title: 'Selecionar livro',
        properties: ['openFile'],
        filters: [
            { name: 'Livros EPUB', extensions: ['epub'] }
        ]
    });

    if (result.canceled || result.filePaths.length === 0) {
        return null;
    }

    const filePath = path.resolve(result.filePaths[0]);

    let books = await getLibrary();

    // Verifica se o livro já está cadastrado
    let book = books.find(item =>
        path.normalize(item.filePath).toLowerCase() ===
        path.normalize(filePath).toLowerCase()
    );

    if (!book) {
        book = {
            id: crypto.randomUUID(),
            filePath,
            fileName: path.basename(filePath),
            title: path.basename(filePath, path.extname(filePath)),
            addedAt: new Date().toISOString(),
            lastOpenedAt: null
        };

        books.unshift(book);
        await saveLibrary(books);
    }

    try {
        return await loadBookData(book);
    } catch (error) {
        console.error('Erro ao ler EPUB:', error);
        throw new Error('Não foi possível ler o arquivo EPUB.');
    }
});

// Abre um livro que já está na biblioteca
ipcMain.handle('books:read', async (_event, bookId) => {
    const books = await getLibrary();
    const book = books.find(item => item.id === bookId);

    if (!book) {
        throw new Error('Livro não encontrado na biblioteca.');
    }

    try {
        const bookData = await loadBookData(book);

        book.lastOpenedAt = new Date().toISOString();
        await saveLibrary(books);

        return bookData;
    } catch (error) {
        console.error('Erro ao recuperar livro:', error);
        throw new Error(
            'Não foi possível localizar o arquivo. Talvez ele tenha sido movido ou excluído.'
        );
    }
});


// Atualiza as informações de um livro na biblioteca
ipcMain.handle('books:updateInfo', async (_event, bookId, info) => {
    const books = await getLibrary();
    const index = books.findIndex(item => item.id === bookId);

    if (index === -1) {
        throw new Error('Livro não encontrado.');
    }

    const book = books[index];

    if (typeof info.title === 'string' && info.title.trim()) {
        book.title = info.title.trim();
    }

    if (typeof info.author === 'string') {
        book.author = info.author;
    }

    if (typeof info.cover === 'string' &&
        info.cover.startsWith('data:image/')) {
        book.cover = info.cover;
    }

    await saveLibrary(books);

    return book;
});


app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
