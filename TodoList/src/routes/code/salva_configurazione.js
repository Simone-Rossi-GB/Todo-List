async function salvaConfig(config) {
    try {
        // Ottieni il percorso completo della directory AppConfig
        const { appConfigDir, join } = window.__TAURI__.path;
        const { writeTextFile, mkdir } = window.__TAURI__.fs;

        const configDir = await appConfigDir();
        const configPath = await join(configDir, 'config.json');

        // Prova a scrivere il file
        try {
            await writeTextFile(configPath, JSON.stringify(config, null, 2));
        } catch (writeError) {
            // Se fallisce per directory mancante, creala e riprova
            console.log('Directory non trovata, la creo...');
            await mkdir(configDir, { recursive: true });
            await writeTextFile(configPath, JSON.stringify(config, null, 2));
        }

        console.log('Configurazione salvata in:', configPath);
        return true;
    } catch (error) {
        console.error('Errore nel salvataggio:', error);
        alert('Errore nel salvataggio della configurazione: ' + error.message);
        return false;
    }
}

async function caricaConfig() {
    try {
        // Ottieni il percorso completo della directory AppConfig
        const { appConfigDir, join } = window.__TAURI__.path;
        const { readTextFile } = window.__TAURI__.fs;

        const configDir = await appConfigDir();
        const configPath = await join(configDir, 'config.json');

        const configText = await readTextFile(configPath);
        return JSON.parse(configText);
    } catch (error) {
        console.log('Nessuna configurazione salvata, uso defaults:', error.message);
    }
    // Default
    return {
        temaScuro: false,
        autoScroll: true,
        lingua: 'it',
        hasFotoProfilo: false
    };
}

async function salvaFotoProfilo(file) {
    try {
        const { appConfigDir, join } = window.__TAURI__.path;
        const { writeFile, mkdir } = window.__TAURI__.fs;

        const configDir = await appConfigDir();

        // Crea directory se non esiste
        try {
            await mkdir(configDir, { recursive: true });
        } catch (e) {
            // Directory già esistente, ok
        }

        // Estensione del file
        const ext = file.name.split('.').pop();
        const avatarPath = await join(configDir, `avatar.${ext}`);

        // Leggi file come array buffer e salva
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        await writeFile(avatarPath, uint8Array);
        console.log('Foto profilo salvata in:', avatarPath);
        return true;
    } catch (error) {
        console.error('Errore salvataggio foto:', error);
        return false;
    }
}

async function caricaFotoProfilo() {
    try {
        const { appConfigDir, join } = window.__TAURI__.path;
        const { readFile, exists } = window.__TAURI__.fs;

        const configDir = await appConfigDir();

        // Prova diverse estensioni
        const extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

        for (const ext of extensions) {
            const avatarPath = await join(configDir, `avatar.${ext}`);
            const fileExists = await exists(avatarPath);

            if (fileExists) {
                const data = await readFile(avatarPath);
                const blob = new Blob([data], { type: `image/${ext}` });
                return URL.createObjectURL(blob);
            }
        }

        // Nessuna foto trovata, usa default
        return 'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp';
    } catch (error) {
        console.log('Errore caricamento foto:', error);
        return 'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp';
    }
}

// Configurazione globale accessibile da tutta l'app
window.appConfig = {
    temaScuro: false,
    autoScroll: true,
    lingua: 'it',
    hasFotoProfilo: false
};

async function applicaConfig(config) {
    // Salva in variabile globale
    window.appConfig = config;

    // Applica tema
    const html = document.documentElement;
    html.setAttribute('data-theme', config.temaScuro ? 'dark' : 'light');

    // Carica e applica foto profilo nella navbar
    const fotoProfilo = await caricaFotoProfilo();
    const navbarAvatar = document.querySelector('.navbar .avatar img');
    if (navbarAvatar) {
        navbarAvatar.src = fotoProfilo;
    }

    // Applica lingua
    if (window.carica_lingua) {
        await window.carica_lingua(config.lingua);
        console.log('lingua in caricamento: ' + config.lingua);
    }

    console.log('Configurazione applicata:', config);
}

