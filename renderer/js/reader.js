
let currentBook = null;
let currentRendition = null;

let currentFontSize = 100;
let currentBookData = null;

let currentLocation = null;
let openGeneration = 0;

// Elementos da interface
const readerScreen = document.getElementById('readerScreen');
const homeScreen = document.getElementById('homeScreen');

const viewer = document.getElementById('viewer');
const bookTitle = document.getElementById('bookTitle');

const pageInfo = document.getElementById('pageInfo');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

const addBookmarkButton = document.getElementById('addBookmarkButton');
const showBookmarksButton = document.getElementById('showBookmarksButton');
const bookmarksPanel = document.getElementById('bookmarksPanel');
const bookmarksList = document.getElementById('bookmarksList');
const closeBookmarksButton = document.getElementById('closeBookmarksButton');

const notification = document.getElementById('notification');
let notificationTimeout;

// Recupera o progresso salvo de um livro
function getSavedProgress(filePath) {
    const saved = localStorage.getItem(`readingProgress:${filePath}`);

    return saved ? JSON.parse(saved) : null;
}

// Recupera os marcadores do livro atual
function getBookBookmarks() {
  if (!currentBookData) return [];

  try {
    const saved = localStorage.getItem(
      `bookmarks:${currentBookData.id}`
    );

    const bookmarks = saved ? JSON.parse(saved) : [];
    return Array.isArray(bookmarks) ? bookmarks : [];

  } catch (error) {
    console.error('Erro ao recuperar marcadores:', error);
    return [];
  }
}

function saveBookBookmarks(bookmarks) {
  if (!currentBookData) return;

  try {
    localStorage.setItem(
      `bookmarks:${currentBookData.id}`,
      JSON.stringify(bookmarks)
    );
  } catch (error) {
    console.error('Erro ao salvar marcadores:', error);
  }
}

function addBookmark() {
  if (!currentBookData || !currentLocation) {
    alert('Não foi possível identificar a posição atual.');
    return;
  }

  const bookmarks = getBookBookmarks();

  const alreadyExists = bookmarks.some(
    bookmark => bookmark.cfi === currentLocation.cfi
  );

  if (alreadyExists) {
  showNotification('Esta posição já está marcada.');
  return;
}

  const newBookmark = {
    id: `${Date.now()}-${Math.random()}`,
    cfi: currentLocation.cfi,
    percentage: Math.round(currentLocation.percentage * 100),
    createdAt: new Date().toISOString()
  };

  bookmarks.push(newBookmark);

  saveBookBookmarks(bookmarks);
  renderBookmarks();
  showNotification('Marcador adicionado com sucesso!');

  console.log('Marcador adicionado:', newBookmark);
}

function removeBookmark(bookmarkId) {
  const bookmarks = getBookBookmarks();

  const updatedBookmarks = bookmarks.filter(
    bookmark => bookmark.id !== bookmarkId
  );

  saveBookBookmarks(updatedBookmarks);
  renderBookmarks();
  showNotification('Marcador removido com sucesso!');
}

async function goToBookmark(bookmark) {
  if (!currentRendition || !bookmark) return;

  try {
    await currentRendition.display(bookmark.cfi);
    closeBookmarksPanel();

  } catch (error) {
    console.error('Erro ao acessar marcador:', error);
    alert('Não foi possível acessar esta posição.');
  }
}

function renderBookmarks() {
  if (!bookmarksList) return;

  bookmarksList.replaceChildren();

  const bookmarks = getBookBookmarks();

  if (bookmarks.length === 0) {
    const emptyMessage = document.createElement('p');

    emptyMessage.className = 'empty-bookmarks';
    emptyMessage.textContent = 'Nenhum marcador salvo.';

    bookmarksList.appendChild(emptyMessage);
    return;
  }

  bookmarks.forEach((bookmark, index) => {
    const item = document.createElement('div');
    item.className = 'bookmark-item';

    const content = document.createElement('div');
    content.className = 'bookmark-content';

    const title = document.createElement('p');
    title.className = 'bookmark-title';
    title.textContent = `Marcador ${index + 1}`;

    const position = document.createElement('span');
    position.className = 'bookmark-position';
    position.textContent = `Posição: ${bookmark.percentage}%`;

    const deleteButton = document.createElement('button');
    deleteButton.className = 'bookmark-delete';
    deleteButton.type = 'button';
    deleteButton.title = 'Excluir marcador';
    deleteButton.textContent = '×';

    content.appendChild(title);
    content.appendChild(position);

    content.addEventListener('click', () => {
      goToBookmark(bookmark);
    });

    deleteButton.addEventListener('click', () => {
      removeBookmark(bookmark.id);
    });

    item.appendChild(content);
    item.appendChild(deleteButton);

    bookmarksList.appendChild(item);
  });
}

