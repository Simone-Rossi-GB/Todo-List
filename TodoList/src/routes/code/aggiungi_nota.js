import { getTraduzione } from './carica_lingua.js';

export const aggiungiNota_run = () =>  {
    console.log('aggiungiNota_run eseguito');

    // Filtro stato
    let stato = null
    const labelStato = document.getElementById('label-stato')

    // Clona i bottoni per rimuovere listener precedenti
    const bottoneBacklog = document.getElementById('button-backlog')
    const bottoneInProgress = document.getElementById('button-inProgress')
    const bottoneReview = document.getElementById('button-review')
    const bottoneDone = document.getElementById('button-done')

    const newBacklog = bottoneBacklog.cloneNode(true)
    const newInProgress = bottoneInProgress.cloneNode(true)
    const newReview = bottoneReview.cloneNode(true)
    const newDone = bottoneDone.cloneNode(true)

    bottoneBacklog.parentNode.replaceChild(newBacklog, bottoneBacklog)
    bottoneInProgress.parentNode.replaceChild(newInProgress, bottoneInProgress)
    bottoneReview.parentNode.replaceChild(newReview, bottoneReview)
    bottoneDone.parentNode.replaceChild(newDone, bottoneDone)

    newBacklog.addEventListener('click', () => {
        stato = 'backlog'
        labelStato.textContent = getTraduzione('home.statusLabel') + ': ' + getTraduzione('status.backlog') + ' ▼'
        document.activeElement.blur()
    })

    newInProgress.addEventListener('click', () => {
        stato = 'in_progress'
        labelStato.textContent = getTraduzione('home.statusLabel') + ': ' + getTraduzione('status.inProgress') + ' ▼'
        document.activeElement.blur()
    })

    newReview.addEventListener('click', () => {
        stato = 'review'
        labelStato.textContent = getTraduzione('home.statusLabel') + ': ' + getTraduzione('status.review') + ' ▼'
        document.activeElement.blur()
    })

    newDone.addEventListener('click', () => {
        stato = 'done'
        labelStato.textContent = getTraduzione('home.statusLabel') + ': ' + getTraduzione('status.done') + ' ▼'
        document.activeElement.blur()
    })

    // Aggiungi nota - clona per rimuovere listener precedenti
    const inputAggiunta = document.getElementById('bottone-aggiungi')
    const newInputAggiunta = inputAggiunta.cloneNode(true)
    inputAggiunta.parentNode.replaceChild(newInputAggiunta, inputAggiunta)

    newInputAggiunta.addEventListener('click', () => {
        if (stato === null) {
            alert(getTraduzione('home.selectStatus'))
            return
        }

        const inputTitolo = document.getElementById('input-titolo').value
        const inputDescrizione = document.getElementById('input-descrizione').value

        if (!inputTitolo.trim()) {
            alert(getTraduzione('home.enterTitle'))
            return
        }

        if (!inputDescrizione.trim()) {
            alert(getTraduzione('home.enterDescription'))
            return
        }

        // Seleziona il contenitore scrollabile interno
        const colonnaStato = document.getElementById(stato)
        const listaDoveAggiungere = colonnaStato.querySelector('.todo-list-content')

        // Crea la card
        const card = creaCard(inputTitolo, inputDescrizione, stato)

        // Aggiungi la card al contenitore
        listaDoveAggiungere.appendChild(card)

        // Pulisci gli input
        document.getElementById('input-titolo').value = ''
        document.getElementById('input-descrizione').value = ''

        // Salva su localStorage
        const items = LoadFromLocalStorage(stato + '_notes')
        items.push({ title: inputTitolo, description: inputDescrizione })
        SaveToLocalStorage(stato + '_notes', items)
        console.log('Nota aggiunta al localStorage:', stato + '_notes', items)
    })
}

