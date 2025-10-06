// JavaScript specifico per Profile
console.log('Profile page loaded');

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

// Carica email da configurazione o localStorage
async function caricaEmailProfilo() {
    try {
        // Qui puoi caricare l'email salvata dopo l'autenticazione
        // Per ora usa un placeholder o carica da configurazione
        const email = localStorage.getItem('userEmail');

        if (email) {
            const emailElement = document.getElementById('profile-email');
            const emailInput = document.getElementById('profile-email-input');

            if (emailElement) emailElement.textContent = email;
            if (emailInput) emailInput.value = email;
        }
    } catch (error) {
        console.log('Errore nel caricamento email:', error);
    }
}

// Esegui al caricamento della pagina
caricaFotoProfiloProfilo();
caricaEmailProfilo();
