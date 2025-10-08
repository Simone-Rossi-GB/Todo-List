import i18next from 'i18next';
import it from './locales/it.js';
import en from './locales/en.js';

// funzione che carica la lingua selezionata dal bundle associato

export const caricaLingua_run = () => {
    const form_lingua = document.getElementById('form_lingua');
    const lingua_selezionata = form_lingua.value;

    carica_lingua(lingua_selezionata);
}

export async function carica_lingua(lingua) {
    const transalations = await fetch(`/src/locales/${lingua}.json`).then(r => r.json());

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n')
        const value = getNestedValue(transalations, key);
        if (value) {
            el.textContent = value;
        } else {
            console.log(key + " non trovata nel " + lingua + ".json");
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const value = getNestedValue(transalations, key);
        if (value) {
            el.placeholder = value;
        } else {
            console.log(key + " (placeholder) non trovata nel " + lingua + ".json");
        }
    });

    localStorage.setItem('lingua', lingua);
}

function getNestedValue(obj, path) {
    return path.split('.').reduce((o, p) => o?.[p], obj);
}