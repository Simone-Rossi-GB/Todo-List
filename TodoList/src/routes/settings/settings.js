// JavaScript specifico per Settings
console.log('Settings page loaded');

// Carica e inizializza il modulo configurazione
(async () => {
    const module = await import('../code/salva_configurazione.js');
    await module.salvaConfigurazione_run();
})();
