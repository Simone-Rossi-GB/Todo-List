# TODO-List

Progetto che punta sulla creazione di un'applicazione web per la gestione delle proprie note, suddividendole in diversi stati.

<img width="1920" height="1020" alt="image" src="https://github.com/user-attachments/assets/61b79edd-45ae-40ab-9b33-cdc1a9e83429" />


---

# Analisi dei requisiti
Per poter svilippare al meglio il nostro progetto siamo partiti dall'analisi dei requisiti funazionali e non funzionali

## Requisiti Funzionali
- ### Must Have
  - Poter aggiungere delle note
  - Assegnare a ciascuna nota uno stato (Backlog, In progress, Review e Done)
  - Salvere le note nel localstorage
- ### Should Have
  - Poter eliminare le note
  - Poter cambiare lo stato di una nota
  - Poter cercare una nota in base al titolo o contenuto
- ### Could Have
  - Poter visualizzare tutte le note di un singolo stato
  - Poter cambiare il tema dell'applicazione (chiaro/scuro)
  - Un sistema di autenticazione
  - Poter cambiare la lingua (Italiano/Inglese)
- ### Won't Have
  -  Poter condividere le note
    
 
## Requisiti non Funzionali
- ### Prestazioni
  - L'applicazione dev'essere rapida nelle operazioni base (aggiunta, eliminazione e spostamento)
- ### Scalabilità
  - L'applicazione è facilmente implementabile su un sistema distribuito, in modo da poterlo scalare a livello nazionale ed internazionale
- ### Sicurezza
  - L'applicazione fa uso di sistemi di archiviazione locale per le note, ma queste informazioni si possono facilmente spostare in un database criptato per proteggere i dati dell'utente  
- ### Affidabilità
  - L'applicazione assicura sempre il salvataggio delle note quando l'utente le crea, in modo da non perdere informazioni importanti
- ### Usabilità
  - L'interfaccia grafica dell'applicazione è intuitiva e facile da usare

---
## IDE Setup consigliato
- [VS Code](https://code.visualstudio.com/)
- [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Strumenti Necessari
- [Node.js](https://nodejs.org/en)
- [Strumenti di sviluppo cpp](https://developer.microsoft.com/it-it/cpp)
- [Rust](https://rust-lang.org/tools/install/)
