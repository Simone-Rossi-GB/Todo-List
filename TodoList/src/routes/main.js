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

        // Verifica autenticazione per tutte le route
        const isAuth = await this.checkAuth();
        if (!isAuth) {
            console.log('Utente non autenticato - rimane sulla pagina di login');
            return; // Non fa nulla, l'utente vede già il form di login in index.html
        }

        // Esegui la route
        if (this.routes[hash]) {
            this.currentRoute = hash;
            await this.routes[hash]();
        } else {
            console.warn(`Route ${hash} non trovata`);
        }

        // Dopo aver caricato la route, assicurati che la navbar sia visibile
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.style.display = 'flex';
            console.log('✓ Navbar mostrata per route:', hash);
        }

        // Chiudi tutti i dropdown aperti
        const activeElement = document.activeElement;
        if (activeElement && activeElement.blur) {
            activeElement.blur();
        }

        // Nascondi la barra di ricerca nelle impostazioni e nel profilo
        const searchBar = document.querySelector('.input.bg-base-200');
        if (searchBar) {
            if (hash === '/settings' || hash === '/profile') {
                searchBar.style.display = 'none';
            } else {
                searchBar.style.display = 'flex';
            }
        }
    }

    navigate(path) {
        window.location.hash = path;
    }

    async start() {
        // Avvia il routing
        this.handleRoute();
    }
}