// Funzione per mostrare menu di spostamento
function mostraMenuSposta(card) {
    // Trova la colonna corrente (sia nelle pagine home che singole)
    const colonnaCorrente = card.closest('.todo-list, .todo-list-single');
    const colonnaCorrenteId = colonnaCorrente ? colonnaCorrente.id : '';
    console.log('mostraMenuSposta - Colonna trovata:', colonnaCorrente, 'ID:', colonnaCorrenteId);

    // Crea un overlay con menu
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;';

    const menu = document.createElement('div');
    menu.className = 'card bg-base-100 shadow-xl';
    menu.style.cssText = 'width: 300px; padding: 20px;';

    menu.innerHTML = `
        <h3 class="text-lg font-bold mb-4">${getTraduzione('home.moveNoteTo')}</h3>
        <div class="flex flex-col gap-2">
            ${colonnaCorrenteId !== 'backlog' ? `<button class="btn btn-outline" data-target="backlog">${getTraduzione('status.backlog')}</button>` : ''}
            ${colonnaCorrenteId !== 'in_progress' ? `<button class="btn btn-outline" data-target="in_progress">${getTraduzione('status.inProgress')}</button>` : ''}
            ${colonnaCorrenteId !== 'review' ? `<button class="btn btn-outline" data-target="review">${getTraduzione('status.review')}</button>` : ''}
            ${colonnaCorrenteId !== 'done' ? `<button class="btn btn-outline" data-target="done">${getTraduzione('status.done')}</button>` : ''}
            <button class="btn btn-ghost mt-2" id="btn-annulla-sposta">${getTraduzione('home.cancel')}</button>
        </div>
    `;

    overlay.appendChild(menu);
    document.body.appendChild(overlay);

    // Event listener per i bottoni
    const bottoni = menu.querySelectorAll('[data-target]');
    bottoni.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');

            // PRIMA: Leggi titolo e descrizione dalla card (prima di spostarla/rimuoverla!)
            const titolo = card.querySelector('.card-title').textContent
            const descrizione = card.querySelector('p').textContent

            // POI: Aggiorna il localStorage
            const items = window.LoadFromLocalStorage(colonnaCorrenteId + '_notes')
            const index = items.findIndex(item => item.title === titolo && item.description === descrizione)
            console.log('Spostamento - Colonna origine:', colonnaCorrenteId, 'Items trovati:', items, 'Index:', index)
            if (index !== -1) {
                items.splice(index, 1);
                window.SaveToLocalStorage(colonnaCorrenteId + '_notes', items)
                console.log('Rimosso da', colonnaCorrenteId + '_notes', items)
            }

            const items2 = window.LoadFromLocalStorage(target + '_notes')
            items2.push({ title: titolo, description: descrizione })
            window.SaveToLocalStorage(target + '_notes', items2)
            console.log('Aggiunto a', target + '_notes', items2)

            // INFINE: Sposta/rimuovi la card dal DOM
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

    // Se la colonna target non esiste (es. siamo in una pagina singola)
    if (!targetColonna) {
        // Rimuovi semplicemente la card dal DOM (localStorage già aggiornato)
        card.remove();
        console.log('Nota spostata verso', targetId, '(colonna non presente nella vista corrente)');
        return;
    }

    const targetContent = targetColonna.querySelector('.todo-list-content');

    // Sposta la card
    targetContent.appendChild(card);
}

