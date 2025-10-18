// Dialog custom multi-piattaforma (Windows, macOS, Linux)
// Non dipende dalle API Tauri, usa solo HTML/CSS/JS

/**
 * Mostra un dialog di conferma custom
 * @param {string} message - Il messaggio da mostrare
 * @param {string} title - Il titolo del dialog
 * @returns {Promise<boolean>} - true se confermato, false altrimenti
 */
export async function showConfirm(message, title = 'Conferma') {
    return new Promise((resolve) => {
        // Crea overlay
        const overlay = document.createElement('div');
        overlay.className = 'custom-dialog-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease;
        `;

        // Crea dialog
        const dialog = document.createElement('div');
        dialog.className = 'custom-dialog';
        dialog.style.cssText = `
            background: var(--fallback-b1, #fff);
            border-radius: 12px;
            padding: 24px;
            min-width: 320px;
            max-width: 500px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            animation: slideIn 0.3s ease;
        `;

        // HTML del dialog
        dialog.innerHTML = `
            <div style="margin-bottom: 16px;">
                <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: var(--fallback-bc, #000);">
                    ${escapeHtml(title)}
                </h3>
                <p style="margin: 0; font-size: 14px; color: var(--fallback-bc, #000); opacity: 0.8; line-height: 1.5;">
                    ${escapeHtml(message)}
                </p>
            </div>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button class="dialog-btn-cancel" style="
                    padding: 8px 16px;
                    border: 1px solid #d1d5db;
                    background: #ffffff;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    color: #374151;
                    transition: all 0.2s;
                ">Annulla</button>
                <button class="dialog-btn-confirm" style="
                    padding: 8px 16px;
                    border: none;
                    background: #3b82f6;
                    color: #ffffff;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                ">Conferma</button>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Aggiungi animazioni CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .dialog-btn-cancel:hover {
                background: #f3f4f6 !important;
                border-color: #9ca3af !important;
            }
            .dialog-btn-confirm:hover {
                background: #2563eb !important;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
                transform: translateY(-1px);
            }
            .dialog-btn-confirm:active {
                transform: translateY(0);
            }
        `;
        document.head.appendChild(style);

        // Event listeners
        const btnCancel = dialog.querySelector('.dialog-btn-cancel');
        const btnConfirm = dialog.querySelector('.dialog-btn-confirm');

        const cleanup = (result) => {
            overlay.style.animation = 'fadeOut 0.2s ease';
            setTimeout(() => {
                overlay.remove();
                style.remove();
            }, 200);
            resolve(result);
        };

        btnCancel.addEventListener('click', () => cleanup(false));
        btnConfirm.addEventListener('click', () => cleanup(true));

        // Chiudi con ESC
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', handleKeyDown);
                cleanup(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);

        // Chiudi cliccando fuori
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                cleanup(false);
            }
        });

        // Focus sul pulsante conferma
        btnConfirm.focus();
    });
}

/**
 * Mostra un messaggio informativo custom
 * @param {string} message - Il messaggio da mostrare
 * @param {string} title - Il titolo del dialog
 * @param {string} type - Tipo: 'info', 'success', 'warning', 'error'
 * @returns {Promise<void>}
 */
export async function showMessage(message, title = 'Informazione', type = 'info') {
    return new Promise((resolve) => {
        // Colori per i diversi tipi (colori solidi, non variabili CSS)
        const colors = {
            info: '#3b82f6',    // blue-500
            success: '#10b981', // green-500
            warning: '#f59e0b', // amber-500
            error: '#ef4444'    // red-500
        };

        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };

        // Crea overlay
        const overlay = document.createElement('div');
        overlay.className = 'custom-dialog-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease;
        `;

        // Crea dialog
        const dialog = document.createElement('div');
        dialog.className = 'custom-dialog';
        dialog.style.cssText = `
            background: var(--fallback-b1, #fff);
            border-radius: 12px;
            padding: 24px;
            min-width: 320px;
            max-width: 500px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            animation: slideIn 0.3s ease;
        `;

        // HTML del dialog
        dialog.innerHTML = `
            <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                <div style="font-size: 24px; flex-shrink: 0;">
                    ${icons[type] || icons.info}
                </div>
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: var(--fallback-bc, #000);">
                        ${escapeHtml(title)}
                    </h3>
                    <p style="margin: 0; font-size: 14px; color: var(--fallback-bc, #000); opacity: 0.8; line-height: 1.5;">
                        ${escapeHtml(message)}
                    </p>
                </div>
            </div>
            <div style="display: flex; justify-content: flex-end;">
                <button class="dialog-btn-ok" style="
                    padding: 8px 24px;
                    border: none;
                    background: ${colors[type] || colors.info};
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s;
                ">OK</button>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Aggiungi animazioni CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .dialog-btn-ok:hover {
                filter: brightness(0.9);
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
                transform: translateY(-1px);
            }
            .dialog-btn-ok:active {
                transform: translateY(0);
            }
        `;
        document.head.appendChild(style);

        // Event listeners
        const btnOk = dialog.querySelector('.dialog-btn-ok');

        const cleanup = () => {
            overlay.style.animation = 'fadeOut 0.2s ease';
            setTimeout(() => {
                overlay.remove();
                style.remove();
            }, 200);
            resolve();
        };

        btnOk.addEventListener('click', cleanup);

        // Chiudi con ESC o Enter
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' || e.key === 'Enter') {
                document.removeEventListener('keydown', handleKeyDown);
                cleanup();
            }
        };
        document.addEventListener('keydown', handleKeyDown);

        // Chiudi cliccando fuori
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                cleanup();
            }
        });

        // Focus sul pulsante OK
        btnOk.focus();
    });
}

/**
 * Escape HTML per prevenire XSS
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
