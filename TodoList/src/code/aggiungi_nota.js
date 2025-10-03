export const aggiungiNota_run = () =>  {
    console.log('aggiungiNota_run eseguito');

    // Filtro stato
    let stato = null
    const bottoneBacklog = document.getElementById('button-backlog')
    const bottoneInProgress = document.getElementById('button-in_progress')
    const bottoneReview = document.getElementById('button-review')
    const bottoneDone = document.getElementById('button-done')
    const labelStato = document.getElementById('label-stato')

    bottoneBacklog.addEventListener('click', () => {
        stato = 'backlog'
        labelStato.textContent = 'Stato: Backlog ▼'
    })

    bottoneInProgress.addEventListener('click', () => {
        stato = 'in_progress'
        labelStato.textContent = 'Stato: In Progress ▼'
    })

    bottoneReview.addEventListener('click', () => {
        stato = 'review'
        labelStato.textContent = 'Stato: Review ▼'
    })

    bottoneDone.addEventListener('click', () => {
        stato = 'done'
        labelStato.textContent = 'Stato: Done ▼'
    })

    // Aggiungi nota
    const inputAggiunta = document.getElementById('bottone-aggiungi')
    const inputTesto = document.getElementById('input-nota').value

    inputAggiunta.addEventListener('click', () => {
        if (stato === null) {
            alert('Seleziona uno stato per la nota')
            return
        }

        const listaDoveAggiungere = document.getElementById(stato)
        const nuovaNota =   "<div class='card w-full bg-base-100 card-lg shadow-sm'>" + 
                            "<div class='card-body'>" + 
                            "<h2 class='card-title text-base'>Setup Progetto</h2>" +
                            "<p class='text-sm'>Configurazione iniziale progetto con Tauri e DaisyUI</p>" +
                            "<div class='card-actions flex-row justify-center gap-2'>" +
                            "<button class='btn btn-info btn-outline btn-sm'>Sposta</button>" +
                            "<button class='btn btn-error btn-outline btn-sm'>Elimina</button>" +
                            "</div>" +
                            "</div>" +
                            "</div>"

        listaDoveAggiungere.insertAdjacentHTML('beforeend', nuovaNota)
    })
}

