// JavaScript specifico per Note Detail
console.log('Note detail page loaded');

// Carica i dati della nota da sessionStorage
const noteData = JSON.parse(sessionStorage.getItem('currentNote'));

if (!noteData) {
    // Se non ci sono dati, torna alla home
    console.error('Nessuna nota trovata in sessionStorage');
    window.location.hash = '/';
} else {
    // Popola la pagina con i dati della nota
    const noteTitle = document.getElementById('note-title');
    const noteDescription = document.getElementById('note-description');
    const noteStatusBadge = document.getElementById('note-status-badge');

    if (noteTitle) noteTitle.textContent = noteData.title;
    if (noteDescription) noteDescription.textContent = noteData.description;

    // Mappa dello stato ai badge
    const statusMap = {
        'backlog': { text: 'Backlog', class: 'badge-primary' },
        'in_progress': { text: 'In Progress', class: 'badge-warning' },
        'review': { text: 'Review', class: 'badge-info' },
        'done': { text: 'Done', class: 'badge-success' }
    };

    const statusInfo = statusMap[noteData.status] || statusMap['backlog'];
    if (noteStatusBadge) {
        noteStatusBadge.textContent = statusInfo.text;
        noteStatusBadge.className = `badge ${statusInfo.class}`;
    }

    // Gestione bottone Indietro
    const btnBack = document.getElementById('btn-back');
    if (btnBack) {
        btnBack.addEventListener('click', () => {
            window.location.hash = '/';
        });
    }

    // Gestione bottone Elimina
    const btnDelete = document.getElementById('btn-delete-note');
    if (btnDelete) {
        btnDelete.addEventListener('click', () => {
            if (confirm(`Sei sicuro di voler eliminare la nota "${noteData.title}"?`)) {
                // Carica le note dal localStorage
                const storageKey = noteData.status + '_notes';
                const notes = JSON.parse(localStorage.getItem(storageKey) || '[]');

                // Trova e rimuovi la nota
                const index = notes.findIndex(note =>
                    note.title === noteData.title && note.description === noteData.description
                );

                if (index !== -1) {
                    notes.splice(index, 1);
                    localStorage.setItem(storageKey, JSON.stringify(notes));
                    console.log('Nota eliminata con successo');
                }

                // Pulisci sessionStorage e torna alla home
                sessionStorage.removeItem('currentNote');
                window.location.hash = '/';
            }
        });
    }

    // Gestione bottone Modifica
    const btnEdit = document.getElementById('btn-edit-note');
    if (btnEdit) {
        btnEdit.addEventListener('click', () => {
            // TODO: Implementare la modalità di modifica
            alert('Funzionalità di modifica in arrivo!');
        });
    }
}
