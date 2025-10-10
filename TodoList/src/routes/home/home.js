import { aggiungiNota_run, LoadFromLocalStorage, creaCard, SaveToLocalStorage } from './code/aggiungi_nota.js';
import { inizializzaConfig } from './code/salva_configurazione.js';
import { ricercaNote_run } from './code/ricerca_note.js';
import { gestioneCard_run } from './code/gestione_card.js';
import { carica_lingua } from './code/carica_lingua.js';
import { loadNotesFromSupabase } from './code/supabase_helper.js';
import { showConfirm, showMessage } from './code/dialog_helper.js';

// Rendi funzioni disponibili globalmente
window.carica_lingua = carica_lingua;
window.LoadFromLocalStorage = LoadFromLocalStorage;
window.SaveToLocalStorage = SaveToLocalStorage;
window.showConfirm = showConfirm;
window.showMessage = showMessage;

// Sistema di routing SPA
class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.isAuthenticated = false;

        // Ascolta i cambiamenti di hash
        window.addEventListener('hashchange', () => this.handleRoute());
    }

    addRoute(path, handler) {
        this.routes[path] = handler;
    }

    async checkAuth() {
        try {
            await window.__TAURI__.core.invoke('get_saved_token');
            this.isAuthenticated = true;
            return true;
        } catch (error) {
            this.isAuthenticated = false;
            return false;
        }
    }

    async handleRoute() {
        const hash = window.location.hash.slice(1) || '/';
        console.log('Navigating to:', hash);

        // Verifica autenticazione per tutte le route tranne /home
        if (hash !== '/home') {
            const isAuth = await this.checkAuth();
            if (!isAuth) {
                console.log('Utente non autenticato, reindirizzamento a /home');
                window.location.hash = '/home';
                return;
            }
        }

        // Mostra/nascondi navbar in base all'autenticazione
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (hash === '/home' || !this.isAuthenticated) {
                navbar.style.display = 'none';
            } else {
                navbar.style.display = 'flex';
            }
        }

        // Chiudi tutti i dropdown aperti
        const activeElement = document.activeElement;
        if (activeElement && activeElement.blur) {
            activeElement.blur();
        }

        // Nascondi la barra di ricerca nelle impostazioni e nel profilo
        const searchBar = document.querySelector('.input.bg-base-200');
        if (searchBar) {
            if (hash === '/settings' || hash === '/profile' || hash === '/home') {
                searchBar.style.display = 'none';
            } else {
                searchBar.style.display = 'flex';
            }
        }

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

    async start() {
        // Verifica autenticazione all'avvio
        const isAuth = await this.checkAuth();
        if (!isAuth && window.location.hash.slice(1) !== '/home') {
            window.location.hash = '/home';
        }
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
        // Carica l'HTML della route
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

        // Applica traduzioni alla nuova route
        const currentLang = window.appConfig?.lingua || 'it';
        await carica_lingua(currentLang);

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

// Funzione per inizializzare la home page
function initHomePage() {
    // Mappa per tracciare lo stato hover di ogni colonna
    const columnHoverStates = new Map();

    // Gestisci hover sulla card
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
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
        let scrollDirection = 1;
        let autoScrollInterval = null;
        let userScrollTimeout = null;
        let isUserScrolling = false;

        function checkScrollable() {
            const cardCount = list.querySelectorAll('.card').length;

            // Abilita/disabilita scroll in base al numero di carte
            if (cardCount <= 3) {
                list.style.overflowY = 'hidden';
                if (autoScrollInterval) {
                    clearInterval(autoScrollInterval);
                    autoScrollInterval = null;
                }
            } else {
                list.style.overflowY = 'auto';
                if (!autoScrollInterval && !isUserScrolling) {
                    startAutoScroll();
                }
            }
        }

        function startAutoScroll() {
            // Controlla se autoscroll è abilitato nelle impostazioni
            if (!window.appConfig || !window.appConfig.autoScroll) {
                console.log('Autoscroll disabilitato dalle impostazioni');
                return;
            }

            const cardCount = list.querySelectorAll('.card').length;
            if (cardCount <= 3) return; // Non avviare se poche carte

            if (autoScrollInterval) return;

            autoScrollInterval = setInterval(() => {
                if (isUserScrolling) return;
                if (columnHoverStates.get(list)) return;

                const maxScroll = list.scrollHeight - list.clientHeight;

                if (scrollDirection === 1) {
                    list.scrollTop += 1;
                    if (list.scrollTop >= maxScroll - 5) {
                        scrollDirection = -1;
                    }
                } else {
                    list.scrollTop -= 1;
                    if (list.scrollTop <= 5) {
                        scrollDirection = 1;
                    }
                }
            }, 50);
        }

        // Osserva quando vengono aggiunte/rimosse card
        const observer = new MutationObserver(() => {
            checkScrollable();
        });

        observer.observe(list, {
            childList: true,
            subtree: false
        });

        list.addEventListener('wheel', () => {
            isUserScrolling = true;
            clearInterval(autoScrollInterval);
            autoScrollInterval = null;

            clearTimeout(userScrollTimeout);
            userScrollTimeout = setTimeout(() => {
                isUserScrolling = false;
                startAutoScroll();
            }, 3000);
        });

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

        // Check iniziale e avvio
        checkScrollable();
    });

    // Riattiva la funzione di aggiunta note
    aggiungiNota_run();

    // Attiva la ricerca note
    ricercaNote_run();

    // Attiva gestione card (Sposta/Elimina)
    gestioneCard_run();

    // Gestione chiusura dropdown al secondo click
    const dropdowns = document.querySelectorAll('.dropdown');

    dropdowns.forEach(dropdown => {
        const button = dropdown.querySelector('[tabindex="0"]');
        if (!button) return;

        let isOpen = false;

        button.addEventListener('click', function(e) {
            if (isOpen) {
                this.blur();
                isOpen = false;
            } else {
                isOpen = true;
            }
        });

        button.addEventListener('blur', function() {
            setTimeout(() => {
                isOpen = false;
            }, 200);
        });
    });
}

