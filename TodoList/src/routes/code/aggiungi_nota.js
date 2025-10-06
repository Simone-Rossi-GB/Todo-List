// Variabile per evitare inizializzazione multipla
let isInitialized = false;

export const aggiungiNota_run = () =>  {
    // Previeni inizializzazione multipla
    if (isInitialized) {
        console.log('aggiungiNota_run già inizializzato, skip');
        return;
    }
    isInitialized = true;
    console.log('aggiungiNota_run eseguito');

    // Filtro stato
    let stato = null
    const bottoneBacklog = document.getElementById('button-backlog')
    const bottoneInProgress = document.getElementById('button-inProgress')
    const bottoneReview = document.getElementById('button-review')
    const bottoneDone = document.getElementById('button-done')
    const labelStato = document.getElementById('label-stato')

    bottoneBacklog.addEventListener('click', () => {
        stato = 'backlog'
        labelStato.textContent = 'Stato: Backlog ▼'
        // Chiudi il dropdown rimuovendo il focus
        document.activeElement.blur()
    })

    bottoneInProgress.addEventListener('click', () => {
        stato = 'in_progress'
        labelStato.textContent = 'Stato: In Progress ▼'
        // Chiudi il dropdown rimuovendo il focus
        document.activeElement.blur()
    })

    bottoneReview.addEventListener('click', () => {
        stato = 'review'
        labelStato.textContent = 'Stato: Review ▼'
        // Chiudi il dropdown rimuovendo il focus
        document.activeElement.blur()
    })

    bottoneDone.addEventListener('click', () => {
        stato = 'done'
        labelStato.textContent = 'Stato: Done ▼'
        // Chiudi il dropdown rimuovendo il focus
        document.activeElement.blur()
    })

    // Aggiungi nota
    const inputAggiunta = document.getElementById('bottone-aggiungi')

    inputAggiunta.addEventListener('click', () => {
        if (stato === null) {
            alert('Seleziona uno stato per la nota')
            return
        }

        const inputTitolo = document.getElementById('input-titolo').value
        const inputDescrizione = document.getElementById('input-descrizione').value

        if (!inputTitolo.trim()) {
            alert('Inserisci un titolo per la nota')
            return
        }

        if (!inputDescrizione.trim()) {
            alert('Inserisci una descrizione per la nota')
            return
        }

        // Seleziona il contenitore scrollabile interno
        const colonnaStato = document.getElementById(stato)
        const listaDoveAggiungere = colonnaStato.querySelector('.todo-list-content')

        // Crea l'elemento card
        const card = document.createElement('div')
        card.className = 'card w-full bg-base-100 card-lg shadow-sm'

        const cardBody = document.createElement('div')
        cardBody.className = 'card-body'

        const title = document.createElement('h2')
        title.className = 'card-title text-base'
        title.textContent = inputTitolo

        const description = document.createElement('p')
        description.className = 'text-sm'
        description.textContent = inputDescrizione

        const actions = document.createElement('div')
        actions.className = 'card-actions flex-row justify-center gap-2'

        const btnSposta = document.createElement('button')
        btnSposta.className = 'btn btn-info btn-outline btn-sm'
        btnSposta.textContent = 'Sposta'

        const btnElimina = document.createElement('button')
        btnElimina.className = 'btn btn-error btn-outline btn-sm'
        btnElimina.textContent = 'Elimina'

        // Assembla la struttura
        actions.appendChild(btnSposta)
        actions.appendChild(btnElimina)
        cardBody.appendChild(title)
        cardBody.appendChild(description)
        cardBody.appendChild(actions)
        card.appendChild(cardBody)

        // Aggiungi la card al contenitore
        listaDoveAggiungere.appendChild(card)

        // Pulisci gli input
        document.getElementById('input-titolo').value = ''
        document.getElementById('input-descrizione').value = ''
    })
}

