import getCookie from "./functions.mjs";
import { translations } from "./translations.mjs";


export function translate(lang = "en", key) {
    return translations[lang][key] || `[${key}]`;
}

export function applyTranslationsToPage() {
    const lang = getCookie("language") || "en";
    const titleKey = document.querySelector('title')?.getAttribute('data-translate');
    if (titleKey) {
        document.title = translate(lang, titleKey);
    }

    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');

        if (element.hasAttribute('placeholder')) {
            element.placeholder = translate(lang, key);
        } else if (element.hasAttribute('aria-label') && element.getAttribute('aria-label') !== '') {
            element.setAttribute('aria-label', translate(lang, key));
        } else if (element.tagName !== 'TITLE') {
            element.textContent = translate(lang, key);
        }
    });
}
