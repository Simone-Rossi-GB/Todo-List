// Helper per dialog usando Tauri invece di alert/confirm
// Questo risolve il problema del prefisso "127.0.0.1:1430 dice" che appare con i dialog browser

/**
 * Mostra un dialog di conferma usando Tauri
 * @param {string} message - Il messaggio da mostrare
 * @param {string} title - Il titolo del dialog (opzionale)
 * @returns {Promise<boolean>} - true se l'utente ha confermato, false altrimenti
 */
export async function showConfirm(message, title = 'Conferma') {
    try {
        const { ask } = window.__TAURI__.dialog;
        const result = await ask(message, {
            title: title,
            type: 'warning'
        });
        return result;
    } catch (error) {
        // Fallback a confirm() se Tauri non è disponibile (dev mode)
        console.warn('Tauri dialog non disponibile, uso confirm() standard');
        return confirm(message);
    }
}

/**
 * Mostra un messaggio informativo usando Tauri
 * @param {string} message - Il messaggio da mostrare
 * @param {string} title - Il titolo del dialog (opzionale)
 * @param {string} type - Tipo di messaggio: 'info', 'warning', 'error' (opzionale)
 */
export async function showMessage(message, title = 'Informazione', type = 'info') {
    try {
        const { message: showMsg } = window.__TAURI__.dialog;
        await showMsg(message, {
            title: title,
            type: type
        });
    } catch (error) {
        // Fallback ad alert() se Tauri non è disponibile
        console.warn('Tauri dialog non disponibile, uso alert() standard');
        alert(message);
    }
}
