import { LoadFromLocalStorage, SaveToLocalStorage } from "./aggiungi_nota.js";

// Funzione per mostrare menu di spostamento
function mostraMenuSposta(card) {
    // Trova la colonna corrente
    const colonnaCorrente = card.closest('.todo-list');
    const colonnaCorrenteId = colonnaCorrente ? colonnaCorrente.id : '';

    // Crea un overlay con menu
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;';

    const menu = document.createElement('div');
    menu.className = 'card bg-base-100 shadow-xl';
    menu.style.cssText = 'width: 300px; padding: 20px;';

    menu.innerHTML = `
        <h3 class="text-lg font-bold mb-4">Sposta nota in:</h3>
        <div class="flex flex-col gap-2">
            ${colonnaCorrenteId !== 'backlog' ? '<button class="btn btn-outline" data-target="backlog">Backlog</button>' : ''}
            ${colonnaCorrenteId !== 'in_progress' ? '<button class="btn btn-outline" data-target="in_progress">In Progress</button>' : ''}
            ${colonnaCorrenteId !== 'review' ? '<button class="btn btn-outline" data-target="review">Review</button>' : ''}
            ${colonnaCorrenteId !== 'done' ? '<button class="btn btn-outline" data-target="done">Done</button>' : ''}
            <button class="btn btn-ghost mt-2" id="btn-annulla-sposta">Annulla</button>
        </div>
    `;

    overlay.appendChild(menu);
    document.body.appendChild(overlay);

    // Event listener per i bottoni
    const bottoni = menu.querySelectorAll('[data-target]');
    bottoni.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            spostaCard(card, target);
            overlay.remove();
        });
    });

    // Annulla
    menu.querySelector('#btn-annulla-sposta').addEventListener('click', () => {
        overlay.remove();
    });

    // Chiudi cliccando fuori
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

function spostaCard(card, targetId) {
    const targetColonna = document.getElementById(targetId);
    const targetContent = targetColonna.querySelector('.todo-list-content');

    // Sposta la card
    targetContent.appendChild(card);
}

// Funzione per mostrare i dettagli della card in overlay
function mostraDettagliCard(titolo, descrizione, stato) {
    // Crea un overlay con i dettagli
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;';

    const dettagli = document.createElement('div');
    dettagli.className = 'card bg-base-100 shadow-xl';
    dettagli.style.cssText = 'width: 90%; max-width: 600px; padding: 20px; max-height: 80vh; overflow-y: auto;';

    // Mappa dello stato ai badge
    const statusMap = {
        'backlog': { text: 'Backlog', class: 'badge-primary' },
        'in_progress': { text: 'In Progress', class: 'badge-warning' },
        'review': { text: 'Review', class: 'badge-info' },
        'done': { text: 'Done', class: 'badge-success' }
    };

    const statusInfo = statusMap[stato] || statusMap['backlog'];

    dettagli.innerHTML = `
        <h2 class="text-2xl font-bold mb-4">${titolo}</h2>
        <div class="divider"></div>
        <p class="whitespace-pre-wrap mb-4">${descrizione}</p>
        <div class="flex gap-2 mb-4">
            <span class="badge ${statusInfo.class}">${statusInfo.text}</span>
        </div>
        <div class="flex justify-end gap-2">
            <button class="btn btn-primary btn-sm" id="btn-modifica-nota">Modifica</button>
            <button class="btn btn-error btn-sm" id="btn-elimina-nota">Elimina</button>
            <button class="btn btn-ghost btn-sm" id="btn-chiudi-dettagli">Chiudi</button>
        </div>
    `;

    overlay.appendChild(dettagli);
    document.body.appendChild(overlay);

    // Bottone Chiudi
    dettagli.querySelector('#btn-chiudi-dettagli').addEventListener('click', () => {
        overlay.remove();
    });

    // Bottone Elimina
    dettagli.querySelector('#btn-elimina-nota').addEventListener('click', async () => {
        if (await window.showConfirm(`Sei sicuro di voler eliminare la nota "${titolo}"?`, 'Conferma Eliminazione')) {
            // Trova la card nel DOM
            const cards = document.querySelectorAll('.todo-list-content .card');
            let cardToRemove = null;

            cards.forEach(card => {
                const cardTitle = card.querySelector('.card-title')?.textContent;
                const cardDesc = card.querySelector('p')?.textContent;
                if (cardTitle === titolo && cardDesc === descrizione) {
                    cardToRemove = card;
                }
            });

            if (cardToRemove) {
                cardToRemove.remove();

                // Rimuovi dal localStorage
                const items = LoadFromLocalStorage(stato + '_notes');
                const index = items.findIndex(item => item.title === titolo && item.description === descrizione);
                if (index !== -1) {
                    items.splice(index, 1);
                    SaveToLocalStorage(stato + '_notes', items);
                }
            }

            overlay.remove();
        }
    });

    // Bottone Modifica (placeholder)
    dettagli.querySelector('#btn-modifica-nota').addEventListener('click', async () => {
        await window.showMessage('Funzionalità di modifica in arrivo!', 'Info', 'info');
    });

    // Chiudi quando si clicca fuori
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

export const gestioneCard_run = () => {
    console.log('gestioneCard_run eseguito');

    // Seleziona tutte le card esistenti
    const cards = document.querySelectorAll('.todo-list-content .card');

    cards.forEach(card => {
        const btnElimina = card.querySelector('.btn-error');
        const btnSposta = card.querySelector('.btn-info');

        const colonna = card.closest('.todo-list');
        const stato = colonna.id;
        const titolo = card.querySelector('.card-title').textContent;
        const descrizione = card.querySelector('p').textContent;

        if (btnElimina) {
            // Rimuovi listener precedenti clonando
            const newBtnElimina = btnElimina.cloneNode(true);
            btnElimina.parentNode.replaceChild(newBtnElimina, btnElimina);

            // Aggiungi listener
            newBtnElimina.addEventListener('click', async () => {
                if (await window.showConfirm('Sei sicuro di voler eliminare questa nota?', 'Conferma Eliminazione')) {
                    card.remove();

                    // Rimuovi dal localStorage
                    const items = LoadFromLocalStorage(stato + '_notes');
                    const index = items.findIndex(item => item.title === titolo && item.description === descrizione);
                    if (index !== -1) {
                        items.splice(index, 1);
                        SaveToLocalStorage(stato + '_notes', items);
                    }
                }
            });
        }

        if (btnSposta) {
            // Rimuovi listener precedenti clonando
            const newBtnSposta = btnSposta.cloneNode(true);
            btnSposta.parentNode.replaceChild(newBtnSposta, btnSposta);

            // Aggiungi listener
            newBtnSposta.addEventListener('click', (e) => {
                e.stopPropagation();
                mostraMenuSposta(card);
            });
        }

        // Aggiungi listener sul CARD BODY per aprire i dettagli
        const cardBody = card.querySelector('.card-body');
        if (cardBody) {
            cardBody.style.cursor = 'pointer';
            cardBody.addEventListener('click', (event) => {
                // Ignora il click se viene dai bottoni
                if (event.target.closest('.btn')) {
                    return;
                }
                console.log('Click sulla card: ' + titolo);

                // Mostra l'overlay con i dettagli della nota
                mostraDettagliCard(titolo, descrizione, stato);
            });
        }

    });
};
