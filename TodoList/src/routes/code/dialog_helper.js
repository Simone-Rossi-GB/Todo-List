// Helper per dialog custom cross-platform
// Funziona su Windows, macOS e Linux senza dipendenze da API Tauri

import { showConfirm as customShowConfirm, showMessage as customShowMessage } from './custom_dialogs.js';

/**
 * Mostra un dialog di conferma
 * @param {string} messageText - Il messaggio da mostrare
 * @param {string} title - Il titolo del dialog (opzionale)
 * @returns {Promise<boolean>} - true se l'utente ha confermato, false altrimenti
 */
export async function showConfirm(messageText, title = 'Conferma') {
    return await customShowConfirm(messageText, title);
}

/**
 * Mostra un messaggio informativo
 * @param {string} messageText - Il messaggio da mostrare
 * @param {string} title - Il titolo del dialog (opzionale)
 * @param {string} kind - Tipo di messaggio: 'info', 'success', 'warning', 'error' (opzionale)
 */
export async function showMessage(messageText, title = 'Informazione', kind = 'info') {
    return await customShowMessage(messageText, title, kind);
}
