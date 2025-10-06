export const ricercaNote_run = () => {
    console.log('ricercaNote_run eseguito');

    const inputRicerca = document.getElementById('input-ricerca');

    if (!inputRicerca) {
        console.error('Input ricerca non trovato!');
        return;
    }

    // Clona per rimuovere listener precedenti
    const newInputRicerca = inputRicerca.cloneNode(true);
    inputRicerca.parentNode.replaceChild(newInputRicerca, inputRicerca);

    // Event listener per la ricerca
    newInputRicerca.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();

        // Seleziona tutte le card
        const cards = document.querySelectorAll('.todo-list-content .card');

        cards.forEach(card => {
            const title = card.querySelector('.card-title');
            const description = card.querySelector('.card-body p');

            if (!title) return;

            const titleText = title.textContent.toLowerCase();
            const descText = description ? description.textContent.toLowerCase() : '';

            // Mostra/nascondi in base alla query
            if (query === '') {
                // Nessuna ricerca, mostra tutto
                card.style.display = 'block';
            } else if (titleText.includes(query) || descText.includes(query)) {
                // Match trovato
                card.style.display = 'block';
            } else {
                // Nessun match
                card.style.display = 'none';
            }
        });
    });
};