function mostraAlert(tipo, messaggio) {
    const alertSuccesso = document.getElementById('notifica-successo');
    const alertErrore = document.getElementById('alert-errore');
    const alertErroreText = document.getElementById('alert-errore-text');

    // Nascondi entrambi
    if (alertSuccesso) alertSuccesso.style.display = 'none';
    if (alertErrore) alertErrore.style.display = 'none';

    if (tipo === 'success' && alertSuccesso) {
        alertSuccesso.style.display = 'flex';
        setTimeout(() => {
            alertSuccesso.style.display = 'none';
        }, 3000);
    } else if (tipo === 'error' && alertErrore && alertErroreText) {
        alertErroreText.textContent = messaggio;
        alertErrore.style.display = 'flex';
        setTimeout(() => {
            alertErrore.style.display = 'none';
        }, 5000);
    }
}

export const salvaConfigurazione_run = async () => {
    console.log('salvaConfigurazione_run eseguito');

    const checkBoxTemaScuro = document.getElementById('checkBox_tema_scuro');
    const checkBoxAutoScroll = document.getElementById('checkBox_autoScroll');
    const select_lingua = document.getElementById('form_lingua');
    const inputFoto = document.getElementById('input-foto-profilo');
    const previewAvatar = document.getElementById('preview-avatar');
    const btnSalva = document.getElementById('btn-salva-settings');

    if (!btnSalva) {
        console.error('Bottone salva non trovato!');
        return;
    }

    // Carica configurazione esistente
    const config = await caricaConfig();
    checkBoxTemaScuro.checked = config.temaScuro;
    checkBoxAutoScroll.checked = config.autoScroll;
    select_lingua.value = config.lingua;

    // Mostra foto profilo attuale
    const fotoAttuale = await caricaFotoProfilo();
    previewAvatar.src = fotoAttuale;

    // Salva temporaneamente il file foto
    let nuovoFilefoto = null;

    // Preview foto quando viene selezionata
    inputFoto.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Controllo dimensione max 5MB
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                mostraAlert('error', 'La foto profilo non può superare i 5MB. Dimensione attuale: ' + (file.size / 1024 / 1024).toFixed(2) + 'MB');
                inputFoto.value = ''; // Reset input
                return;
            }

            // Controllo tipo file
            if (!file.type.startsWith('image/')) {
                mostraAlert('error', 'Il file deve essere un\'immagine');
                inputFoto.value = '';
                return;
            }

            nuovoFilefoto = file;

            // Preview
            const reader = new FileReader();
            reader.onload = (event) => {
                previewAvatar.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Rimuovi event listener precedenti (se esistono)
    const newBtnSalva = btnSalva.cloneNode(true);
    btnSalva.parentNode.replaceChild(newBtnSalva, btnSalva);

    // Event listener per salvare
    newBtnSalva.addEventListener('click', async () => {
        console.log('Bottone salva cliccato');

        // Salva foto se è stata selezionata una nuova
        if (nuovoFilefoto) {
            const fotoSalvata = await salvaFotoProfilo(nuovoFilefoto);
            if (!fotoSalvata) {
                mostraAlert('error', 'Errore nel salvataggio della foto profilo');
                return;
            }
        }

        const nuovaConfig = {
            temaScuro: checkBoxTemaScuro.checked,
            autoScroll: checkBoxAutoScroll.checked,
            lingua: select_lingua.value,
            hasFotoProfilo: nuovoFilefoto ? true : config.hasFotoProfilo
        };

        console.log('Nuova config:', nuovaConfig);

        const salvato = await salvaConfig(nuovaConfig);
        console.log('Salvato:', salvato);

        if (salvato) {
            await applicaConfig(nuovaConfig);
            mostraAlert('success', '');
        } else {
            mostraAlert('error', 'Errore nel salvataggio delle impostazioni');
        }
    });
};

export async function inizializzaConfig() {
    const config = await caricaConfig();
    applicaConfig(config);
    return config;
}