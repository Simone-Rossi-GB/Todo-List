document.addEventListener('DOMContentLoaded', function() {
    // Aggiungi event listener a tutte le card
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Non navigare se si clicca su un pulsante
            if (e.target.classList.contains('btn')) {
                return;
            }

            // Trova la colonna parent
            const column = card.closest('.todo-list');
            const columnId = column ? column.id : '';

            // Naviga alla pagina della colonna (da implementare)
            // Per ora mostra un alert
            console.log(`Navigazione alla colonna: ${columnId}`);
            // window.location.href = `column.html?id=${columnId}&card=${card.dataset.id}`;
        });
    });
});