export const creaCard = (titolo, descrizione, stato) => {
        // Crea l'elemento card
        const card = document.createElement('div')
        card.className = 'card w-full bg-base-100 card-lg shadow-sm'

        const cardBody = document.createElement('div')
        cardBody.className = 'card-body'

        const title = document.createElement('h2')
        title.className = 'card-title text-base'
        title.textContent = titolo

        const description = document.createElement('p')
        description.className = 'text-sm'
        description.textContent = descrizione

        const actions = document.createElement('div')
        actions.className = 'card-actions flex-row justify-center gap-2'

        const btnSposta = document.createElement('button')
        btnSposta.className = 'btn btn-info btn-outline btn-sm btn-sposta'
        btnSposta.setAttribute('data-i18n', 'home.moveButton')
        btnSposta.textContent = getTraduzione('home.moveButton')

        const btnElimina = document.createElement('button')
        btnElimina.className = 'btn btn-error btn-outline btn-sm btn-elimina'
        btnElimina.setAttribute('data-i18n', 'home.deleteButton')
        btnElimina.textContent = getTraduzione('home.deleteButton')

        console.log(stato);

        // Event listener per eliminare
        btnElimina.addEventListener('click', () => {
            if (confirm(getTraduzione('home.confirmDelete'))) {
                // Determina la colonna corrente dal DOM (sia home che pagine singole)
                const colonnaCorrente = card.closest('.todo-list, .todo-list-single');
                const colonnaCorrenteId = colonnaCorrente ? colonnaCorrente.id : stato;

                card.remove();

                // Rimuovi dal localStorage (usa sempre funzioni globali negli event listener)
                const items = window.LoadFromLocalStorage(colonnaCorrenteId + '_notes');
                const index = items.findIndex(item => item.title === titolo && item.description === descrizione);
                console.log('Eliminazione - Colonna:', colonnaCorrenteId, 'Items:', items, 'Index:', index)
                if (index !== -1) {
                    items.splice(index, 1);
                    window.SaveToLocalStorage(colonnaCorrenteId + '_notes', items);
                    console.log('Eliminato da localStorage:', colonnaCorrenteId + '_notes', items)
                }
            }
        });

        // Event listener per spostare
        btnSposta.addEventListener('click', (e) => {
            e.stopPropagation();
            mostraMenuSposta(card);
        });

        // Event listener per aprire i dettagli della nota
        cardBody.style.cursor = 'pointer';
        cardBody.addEventListener('click', (event) => {
            // Ignora il click se viene dai bottoni
            if (event.target.closest('.btn')) {
                return;
            }
            console.log('Click sulla card: ' + titolo);

            // Mostra l'overlay con i dettagli della nota
            mostraDettagliNota(titolo, descrizione, stato);
        });

        // Assembla la struttura
        actions.appendChild(btnSposta)
        actions.appendChild(btnElimina)
        cardBody.appendChild(title)
        cardBody.appendChild(description)
        cardBody.appendChild(actions)
        card.appendChild(cardBody)

        // Ritorna la card creata
        return card
}

// Funzione per mostrare i dettagli della nota in overlay
function mostraDettagliNota(titolo, descrizione, stato) {
    // Crea un overlay con i dettagli
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;';

    const dettagli = document.createElement('div');
    dettagli.className = 'card bg-base-100 shadow-xl';
    dettagli.style.cssText = 'width: 90%; max-width: 600px; padding: 20px; max-height: 80vh; overflow-y: auto;';

    // Mappa dello stato ai badge
    const statusMap = {
        'backlog': { text: getTraduzione('status.backlog'), class: 'badge-primary' },
        'in_progress': { text: getTraduzione('status.inProgress'), class: 'badge-warning' },
        'review': { text: getTraduzione('status.review'), class: 'badge-info' },
        'done': { text: getTraduzione('status.done'), class: 'badge-success' }
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
            <button class="btn btn-error btn-sm" id="btn-elimina-nota">${getTraduzione('home.deleteButton')}</button>
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
    dettagli.querySelector('#btn-elimina-nota').addEventListener('click', () => {
        if (confirm(getTraduzione('home.confirmDelete'))) {
            // Trova la card nel DOM
            const cards = document.querySelectorAll('.todo-list-content .card, .todo-list-single .card');
            let cardToRemove = null;

            cards.forEach(c => {
                const cardTitle = c.querySelector('.card-title')?.textContent;
                const cardDesc = c.querySelector('p')?.textContent;
                if (cardTitle === titolo && cardDesc === descrizione) {
                    cardToRemove = c;
                }
            });

            if (cardToRemove) {
                // Determina la colonna corrente
                const colonnaCorrente = cardToRemove.closest('.todo-list, .todo-list-single');
                const colonnaCorrenteId = colonnaCorrente ? colonnaCorrente.id : stato;

                cardToRemove.remove();

                // Rimuovi dal localStorage
                const items = window.LoadFromLocalStorage(colonnaCorrenteId + '_notes');
                const index = items.findIndex(item => item.title === titolo && item.description === descrizione);
                if (index !== -1) {
                    items.splice(index, 1);
                    window.SaveToLocalStorage(colonnaCorrenteId + '_notes', items);
                }
            }

            overlay.remove();
        }
    });

    // Bottone Modifica (placeholder)
    dettagli.querySelector('#btn-modifica-nota').addEventListener('click', () => {
        alert('Funzionalità di modifica in arrivo!');
    });

    // Chiudi quando si clicca fuori
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

export const LoadFromLocalStorage = (key) => {
    return JSON.parse(localStorage.getItem(key)) || [];
}

export const SaveToLocalStorage = (key, content) => {
    const jsonData = JSON.stringify(content)
    localStorage.setItem(key, jsonData)
    console.log('SaveToLocalStorage chiamato - Key:', key, 'Content:', content)
}