// Inizializzazione al caricamento della pagina
document.addEventListener('DOMContentLoaded', async function() {
    // Verifica autenticazione prima di tutto
    let isAuthenticated = false;
    try {
        await window.__TAURI__.core.invoke('get_saved_token');
        isAuthenticated = true;
    } catch (error) {
        isAuthenticated = false;
    }

    // Carica e applica configurazione all'avvio
    const config = await inizializzaConfig();

    // Carica la lingua dalla configurazione
    await carica_lingua(config.lingua);

    // Inizializza il router
    const router = new Router();

    // Definisci le route
    router.addRoute('/', async () => {
        // Ricarica configurazione
        const config = await inizializzaConfig();

        // Route home - ripristina contenuto originale
        const appContent = document.getElementById('app-content');
        appContent.innerHTML = originalHomeContent;

        // Applica traduzioni
        await carica_lingua(config.lingua);

        // Reinizializza la home page
        initHomePage();

        // Ricarica note dal localStorage
        loadNotesFromLocalStorage('backlog_notes', 'backlog');
        loadNotesFromLocalStorage('in_progress_notes', 'in_progress');
        loadNotesFromLocalStorage('review_notes', 'review');
        loadNotesFromLocalStorage('done_notes', 'done');

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

    router.addRoute('/home', async () => {
        await loadRoute('home');
    });

    // Salva il contenuto originale della home (senza note, verranno caricate dalla route)
    originalHomeContent = document.getElementById('app-content').innerHTML;

    // Gestisci click sul logout nella navbar
    const logoutLink = document.querySelector('a[href="#/home"][data-i18n="nav.logout"]');
    if (logoutLink) {
        logoutLink.addEventListener('click', async (e) => {
            e.preventDefault();

            const confirmed = await showConfirm('Sei sicuro di voler effettuare il logout?', 'Conferma Logout');
            if (confirmed) {
                try {
                    await window.__TAURI__.core.invoke('logout');

                    // Cancella localStorage
                    localStorage.clear();

                    // Nascondi navbar
                    const navbar = document.querySelector('.navbar');
                    if (navbar) navbar.style.display = 'none';

                    // Reindirizza ad home
                    router.isAuthenticated = false;
                    window.location.hash = '/home';
                } catch (error) {
                    console.error('Errore durante il logout:', error);
                    await showMessage('Errore durante il logout', 'Errore', 'error');
                }
            }
        });
    }

    // Se non è autenticato, carica subito la pagina home
    if (!isAuthenticated) {
        // Carica immediatamente la pagina di autenticazione
        window.location.hash = '/';
        await loadRoute('home');
        // Mostra il contenuto dell'app
        document.getElementById('app-content').style.display = 'block';
    } else {
        // È autenticato, mostra navbar e contenuto home
        const navbar = document.querySelector('.navbar');
        if (navbar) navbar.style.display = 'flex';
        document.getElementById('app-content').style.display = 'block';
    }

    // Avvia il router (questo caricherà la route in base all'hash)
    router.start();
});

// Caricamento note da localStorage
export const loadNotesFromLocalStorage = (key, section) => {
    const notes = LoadFromLocalStorage(key)
    console.log(notes)
    notes.forEach((note) => {
        const colonnaStato = document.getElementById(section);
        const listaDoveAggiungere = colonnaStato.querySelector('.todo-list-content');
        const card = creaCard(note.title, note.description, section, note.id);
        if (note.id) card.dataset.noteId = note.id;  // Salva l'ID nella card
        listaDoveAggiungere.appendChild(card);
    })
}

// Rendi disponibile globalmente DOPO la definizione
window.loadNotesFromLocalStorage = loadNotesFromLocalStorage;