function openBookmarksPanel() {
  if (!bookmarksPanel) return;

  renderBookmarks();
  bookmarksPanel.hidden = false;
}

function closeBookmarksPanel() {
  if (!bookmarksPanel) return;

  bookmarksPanel.hidden = true;
}

function showNotification(message) {
  if (!notification) return;

  notification.textContent = message;

  notification.classList.add('show');

  clearTimeout(notificationTimeout);

  notificationTimeout = setTimeout(() => {
    notification.classList.remove('show');
  }, 2500);
}

// CORES DAS MARCAÇÕES
const highlightColors = [
  { name: 'Apple', color: '#903F45' },
  { name: 'Viridian', color: '#618A7F' },
  { name: 'Soft Olive', color: '#B6C99B' },
  { name: 'Glaucous', color: '#6082B6' },
  { name: 'Violet', color: '#8089D2' },
  { name: 'Sweet Pink', color: '#FFA5B1' },
  { name: 'Muted Pink', color: '#D87E7E' },
  { name: 'Sunshade', color: '#FF914D' }
];

// Recupera as marcações do livro atual
function getTextHighlights() {
  if (!currentBookData) return [];

  try {
    const saved = localStorage.getItem(
      `highlights:${currentBookData.id}`
    );

    const highlights = saved ? JSON.parse(saved) : [];
    return Array.isArray(highlights) ? highlights : [];

  } catch (error) {
    console.error('Erro ao recuperar marcações:', error);
    return [];
  }
}

// Salva as marcações do livro atual
function saveTextHighlights(highlights) {
  if (!currentBookData) return;

  try {
    localStorage.setItem(
      `highlights:${currentBookData.id}`,
      JSON.stringify(highlights)
    );
  } catch (error) {
    console.error('Erro ao salvar marcações:', error);
  }
}

// Aplica uma marcação no EPUB
function applyTextHighlight(cfi, color) {
  if (!currentRendition) return;

  currentRendition.annotations.highlight(
    cfi,
    {},
    null,
    'custom-highlight',
    {
      fill: color,
      'fill-opacity': '0.45',
      'mix-blend-mode': 'multiply'
    }
  );
}

// Salva e aplica uma nova marcação
function addTextHighlight(cfi, color) {
  if (!currentBookData || !cfi || !color) return;

  const highlights = getTextHighlights();

  const alreadyExists = highlights.some(
    highlight => highlight.cfi === cfi
  );

  if (alreadyExists) {
    showNotification('Este trecho já possui uma marcação.');
    return;
  }

  const newHighlight = {
    id: `${Date.now()}-${Math.random()}`,
    cfi,
    color,
    createdAt: new Date().toISOString()
  };

  highlights.push(newHighlight);
  saveTextHighlights(highlights);
  applyTextHighlight(cfi, color);

  showNotification('Texto marcado com sucesso!');
}

let highlightToolbar = null;

function createHighlightToolbar() {
  if (highlightToolbar) return highlightToolbar;

  const toolbar = document.createElement('div');

  toolbar.id = 'highlightToolbar';

  Object.assign(toolbar.style, {
    position: 'fixed',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px',
    background: '#fff6ee',
    border: '1px solid #e4d8c9',
    borderRadius: '10px',
    boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
    zIndex: '2000',
    visibility: 'hidden'
  });

  highlightColors.forEach(item => {
    const button = document.createElement('button');

    button.type = 'button';
    button.title = `${item.name} (${item.color})`;

    Object.assign(button.style, {
      width: '25px',
      height: '25px',
      borderRadius: '50%',
      border: '1px solid rgba(0,0,0,0.15)',
      backgroundColor: item.color,
      cursor: 'pointer',
      padding: '0'
    });

    // Impede que o clique na cor desfaça a seleção do EPUB
    button.addEventListener('mousedown', event => {
      event.preventDefault();
    });

    button.addEventListener('click', () => {
      if (!selectedHighlightCfi) return;

      addTextHighlight(selectedHighlightCfi, item.color);
      hideHighlightToolbar();
    });

    toolbar.appendChild(button);
  });

  document.body.appendChild(toolbar);

  highlightToolbar = toolbar;
  return toolbar;
}

let selectedHighlightCfi = null;

