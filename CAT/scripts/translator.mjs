import getCookie from "./functions.mjs";
import { translations } from "./translations.mjs";

const lang = getCookie("language") || "en";
const dictionary = translations[lang] || translations.en;

export function translate(key) {
    return dictionary[key] || `[${key}]`;
}

export function applyTranslationsToPage() {
    const titleKey = document.querySelector('title')?.getAttribute('data-translate');
    if (titleKey) {
        document.title = translate(titleKey);
    }

    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');

        if (element.hasAttribute('placeholder')) {
            element.placeholder = translate(key);
        } else if (element.hasAttribute('aria-label') && element.getAttribute('aria-label') !== '') {
            element.setAttribute('aria-label', translate(key));
        } else if (element.tagName !== 'TITLE') {
            element.textContent = translate(key);
        }
    });
}
