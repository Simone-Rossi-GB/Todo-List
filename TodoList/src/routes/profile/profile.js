// JavaScript specifico per Profile
const invoke = window.__TAURI__.core.invoke;

console.log('Profile page loaded');

// Usa la funzione showMessage globale
const showMessage = window.showMessage;

// Carica foto profilo
async function caricaFotoProfiloProfilo() {
    try {
        const { appConfigDir, join } = window.__TAURI__.path;
        const { readFile, exists } = window.__TAURI__.fs;

        const configDir = await appConfigDir();

        // Cerca l'avatar con diverse estensioni
        const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

        for (const ext of extensions) {
            const avatarPath = await join(configDir, `avatar.${ext}`);
            const fileExists = await exists(avatarPath);

            if (fileExists) {
                const fileData = await readFile(avatarPath);
                const blob = new Blob([fileData], { type: `image/${ext}` });
                const url = URL.createObjectURL(blob);

                const avatar = document.getElementById('profile-avatar');
                if (avatar) {
                    avatar.src = url;
                    console.log('Foto profilo caricata in profile');
                }
                break;
            }
        }
    } catch (error) {
        console.log('Nessuna foto profilo trovata o errore nel caricamento:', error);
    }
}

async function getDatiUtente() {
    const metadata = window.userMetadata || JSON.parse(localStorage.getItem('user_metadata') || '{}');

    if (!metadata.email) {
        const token = await invoke('get_saved_token');
        const supabaseUserMetadata = await invoke('get_user_metadata', { token });
        window.userMetadata = supabaseUserMetadata;
        return supabaseUserMetadata;
    }

    return metadata;
}

// Carica dati utente (email, nome e username) da Supabase
async function caricaDatiUtente() {
    try {
        const userInfo = await getDatiUtente();

        // Mostra email
        const emailElement = document.getElementById('profile-email');
        if (emailElement) {
            emailElement.textContent = userInfo.email;
        }

        // Mostra nome completo se presente
        if (userInfo.name) {
            const displayNameElement = document.getElementById('display_name');
            if (displayNameElement) {
                displayNameElement.textContent = userInfo.name;
            }

            // Pre-compila l'input del nome
            const nomeInput = document.getElementById('profile-nome-utente');
            if (nomeInput) {
                nomeInput.value = userInfo.name;
            }
        }

        // Mostra username se presente
        if (userInfo.username) {
            const displayUsernameElement = document.getElementById('display_username');
            if (displayUsernameElement) {
                displayUsernameElement.textContent = '@' + userInfo.username;
            }

            // Pre-compila l'input dell'username
            const usernameInput = document.getElementById('profile-username');
            if (usernameInput) {
                usernameInput.value = userInfo.username;
            }
        }

        console.log('Dati utente caricati:', userInfo);
    } catch (error) {
        console.error('Errore nel caricamento dati utente:', error);
    }
}

// Salva modifiche (nome, username e/o password)
async function salvaModifiche() {
    const nuovoNome = document.getElementById('profile-nome-utente').value.trim();
    const nuovoUsername = document.getElementById('profile-username').value.trim();
    const nuovaPassword = document.getElementById('profile-new-password-input').value.trim();

    // Verifica che almeno un campo sia compilato
    if (!nuovoNome && !nuovoUsername && !nuovaPassword) {
        await showMessage('Inserisci almeno un campo da modificare', 'Attenzione', 'warning');
        return;
    }

    try {
        const token = await invoke('get_saved_token');
        let modificheEffettuate = false;

        // Aggiorna nome se fornito
        if (nuovoNome) {
            try {
                const result = await invoke('update_user_name', {
                    token: token,
                    newName: nuovoNome
                });
                console.log('Nome aggiornato:', result);
                modificheEffettuate = true;

                // Aggiorna il nome visualizzato
                const displayNameElement = document.getElementById('display_name');
                if (displayNameElement) {
                    displayNameElement.textContent = nuovoNome;
                }
            } catch (error) {
                await showMessage('Errore aggiornamento nome: ' + error, 'Errore', 'error');
                return;
            }
        }

        // Aggiorna username se fornito
        if (nuovoUsername) {
            try {
                const result = await invoke('update_username', {
                    token: token,
                    newUsername: nuovoUsername
                });
                console.log('Username aggiornato:', result);
                modificheEffettuate = true;

                // Aggiorna l'username visualizzato
                const displayUsernameElement = document.getElementById('display_username');
                if (displayUsernameElement) {
                    displayUsernameElement.textContent = '@' + nuovoUsername;
                }
            } catch (error) {
                await showMessage('Errore aggiornamento username: ' + error, 'Errore', 'error');
                return;
            }
        }

        // Aggiorna password se fornita
        if (nuovaPassword) {
            if (nuovaPassword.length < 6) {
                await showMessage('La password deve essere di almeno 6 caratteri', 'Errore', 'warning');
                return;
            }

            try {
                const result = await invoke('change_password', {
                    token: token,
                    newPassword: nuovaPassword
                });
                console.log('Password cambiata:', result);
                modificheEffettuate = true;

                // Pulisci il campo password
                document.getElementById('profile-new-password-input').value = '';
            } catch (error) {
                await showMessage('Errore cambio password: ' + error, 'Errore', 'error');
                return;
            }
        }

        if (modificheEffettuate) {
            await showMessage('Modifiche salvate con successo!', 'Successo', 'success');
        }

    } catch (error) {
        console.error('Errore durante il salvataggio:', error);
        await showMessage('Errore: ' + error, 'Errore', 'error');
    }
}

// Collegamento evento al bottone Salva Modifiche
const btnSalva = document.querySelector('.btn-primary[data-i18n="profile.saveChanges"]');
if (btnSalva) {
    btnSalva.addEventListener('click', salvaModifiche);
    console.log('Event listener collegato al bottone Salva Modifiche');
}

// Esegui al caricamento della pagina
caricaFotoProfiloProfilo();
caricaDatiUtente();
