// JavaScript specifico per Auth
console.log('Auth page loaded');

// Toggle tra login e registrazione
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

if (loginTab && registerTab) {
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('tab-active');
        registerTab.classList.remove('tab-active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    });

    registerTab.addEventListener('click', () => {
        registerTab.classList.add('tab-active');
        loginTab.classList.remove('tab-active');
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
    });
}