function showHighlightToolbar(cfi, contents) {
  if (!cfi || !contents) return;

  selectedHighlightCfi = cfi;

  const toolbar = createHighlightToolbar();

  try {
    const range = contents.range(cfi);
    const rect = range.getBoundingClientRect();

    const frame = contents.document.defaultView.frameElement;

    if (!frame) return;

    const frameRect = frame.getBoundingClientRect();

    const top = frameRect.top + rect.top - 55;
    const left = frameRect.left + rect.left + rect.width / 2;

    toolbar.style.top = `${Math.max(8, top)}px`;
    toolbar.style.left = `${Math.max(8, Math.min(
      window.innerWidth - toolbar.offsetWidth - 8,
      left - toolbar.offsetWidth / 2
    ))}px`;

    toolbar.style.visibility = 'visible';

  } catch (error) {
    console.error('Erro ao exibir paleta de cores:', error);
  }
}

function hideHighlightToolbar() {
  selectedHighlightCfi = null;

  if (highlightToolbar) {
    highlightToolbar.style.visibility = 'hidden';
  }
}

// Salva automaticamente o progresso
function saveReadingProgress() {
    if (!currentBookData || !currentLocation) {
        return;
    }

    const progress = {
        cfi: currentLocation.cfi,
        percentage: currentLocation.percentage,
        updatedAt: new Date().toISOString()
    };

    localStorage.setItem(
        `readingProgress:${currentBookData.filePath}`,
        JSON.stringify(progress)
    );
}

// Converte a capa do EPUB em uma imagem que pode ser salva
async function getCoverAsDataURL(book) {
    let coverUrl = null;

    try {
        coverUrl = await book.coverUrl();

        if (!coverUrl) return null;

        const response = await fetch(coverUrl);

        if (!response.ok) {
            throw new Error('Não foi possível carregar a capa.');
        }

        const blob = await response.blob();

        return await new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);

            reader.readAsDataURL(blob);
        });

    } catch (error) {
        console.warn('Não foi possível extrair a capa:', error);
        return null;

    } finally {
        if (coverUrl && coverUrl.startsWith('blob:')) {
            URL.revokeObjectURL(coverUrl);
        }
    }
}


// Salva os metadados extraídos do EPUB
async function saveBookMetadata(bookData, metadata, book) {
    if (!bookData.id) return;

    try {
        const cover = await getCoverAsDataURL(book);

        const info = {
            title: metadata.title || bookData.fileName,
            author: metadata.creator || 'Autor desconhecido',
            cover
        };

        await window.electronAPI.updateBookInfo(bookData.id, info);

        console.log('Informações atualizadas:', bookData.fileName, info);

    } catch (error) {
        console.warn('Não foi possível salvar os metadados:', error);
    }
}

// Abrir livro
async function openEPUB(bookData) {
    const thisOpen = ++openGeneration;

    try {
        // Salva o progresso do livro anterior antes de trocar
        saveReadingProgress();

        // Encerra a instância anterior
        if (currentRendition) {
            currentRendition.destroy();
            currentRendition = null;
        }

        if (currentBook) {
            currentBook.destroy();
            currentBook = null;
        }

        // Define o novo livro
        currentBookData = bookData;
        currentLocation = null;
        closeBookmarksPanel();
        renderBookmarks();

        const savedProgress = getSavedProgress(bookData.filePath);

        // Atualiza a interface
        homeScreen.hidden = true;
        readerScreen.hidden = false;

        viewer.innerHTML = '';

        bookTitle.textContent = bookData.fileName;
        pageInfo.textContent = 'Carregando livro...';
        progressText.textContent = '0%';
        progressBar.style.width = '0%';

        currentFontSize = 100;

        // Converte os dados para ArrayBuffer
        const bytes = new Uint8Array(bookData.data);

        const arrayBuffer = bytes.buffer.slice(
            bytes.byteOffset,
            bytes.byteOffset + bytes.byteLength
        );

        // Cria uma instância independente do EPUB
        const book = ePub(arrayBuffer);
        currentBook = book;

        await book.ready;

        // Verifica se ainda é a abertura mais recente
        if (thisOpen !== openGeneration) return;

        await book.locations.generate(1000);

        if (thisOpen !== openGeneration) return;

        // Recupera os metadados do livro selecionado
        const metadata = await book.loaded.metadata;

        if (thisOpen !== openGeneration) return;

        bookTitle.textContent =
            metadata.title || bookData.fileName;

        // Salva os metadados associados ao livro correto
       await saveBookMetadata(bookData, metadata, book);

        if (thisOpen !== openGeneration) return;

        // Renderiza o conteúdo
        const rendition = book.renderTo(viewer, {
            width: '100%',
            height: '100%',
            flow: 'paginated',
            spread: 'auto',
            manager: 'default',
            allowScriptedContent: false
        });

        currentRendition = rendition;

        // Detecta quando o usuário seleciona um trecho do texto
        rendition.on('selected', (cfiRange, contents) => {
        if (
            thisOpen !== openGeneration ||
            currentRendition !== rendition
        ) return;

        showHighlightToolbar(cfiRange, contents);
        });

        // Recupera e reaplica as marcações salvas
        const savedHighlights = getTextHighlights();

        savedHighlights.forEach(highlight => {
        applyTextHighlight(highlight.cfi, highlight.color);
        });

        // Atualiza o progresso somente do livro atualmente aberto
        rendition.on('relocated', (location) => {
            if (
                thisOpen !== openGeneration ||
                currentBook !== book ||
                currentRendition !== rendition ||
                currentBookData !== bookData
            ) {
                return;
            }

            updateProgress(location);
        });

        // Recupera a última posição de leitura
        if (savedProgress && savedProgress.cfi) {
            await rendition.display(savedProgress.cfi);
        } else {
            await rendition.display();
        }

    } catch (error) {
        // Ignora erros de uma abertura que já foi substituída
        if (thisOpen !== openGeneration) return;

        console.error('Erro ao carregar EPUB:', error);

        alert(
            'Não foi possível carregar este livro. ' +
            'Verifique se o arquivo EPUB é válido.'
        );

        closeEPUB();
    }
}