// Funzione per caricare la navbar da home.html (una sola volta)
async function loadNavbar() {
    try {
        const response = await fetch('./home/home.html');
        const html = await response.text();

        // Crea un elemento temporaneo per parsare l'HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;

        // Estrai la navbar
        const navbar = temp.querySelector('.navbar');
        if (navbar) {
            // Rimuovi navbar esistente se c'è
            const existingNavbar = document.querySelector('.navbar');
            if (existingNavbar) existingNavbar.remove();

            // Inserisci la navbar all'inizio del body
            document.body.insertBefore(navbar, document.body.firstChild);
            console.log('✓ Navbar caricata e inserita nel DOM');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Errore caricamento navbar:', error);
        return false;
    }
}

// Funzione per caricare contenuto da altre route
async function loadRoute(routeName) {
    const appContent = document.getElementById('main-app-container') || document.getElementById('app-content');
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

        // Se è la home, estrai solo il contenuto senza navbar
        if (routeName === 'home') {
            const temp = document.createElement('div');
            temp.innerHTML = html;

            // Prendi solo l'app-content dalla home, non la navbar
            const homeAppContent = temp.querySelector('#app-content');
            if (homeAppContent) {
                appContent.innerHTML = homeAppContent.innerHTML;
                console.log('✓ Contenuto home caricato (senza navbar)');
            } else {
                // Fallback: usa tutto l'HTML tranne la navbar
                const navbar = temp.querySelector('.navbar');
                if (navbar) navbar.remove();
                appContent.innerHTML = temp.innerHTML;
            }
        } else {
            // Per altre route, sostituisci direttamente il contenuto
            appContent.innerHTML = html;
        }

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

        // Carica e esegui il JavaScript della route se esiste (SOLO per route specifiche, non 'home')
        if (routeName !== 'home') {
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

// Funzione per inizializzare l'app dopo il login
async function initializeApp() {
    console.log('→ Utente autenticato, caricamento app...');

    // Nascondi il form di login (NON svuotarlo!)
    const authContainer = document.querySelector('.hero');
    if (authContainer) {
        authContainer.style.display = 'none';
    }

    // Crea container per l'app se non esiste
    let appContainer = document.getElementById('main-app-container');
    if (!appContainer) {
        appContainer = document.createElement('div');
        appContainer.id = 'main-app-container';
        document.getElementById('app-content').appendChild(appContainer);
    }
    appContainer.style.display = 'block';

    // Carica e applica configurazione all'avvio
    const config = await inizializzaConfig();

    // Carica la lingua dalla configurazione
    await carica_lingua(config.lingua);

        // Inizializza il router
        const router = new Router();

        // Definisci le route
        router.addRoute('/', async () => {
            console.log('→ Route "/" attivata');

            // Carica la navbar se non c'è già
            if (!document.querySelector('.navbar')) {
                console.log('→ Caricamento navbar...');
                await loadNavbar();

                // Configura il listener del logout (solo la prima volta)
                const logoutLink = document.querySelector('a[data-i18n="nav.logout"]');
                if (logoutLink) {
                    logoutLink.addEventListener('click', async (e) => {
                        e.preventDefault();
                        const confirmed = await showConfirm('Sei sicuro di voler effettuare il logout?', 'Conferma Logout');
                        if (confirmed) {
                            try {
                                console.log('→ Logout in corso...');

                                // Cancella il token dal backend Rust
                                await window.__TAURI__.core.invoke('logout');

                                // Pulisci solo le note dal localStorage (non tutto!)
                                localStorage.removeItem('backlog_notes');
                                localStorage.removeItem('in_progress_notes');
                                localStorage.removeItem('review_notes');
                                localStorage.removeItem('done_notes');

                                // Rimuovi la navbar
                                const navbar = document.querySelector('.navbar');
                                if (navbar) navbar.remove();

                                // RIMUOVI completamente il container dell'app
                                const appContainer = document.getElementById('main-app-container');
                                if (appContainer) {
                                    appContainer.remove();
                                }

                                // RIPRISTINA completamente l'HTML originale di index.html
                                const appContent = document.getElementById('app-content');
                                if (appContent) {
                                    // Ricarica l'HTML originale del form di login
                                    appContent.innerHTML = `
                                        <div class="hero min-h-screen bg-gradient-to-br from-primary/10 via-base-200 to-secondary/10">
                                            <div class="hero-content flex-col lg:flex-row-reverse max-w-5xl gap-12">
                                                <div class="text-center lg:text-left">
                                                    <h1 class="text-6xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">TodoList</h1>
                                                    <p class="text-xl text-base-content/80 leading-relaxed">Accedi per gestire i tuoi task in modo efficiente e produttivo</p>
                                                </div>
                                                <div class="card flex-shrink-0 w-full max-w-md shadow-2xl bg-base-100 border border-base-300">
                                                    <div class="card-body">
                                                        <div class="tabs tabs-boxed mb-4">
                                                            <a class="tab tab-active" id="login-tab">Login</a>
                                                            <a class="tab" id="register-tab">Registrati</a>
                                                        </div>

                                                        <!-- Login Form -->
                                                        <div id="login-form">
                                                            <div class="form-control">
                                                                <label class="label">
                                                                    <span class="label-text">Email</span>
                                                                </label>
                                                                <input type="email" placeholder="email" class="input input-bordered" id="input_email" required />
                                                            </div>
                                                            <div class="form-control">
                                                                <label class="label">
                                                                    <span class="label-text">Password</span>
                                                                </label>
                                                                <input type="password" placeholder="password" class="input input-bordered" id="input_password" required />
                                                                <label class="label">
                                                                    <a href="#" class="label-text-alt link link-hover" id="forgot-password-link">Password dimenticata?</a>
                                                                </label>
                                                            </div>
                                                            <div class="form-control mt-6">
                                                                <button class="btn btn-primary" id="btn_login">Login</button>
                                                            </div>
                                                            <!-- Alert per errori/successi -->
                                                            <div id="auth-alert" class="alert mt-4" style="display: none;">
                                                                <span id="auth-alert-text"></span>
                                                            </div>
                                                        </div>

                                                        <!-- Register Form (hidden by default) -->
                                                        <div id="register-form" style="display: none;">
                                                            <div class="form-control">
                                                                <label class="label">
                                                                    <span class="label-text">Nome</span>
                                                                </label>
                                                                <input type="text" placeholder="nome" class="input input-bordered" id="register_name" required />
                                                            </div>
                                                            <div class="form-control">
                                                                <label class="label">
                                                                    <span class="label-text">Username</span>
                                                                </label>
                                                                <input type="text" placeholder="username" class="input input-bordered" id="register_username" required />
                                                            </div>
                                                            <div class="form-control">
                                                                <label class="label">
                                                                    <span class="label-text">Email</span>
                                                                </label>
                                                                <input type="email" placeholder="email" class="input input-bordered" id="register_email" required />
                                                            </div>
                                                            <div class="form-control">
                                                                <label class="label">
                                                                    <span class="label-text">Password</span>
                                                                </label>
                                                                <input type="password" placeholder="password" class="input input-bordered" id="register_password" required />
                                                            </div>
                                                            <div class="form-control mt-6">
                                                                <button class="btn btn-primary" id="btn_register">Registrati</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }

                                // RIPRISTINA il tema di default (light)
                                document.documentElement.setAttribute('data-theme', 'light');

                                // RESET configurazione globale ai defaults
                                window.appConfig = {
                                    temaScuro: false,
                                    autoScroll: true,
                                    lingua: 'it',
                                    hasFotoProfilo: false
                                };

                                // Reinizializza il form di login con i nuovi elementi
                                setTimeout(() => {
                                    initAuthForm();
                                }, 100);

                                console.log('✓ Logout completato');
                            } catch (error) {
                                console.error('Errore durante il logout:', error);
                                await showMessage('Errore durante il logout', 'Errore', 'error');
                            }
                        }
                    });
                    console.log('✓ Logout listener configurato');
                }
            } else {
                console.log('✓ Navbar già presente');
            }

            // Carica il contenuto della home (senza navbar)
            await loadRoute('home');
            console.log('→ HTML home caricato');

            // Dopo che l'HTML è stato caricato, inizializza la home page
            setTimeout(() => {
                console.log('→ Inizializzazione home page...');

                try {
                    // Mostra la navbar
                    const navbar = document.querySelector('.navbar');
                    if (navbar) {
                        navbar.style.display = 'flex';
                        console.log('✓ Navbar mostrata');
                    } else {
                        console.warn('⚠ Navbar non trovata');
                    }

                    // Mostra il contenuto
                    const appContent = document.getElementById('app-content');
                    if (appContent) {
                        appContent.style.display = 'block';
                        console.log('✓ App content mostrato');
                    }

                    initHomePage();
                    console.log('✓ initHomePage completato');

                    // Ricarica note dal localStorage
                    console.log('→ Caricamento note dal localStorage...');
                    loadNotesFromLocalStorage('backlog_notes', 'backlog');
                    loadNotesFromLocalStorage('in_progress_notes', 'in_progress');
                    loadNotesFromLocalStorage('review_notes', 'review');
                    loadNotesFromLocalStorage('done_notes', 'done');

                    console.log('✅ Home route loaded completamente!');
                } catch (error) {
                    console.error('❌ Errore durante inizializzazione home:', error);
                }
            }, 200);
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

    // Avvia il router (questo caricherà la route in base all'hash)
    // Il router si occuperà di caricare home.html e mostrare navbar/content
    console.log('→ Avvio router...');
    router.start();
}

// Inizializzazione al caricamento della pagina
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('=== AVVIO APP ===');

        // Verifica autenticazione
        let isAuthenticated = false;
        try {
            const token = await window.__TAURI__.core.invoke('get_saved_token');
            if (token && token.length > 0) {
                isAuthenticated = true;
                console.log('✓ UTENTE AUTENTICATO - Token trovato');
            } else {
                console.log('✗ Token vuoto - Login richiesto');
            }
        } catch (error) {
            isAuthenticated = false;
            console.log('✗ UTENTE NON AUTENTICATO - Login richiesto');
        }

        // Se non è autenticato, inizializza solo il form di login
        if (!isAuthenticated) {
            console.log('→ Caricamento form di login...');
            initAuthForm();
            return; // Esci qui, non serve inizializzare il resto
        }

        // Se è autenticato, inizializza l'app
        await initializeApp();

    } catch (error) {
        console.error('❌ ERRORE CRITICO durante inizializzazione:', error);
        // Mostra un messaggio di errore all'utente
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #1a1a1a; color: white; flex-direction: column; gap: 20px;">
                <h1 style="color: #ff4444;">Errore di inizializzazione</h1>
                <p style="max-width: 500px; text-align: center;">${error.message || error}</p>
                <button onclick="window.location.reload()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">Riprova</button>
            </div>
        `;
    }
});

// ==================== GESTIONE FORM AUTENTICAZIONE ====================

function initAuthForm() {
    console.log('=== INIT AUTH FORM ===');

    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    const btnLogin = document.getElementById('btn_login');
    const btnRegister = document.getElementById('btn_register');

    console.log('Elementi form:', {
        loginTab, registerTab, loginForm, registerForm, btnLogin, btnRegister
    });

    if (!btnLogin || !btnRegister) {
        console.error('ERRORE: Pulsanti non trovati!');
        return;
    }

    const inputEmail = document.getElementById('input_email');
    const inputPassword = document.getElementById('input_password');

    const registerName = document.getElementById('register_name');
    const registerEmail = document.getElementById('register_email');
    const registerPassword = document.getElementById('register_password');

    const authAlert = document.getElementById('auth-alert');
    const authAlertText = document.getElementById('auth-alert-text');

    console.log('Tutti gli elementi trovati ✓');

    function showAlert(message, type = 'error') {
        authAlert.style.display = 'flex';
        authAlert.className = `alert mt-4 alert-${type}`;
        authAlertText.textContent = message;

        setTimeout(() => {
            authAlert.style.display = 'none';
        }, 5000);
    }

    function hideAlert() {
        authAlert.style.display = 'none';
    }

    // Toggle tra login e registrazione
    if (loginTab && registerTab) {
        loginTab.addEventListener('click', () => {
            loginTab.classList.add('tab-active');
            registerTab.classList.remove('tab-active');
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            hideAlert();
        });

        registerTab.addEventListener('click', () => {
            registerTab.classList.add('tab-active');
            loginTab.classList.remove('tab-active');
            registerForm.style.display = 'block';
            loginForm.style.display = 'none';
            hideAlert();
        });
    }

    // Login
    btnLogin.addEventListener('click', async () => {
        const email = inputEmail.value.trim();
        const password = inputPassword.value.trim();

        if (!email || !password) {
            showAlert('Inserisci email e password', 'warning');
            return;
        }

        try {
            btnLogin.disabled = true;
            btnLogin.textContent = 'Accesso in corso...';

            const result = await window.__TAURI__.core.invoke('login', {
                email: email,
                password: password
            });

            console.log('Login OK:', result);
            showAlert('Login effettuato! Caricamento app...', 'success');

            // Carica note da Supabase
            try {
                const token = await window.__TAURI__.core.invoke('get_saved_token');
                const notes = await window.__TAURI__.core.invoke('load_notes', { token });
                console.log('Note caricate da Supabase:', notes.length);

                const backlog = notes.filter(n => n.status === 'backlog');
                const in_progress = notes.filter(n => n.status === 'in_progress');
                const review = notes.filter(n => n.status === 'review');
                const done = notes.filter(n => n.status === 'done');

                const mapNotes = (notesList) => notesList.map(n => ({
                    id: n.id,
                    title: n.title,
                    description: n.description
                }));

                window.SaveToLocalStorage('backlog_notes', mapNotes(backlog));
                window.SaveToLocalStorage('in_progress_notes', mapNotes(in_progress));
                window.SaveToLocalStorage('review_notes', mapNotes(review));
                window.SaveToLocalStorage('done_notes', mapNotes(done));

                console.log('Note sincronizzate nel localStorage');
            } catch (syncError) {
                console.error('Errore sincronizzazione note:', syncError);
            }

            // Inizializza l'app senza reload
            console.log('Inizializzazione app...');
            await initializeApp();

        } catch (error) {
            console.error('Errore login:', error);
            showAlert(error, 'error');
        } finally {
            btnLogin.disabled = false;
            btnLogin.textContent = 'Login';
        }
    });

    // Registrazione
    btnRegister.addEventListener('click', async () => {
        const name = registerName.value.trim();
        const username = document.getElementById('register_username').value.trim();
        const email = registerEmail.value.trim();
        const password = registerPassword.value.trim();

        if (!name || !username || !email || !password) {
            showAlert('Compila tutti i campi', 'warning');
            return;
        }

        try {
            btnRegister.disabled = true;
            btnRegister.textContent = 'Registrazione in corso...';

            const result = await window.__TAURI__.core.invoke('register', {
                email: email,
                password: password,
                name: name,
                username: username
            });

            console.log('Registrazione OK:', result);
            showAlert(result, 'success');

            setTimeout(() => {
                loginTab.click();
                inputEmail.value = email;
            }, 2000);

        } catch (error) {
            console.error('Errore registrazione:', error);
            showAlert(error, 'error');
        } finally {
            btnRegister.disabled = false;
            btnRegister.textContent = 'Registrati';
        }
    });

    // Supporto tasto Enter
    inputPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btnLogin.click();
    });

    registerPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btnRegister.click();
    });

    // Password dimenticata
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', async (e) => {
            e.preventDefault();

            // Chiedi email con un dialog custom
            const email = await promptForEmail();
            if (!email) return;

            try {
                const result = await window.__TAURI__.core.invoke('recover_password', { email });
                await window.showMessage(result, 'Successo', 'success');
            } catch (error) {
                console.error('Errore recupero password:', error);
                await window.showMessage('Errore: ' + error, 'Errore', 'error');
            }
        });
    }
}

// Helper per chiedere l'email
async function promptForEmail() {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;';

        const dialog = document.createElement('div');
        dialog.className = 'card bg-base-100 shadow-xl';
        dialog.style.cssText = 'width: 400px; padding: 30px;';

        dialog.innerHTML = `
            <h2 class="text-xl font-bold mb-4">Recupero Password</h2>
            <p class="mb-4">Inserisci la tua email per ricevere il link di reset:</p>
            <div class="form-control mb-4">
                <input type="email" id="recover-email" class="input input-bordered" placeholder="email@esempio.com">
            </div>
            <div class="flex justify-end gap-2">
                <button class="btn btn-ghost" id="btn-cancel-recover">Annulla</button>
                <button class="btn btn-primary" id="btn-send-recover">Invia</button>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        const emailInput = dialog.querySelector('#recover-email');

        dialog.querySelector('#btn-cancel-recover').addEventListener('click', () => {
            overlay.remove();
            resolve(null);
        });

        dialog.querySelector('#btn-send-recover').addEventListener('click', () => {
            const email = emailInput.value.trim();
            overlay.remove();
            resolve(email || null);
        });

        emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const email = emailInput.value.trim();
                overlay.remove();
                resolve(email || null);
            }
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                resolve(null);
            }
        });
    });
}

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