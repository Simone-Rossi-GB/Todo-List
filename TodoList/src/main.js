document.addEventListener('DOMContentLoaded', function() {
    // Mappa per tracciare lo stato hover di ogni colonna
    const columnHoverStates = new Map();

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

        // Gestisci hover sulla card
        card.addEventListener('mouseenter', function() {
            const listContent = card.closest('.todo-list-content');
            if (listContent) {
                columnHoverStates.set(listContent, true);
            }
        });

        card.addEventListener('mouseleave', function() {
            const listContent = card.closest('.todo-list-content');
            if (listContent) {
                columnHoverStates.set(listContent, false);
            }
        });
    });

    // Auto-scroll carosello per ogni colonna
    const todoLists = document.querySelectorAll('.todo-list-content');

    todoLists.forEach(list => {
        let scrollDirection = 1; // 1 = giù, -1 = su
        let autoScrollInterval = null;
        let userScrollTimeout = null;
        let isUserScrolling = false;

        // Conta il numero di card nella colonna
        const cardCount = list.querySelectorAll('.card').length;

        // Disabilita scroll se ci sono 3 o meno note
        if (cardCount <= 3) {
            list.style.overflowY = 'hidden';
            return; // Non continuare con il setup dell'auto-scroll
        }

        // Funzione per auto-scroll
        function startAutoScroll() {
            if (autoScrollInterval) return;

            autoScrollInterval = setInterval(() => {
                if (isUserScrolling) return;

                // Ferma auto-scroll se l'utente è in hover su una card
                if (columnHoverStates.get(list)) return;

                const maxScroll = list.scrollHeight - list.clientHeight;

                // Scorri verso il basso
                if (scrollDirection === 1) {
                    list.scrollTop += 1;

                    // Se raggiungiamo il fondo, cambia direzione
                    if (list.scrollTop >= maxScroll - 5) {
                        scrollDirection = -1;
                    }
                }
                // Scorri verso l'alto
                else {
                    list.scrollTop -= 1;

                    // Se raggiungiamo la cima, cambia direzione
                    if (list.scrollTop <= 5) {
                        scrollDirection = 1;
                    }
                }
            }, 50); // Velocità scroll (ms)
        }

        // Ferma auto-scroll quando l'utente scrolla manualmente
        list.addEventListener('wheel', () => {
            isUserScrolling = true;
            clearInterval(autoScrollInterval);
            autoScrollInterval = null;

            // Riprendi auto-scroll dopo 3 secondi di inattività
            clearTimeout(userScrollTimeout);
            userScrollTimeout = setTimeout(() => {
                isUserScrolling = false;
                startAutoScroll();
            }, 3000);
        });

        // Ferma auto-scroll quando l'utente usa la scrollbar
        list.addEventListener('scroll', (e) => {
            if (!autoScrollInterval) {
                isUserScrolling = true;

                clearTimeout(userScrollTimeout);
                userScrollTimeout = setTimeout(() => {
                    isUserScrolling = false;
                    startAutoScroll();
                }, 3000);
            }
        });

        // Avvia auto-scroll iniziale
        startAutoScroll();
    });
});
