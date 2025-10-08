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
    })
}

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
            spostaCard(card, target);
            overlay.remove();

            // Aggiorna il localStorage
            const titolo = card.querySelector('.card-title').textContent
            const descrizione = card.querySelector('p').textContent
            const items = LoadFromLocalStorage(colonnaCorrenteId + '_notes')
            const index = items.findIndex(item => item.title === titolo && item.description === descrizione)
            if (index !== -1) {
                items.splice(index, 1);
                SaveToLocalStorage(colonnaCorrenteId + '_notes', items)
            }

            const items2 = LoadFromLocalStorage(target + '_notes')
            items2.push({ title: titolo, description: descrizione })
            SaveToLocalStorage(target + '_notes', items2)
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
        btnSposta.textContent = getTraduzione('home.moveButton')

        const btnElimina = document.createElement('button')
        btnElimina.className = 'btn btn-error btn-outline btn-sm btn-elimina'
        btnElimina.textContent = getTraduzione('home.deleteButton')

        console.log(stato);

        // Event listener per eliminare
        btnElimina.addEventListener('click', () => {
            if (confirm(getTraduzione('home.confirmDelete'))) {
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

        // Event listener per spostare
        btnSposta.addEventListener('click', () => {
            mostraMenuSposta(card);
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

export const LoadFromLocalStorage = (key) => {
    return JSON.parse(localStorage.getItem(key)) || [];
}

export const SaveToLocalStorage = (key, content) => {
    const jsonData = JSON.stringify(content)
    localStorage.setItem(key, jsonData)
}
