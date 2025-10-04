import { aggiungiNota_run } from './code/aggiungi_nota.js';

// Sistema di routing SPA
class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;

        // Ascolta i cambiamenti di hash
        window.addEventListener('hashchange', () => this.handleRoute());
    }

    addRoute(path, handler) {
        this.routes[path] = handler;
    }

    async handleRoute() {
        const hash = window.location.hash.slice(1) || '/';
        console.log('Navigating to:', hash);

        if (this.routes[hash]) {
            this.currentRoute = hash;
            await this.routes[hash]();
        } else {
            console.warn(`Route ${hash} non trovata`);
        }
    }

    navigate(path) {
        window.location.hash = path;
    }

    start() {
        this.handleRoute();
    }
}

// Variabile per salvare il contenuto originale della home
let originalHomeContent = '';

// Funzione per caricare contenuto da altre route
async function loadRoute(routeName) {
    const appContent = document.getElementById('app-content');
    console.log('Loading route:', routeName);

    try {
        // Carica l'HTML della route - usa il nome della cartella per i file
        const htmlPath = `./${routeName}/${routeName}.html`;
        console.log('Fetching HTML from:', htmlPath);

        const response = await fetch(htmlPath);
        if (!response.ok) {
            throw new Error(`Route ${routeName} non trovata (${response.status})`);
        }

        const html = await response.text();
        console.log('HTML loaded successfully');

        // Sostituisci direttamente il contenuto
        appContent.innerHTML = html;

        // Carica CSS della route se esiste
        const existingRouteStyle = document.querySelector('#route-styles');
        if (existingRouteStyle) existingRouteStyle.remove();

        const cssPath = `./${routeName}/${routeName}.css`;
        const cssResponse = await fetch(cssPath);
        if (cssResponse.ok) {
            const linkElement = document.createElement('link');
            linkElement.id = 'route-styles';
            linkElement.rel = 'stylesheet';
            linkElement.href = cssPath;
            document.head.appendChild(linkElement);
            console.log('CSS loaded from:', cssPath);
        }

        // Carica e esegui il JavaScript della route se esiste
        const jsPath = `./${routeName}/${routeName}.js`;
        const scriptResponse = await fetch(jsPath);
        if (scriptResponse.ok) {
            const scriptText = await scriptResponse.text();
            // Rimuovi import statements per evitare errori
            const scriptWithoutImports = scriptText.replace(/import .* from .*;/g, '');
            const script = document.createElement('script');
            script.type = 'module';
            script.textContent = scriptWithoutImports;
            document.body.appendChild(script);
            console.log('JS loaded from:', jsPath);
        }

    } catch (error) {
        console.error('Errore nel caricamento della route:', error);
        appContent.innerHTML = `<div class="todo-container p-6 elemento-centrato"><div class="alert alert-error"><span>Errore: ${error.message}</span></div></div>`;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Salva il contenuto originale della home
    originalHomeContent = document.getElementById('app-content').innerHTML;

    // Inizializza il router
    const router = new Router();

    // Definisci le route
    router.addRoute('/', async () => {
        // Route home - ripristina contenuto originale
        const appContent = document.getElementById('app-content');
        appContent.innerHTML = originalHomeContent;

        // Riattiva la logica della home
        aggiungiNota_run();
        console.log('Home route loaded');
    });

    router.addRoute('/backlog', async () => {
        await loadRoute('backlog');
    });

    router.addRoute('/in_progress', async () => {
        await loadRoute('in_progress');
    });

    router.addRoute('/review', async () => {
        await loadRoute('review');
    });

    router.addRoute('/done', async () => {
        await loadRoute('done');
    });

    router.addRoute('/note', async () => {
        await loadRoute('note');
    });

    router.addRoute('/profile', async () => {
        await loadRoute('profile');
    });

    router.addRoute('/settings', async () => {
        await loadRoute('settings');
    });

    router.addRoute('/auth', async () => {
        await loadRoute('auth');
    });

    // Avvia il router
    router.start();
    // Mappa per tracciare lo stato hover di ogni colonna
    const columnHoverStates = new Map();

    // Aggiungi event listener a tutte le card
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Non navigare se si clicca su un pulsante
            if (e.target.classList.contains('btn')) {
                return;
            }
            
            // Trova la colonna parent
            const column = card.closest('.todo-list');
            const columnId = column ? column.id : '';

            // Naviga alla pagina della colonna (da implementare)
            // Per ora mostra un alert
            console.log(`Navigazione alla colonna: ${columnId}`);
            // window.location.href = `column.html?id=${columnId}&card=${card.dataset.id}`;
        });

        // Gestisci hover sulla card
        card.addEventListener('mouseenter', function() {
            const listContent = card.closest('.todo-list-content');
            if (listContent) {
                columnHoverStates.set(listContent, true);
            }
        });

        card.addEventListener('mouseleave', function() {
            const listContent = card.closest('.todo-list-content');
            if (listContent) {
                columnHoverStates.set(listContent, false);
            }
        });
    });

    // Auto-scroll carosello per ogni colonna
    const todoLists = document.querySelectorAll('.todo-list-content');

    todoLists.forEach(list => {
        let scrollDirection = 1; // 1 = giù, -1 = su
        let autoScrollInterval = null;
        let userScrollTimeout = null;
        let isUserScrolling = false;

        // Conta il numero di card nella colonna
        const cardCount = list.querySelectorAll('.card').length;

        // Disabilita scroll se ci sono 3 o meno note
        if (cardCount <= 3) {
            list.style.overflowY = 'hidden';
            return; // Non continuare con il setup dell'auto-scroll
        }

        // Funzione per auto-scroll
        function startAutoScroll() {
            if (autoScrollInterval) return;

            autoScrollInterval = setInterval(() => {
                if (isUserScrolling) return;

                // Ferma auto-scroll se l'utente è in hover su una card
                if (columnHoverStates.get(list)) return;

                const maxScroll = list.scrollHeight - list.clientHeight;

                // Scorri verso il basso
                if (scrollDirection === 1) {
                    list.scrollTop += 1;

                    // Se raggiungiamo il fondo, cambia direzione
                    if (list.scrollTop >= maxScroll - 5) {
                        scrollDirection = -1;
                    }
                }
                // Scorri verso l'alto
                else {
                    list.scrollTop -= 1;

                    // Se raggiungiamo la cima, cambia direzione
                    if (list.scrollTop <= 5) {
                        scrollDirection = 1;
                    }
                }
            }, 50); // Velocità scroll (ms)
        }

        // Ferma auto-scroll quando l'utente scrolla manualmente
        list.addEventListener('wheel', () => {
            isUserScrolling = true;
            clearInterval(autoScrollInterval);
            autoScrollInterval = null;

            // Riprendi auto-scroll dopo 3 secondi di inattività
            clearTimeout(userScrollTimeout);
            userScrollTimeout = setTimeout(() => {
                isUserScrolling = false;
                startAutoScroll();
            }, 3000);
        });

        // Ferma auto-scroll quando l'utente usa la scrollbar
        list.addEventListener('scroll', (e) => {
            if (!autoScrollInterval) {
                isUserScrolling = true;

                clearTimeout(userScrollTimeout);
                userScrollTimeout = setTimeout(() => {
                    isUserScrolling = false;
                    startAutoScroll();
                }, 3000);
            }
        });

        // Avvia auto-scroll iniziale
        startAutoScroll();
    });

    //test
    aggiungiNota_run();

    // Gestione chiusura dropdown al secondo click
    const dropdowns = document.querySelectorAll('.dropdown');

    dropdowns.forEach(dropdown => {
        const button = dropdown.querySelector('[tabindex="0"]');
        let isOpen = false;

        button.addEventListener('click', function(e) {
            if (isOpen) {
                // Se è già aperto, chiudilo
                this.blur();
                isOpen = false;
            } else {
                // Se è chiuso, aprilo
                isOpen = true;
            }
        });

        // Rileva quando il dropdown si chiude (perdita di focus)
        button.addEventListener('blur', function() {
            setTimeout(() => {
                isOpen = false;
            }, 200);
        });
    });
});
