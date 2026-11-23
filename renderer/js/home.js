
const addBookButton = document.getElementById('addBookButton');
const recentBooks = document.getElementById('recentBooks');
const statusMessage = document.getElementById('statusMessage');

// Carrega a biblioteca ao iniciar a interface
async function loadLibrary() {
    try {
        const books = await window.electronAPI.listBooks();

        recentBooks.innerHTML = '';

        if (books.length === 0) {
            showEmptyLibrary();
            return;
        }

        books.forEach(book => renderRecentBook(book));

    } catch (error) {
        console.error('Erro ao carregar biblioteca:', error);
        statusMessage.textContent =
            'Não foi possível carregar sua biblioteca.';
    }
}

// Exibe mensagem quando a biblioteca está vazia
function showEmptyLibrary() {
    const empty = document.createElement('div');
    empty.classList.add('empty-library');

    const message = document.createElement('p');
    message.textContent = 'Suas leituras aparecerão aqui.';

    empty.appendChild(message);
    recentBooks.appendChild(empty);
}

// Cria o cartão de um livro


function renderRecentBook(book) {
    const bookCard = document.createElement('div');
    bookCard.classList.add('book-card');

    // Capa do livro
    const cover = document.createElement('div');
    cover.classList.add('book-cover');

    if (book.cover) {
        const image = document.createElement('img');
        image.src = book.cover;
        image.alt = `Capa de ${book.title || book.fileName}`;

        cover.appendChild(image);
    } else {
        const placeholder = document.createElement('span');
        placeholder.textContent = '✦';
        cover.appendChild(placeholder);
    }

    // Informações do livro
    const info = document.createElement('div');
    info.classList.add('book-info');

    const title = document.createElement('p');
    title.classList.add('book-title');
    title.textContent = book.title || book.fileName;

    const author = document.createElement('p');
    author.classList.add('book-author');
    author.textContent = book.author || 'Autor desconhecido';

    // Recupera o progresso salvo
    let percentage = 0;

    try {
        const saved = localStorage.getItem(
            `readingProgress:${book.filePath}`
        );

        if (saved) {
            percentage = Math.round(
                JSON.parse(saved).percentage * 100
            );
        }
    } catch (error) {
        console.warn('Erro ao recuperar progresso:', error);
    }

    const progressText = document.createElement('small');
    progressText.classList.add('book-progress');
    progressText.textContent = `${percentage}% lido`;

    const progressTrack = document.createElement('div');
    progressTrack.classList.add('book-progress-track');

    const progressBar = document.createElement('div');
    progressBar.classList.add('book-progress-bar');
    progressBar.style.width = `${percentage}%`;

    progressTrack.appendChild(progressBar);

    info.appendChild(title);
    info.appendChild(author);
    info.appendChild(progressText);
    info.appendChild(progressTrack);

    bookCard.appendChild(cover);
    bookCard.appendChild(info);

    bookCard.addEventListener('click', () => {
        openSavedBook(book);
    });

    recentBooks.appendChild(bookCard);
}


// Abre um livro já cadastrado
async function openSavedBook(book) {
    try {
        statusMessage.textContent = 'Abrindo livro...';

        const bookData = await window.electronAPI.readBook(book.id);

        statusMessage.textContent = '';

        await openEPUB(bookData);
        await loadLibrary();

    } catch (error) {
        console.error('Erro ao abrir livro:', error);

        statusMessage.textContent =
            'Não foi possível abrir este livro. Verifique se o arquivo ainda existe.';
    }
}

// Adiciona um novo livro
addBookButton.addEventListener('click', async () => {
    try {
        statusMessage.textContent = '';

        const book = await window.electronAPI.openBook();

        if (!book) return;

        
        await openEPUB(book);
        await loadLibrary();

    } catch (error) {
        console.error('Erro ao adicionar livro:', error);

        statusMessage.textContent =
            'Não foi possível adicionar o livro.';
    }
});

window.addEventListener('library-refresh', loadLibrary);
// Inicializa a biblioteca
loadLibrary();
