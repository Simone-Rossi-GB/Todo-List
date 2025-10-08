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
        showAlert(result, 'success');

        // Dopo 1 secondo, vai alla home
        setTimeout(() => {
            window.location.hash = '/';
        }, 1000);

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
