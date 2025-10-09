//ottengo da rust il token dell'autenticazione

export async function getToken() {
    try {
        const token = await window.__TAURI__.core.invoke('get_saved_token');
        return token;
    } catch (error) {
        console.error('Nessun token trovato --> ', error);
        return null;
    }
}

// ottengo le note da supabase per caricarle nel local storage
export async function loadNotesFromSupabase(){
    const token = await getToken();
    if (!token) {
        console.warn('Nessun token, impossibile caricare note');
        return [];
    }

    try {
        const notes = await window.__TAURI__.core.invoke('load_notes', {token});
        return notes;
    } catch (error) {
        console.error('Errore nel caricare le note --> ', error);
        return [];
    }
}

export async function createNoteOnSupabase(title, description, status) {
    const token = await getToken();
    if (!token) {
        throw new Error('Non autenticato');
    }

    const note = await window.__TAURI__.core.invoke('create_note', {
        token,
        title,
        description,
        status
    });

    return note;
}

export async function deleteNoteFromSupabase(noteId){
    const token = await getToken();
    if (!token) {
        throw new Error('Non autenticato');
    }

    await window.__TAURI__.core.invoke('delete_note', {
       token,
       noteId
    });
}

export async function moveNoteOnSupabase(noteId, newStatus) {
    const token = await getToken();
    if (!token) {
        throw new Error('Non autenticato');
    }

    const note = await window.__TAURI__.core.invoke('move_note', {
       token,
       noteId,
       newStatus
    });

    return note;
}

export async function updateNoteOnSupabase(noteId, title, description, status) {
    const token = await getToken();
    if (!token) {
        throw new Error('Non autenticato');
    }

    const note = await window.__TAURI__.core.invoke('update_note', {
        token,
        noteId,
        title,
        description,
        status
    });

    return note;
}