// Atualizar progresso visual e salvar automaticamente
function updateProgress(location) {
    if (!location || !location.start || !currentBook) {
        return;
    }

    const cfi = location.start.cfi;

    // Calcula o progresso global do EPUB
    const percentage =
        currentBook.locations.percentageFromCfi(cfi) || 0;

    const percentageValue = Math.round(percentage * 100);

    // Calcula a posição global nas localizações geradas
    const position =
        currentBook.locations.locationFromCfi(cfi);

    const total =
        currentBook.locations.total;

    currentLocation = {
        cfi: cfi,
        percentage: percentage
    };

    // Atualiza a barra e o percentual
    progressBar.style.width = `${percentageValue}%`;
    progressText.textContent = `${percentageValue}%`;

    // Exibe posição contínua, em vez da página do capítulo
    pageInfo.textContent =
        `Posição ${position + 1} de ${total} • ${percentageValue}% concluído`;

    // Salva automaticamente
    saveReadingProgress();

    console.log('Progresso salvo:', currentLocation);
}

// Próxima página
function nextPage() {

  if (currentRendition) {
    currentRendition.next();
  }

}

// Página anterior
function previousPage() {

  if (currentRendition) {
    currentRendition.prev();
  }

}

// Aumentar fonte
function increaseFont() {

  if (!currentRendition) return;

  currentFontSize = Math.min(currentFontSize + 10, 200);

  currentRendition.themes.fontSize(
    `${currentFontSize}%`
  );

}

// Diminuir fonte
function decreaseFont() {

  if (!currentRendition) return;

  currentFontSize = Math.max(currentFontSize - 10, 70);

  currentRendition.themes.fontSize(
    `${currentFontSize}%`
  );

}

// Fechar livro
function closeEPUB() {
    // Invalida qualquer abertura que ainda esteja em andamento
    openGeneration++;

    // Salva a última posição antes de fechar
    saveReadingProgress();

    if (currentRendition) {
        currentRendition.destroy();
        currentRendition = null;
    }

    if (currentBook) {
        currentBook.destroy();
        currentBook = null;
    }

    currentBookData = null;
    currentLocation = null;

    if (viewer) {
        viewer.innerHTML = '';
    }

    if (readerScreen) {
        readerScreen.hidden = true;
    }

    if (homeScreen) {
        homeScreen.hidden = false;
    }

    hideHighlightToolbar();

    window.dispatchEvent(new Event('library-refresh'));
}


// Botões da interface
if (addBookmarkButton) {
  addBookmarkButton.addEventListener('click', addBookmark);
}

if (showBookmarksButton) {
  showBookmarksButton.addEventListener('click', openBookmarksPanel);
}

if (closeBookmarksButton) {
  closeBookmarksButton.addEventListener('click', closeBookmarksPanel);
}
document.getElementById('nextPage')
  .addEventListener('click', nextPage);

document.getElementById('prevPage')
  .addEventListener('click', previousPage);

document.getElementById('increaseFont')
  .addEventListener('click', increaseFont);

document.getElementById('decreaseFont')
  .addEventListener('click', decreaseFont);

document.getElementById('backButton')
  .addEventListener('click', closeEPUB);

document.getElementById('closeReader')
  .addEventListener('click', closeEPUB);
