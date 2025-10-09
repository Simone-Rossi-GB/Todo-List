// JavaScript specifico per Auth
console.log('Auth page loaded');

// ==================== ELEMENTI DOM ====================
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

const btnLogin = document.getElementById('btn_login');
const btnRegister = document.getElementById('btn_register');

const inputEmail = document.getElementById('input_email');
const inputPassword = document.getElementById('input_password');

const registerName = document.getElementById('register_name');
const registerEmail = document.getElementById('register_email');
const registerPassword = document.getElementById('register_password');

const authAlert = document.getElementById('auth-alert');
const authAlertText = document.getElementById('auth-alert-text');

// ==================== FUNZIONI HELPER ====================

function showAlert(message, type = 'error') {
    authAlert.style.display = 'flex';
    authAlert.className = `alert mt-4 alert-${type}`;
    authAlertText.textContent = message;

    // Nascondi dopo 5 secondi
    setTimeout(() => {
        authAlert.style.display = 'none';
    }, 5000);
}

function hideAlert() {
    authAlert.style.display = 'none';
}

// ==================== TOGGLE TRA LOGIN E REGISTRAZIONE ====================

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

// ==================== LOGIN ====================

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

        // Chiama il comando Rust
        const result = await window.__TAURI__.core.invoke('login', {
            email: email,
            password: password
        });

        console.log('Login OK:', result);
        showAlert('Login effettuato! Sincronizzazione note...', 'success');

        // Carica note da Supabase e sincronizza localStorage
        try {
            const token = await window.__TAURI__.core.invoke('get_saved_token');
            const notes = await window.__TAURI__.core.invoke('load_notes', { token });
            console.log('Note caricate da Supabase:', notes.length);

            // Raggruppa per stato
            const backlog = notes.filter(n => n.status === 'backlog');
            const in_progress = notes.filter(n => n.status === 'in_progress');
            const review = notes.filter(n => n.status === 'review');
            const done = notes.filter(n => n.status === 'done');

            // Salva nel localStorage (usa le funzioni globali)
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
            // Continua comunque con il login
        }

        // Dopo 2 secondi, vai alla home
        setTimeout(() => {
            window.location.hash = '/';
        }, 2000);

    } catch (error) {
        console.error('Errore login:', error);
        showAlert(error, 'error');
    } finally {
        btnLogin.disabled = false;
        btnLogin.textContent = 'Login';
    }
});

// ==================== REGISTRAZIONE ====================

btnRegister.addEventListener('click', async () => {
    const name = registerName.value.trim();
    const email = registerEmail.value.trim();
    const password = registerPassword.value.trim();

    if (!name || !email || !password) {
        showAlert('Compila tutti i campi', 'warning');
        return;
    }

    try {
        btnRegister.disabled = true;
        btnRegister.textContent = 'Registrazione in corso...';

        // Chiama il comando Rust
        const result = await window.__TAURI__.core.invoke('register', {
            email: email,
            password: password,
            name: name
        });

        console.log('Registrazione OK:', result);
        showAlert(result, 'success');

        // Dopo 2 secondi, passa al tab login
        setTimeout(() => {
            loginTab.click();
            // Pre-compila l'email
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

// ==================== SUPPORTO ENTER KEY ====================

inputPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        btnLogin.click();
    }
});

registerPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        btnRegister.click();
    }
});
