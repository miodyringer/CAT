import getCookie from './functions.mjs'
import { translations } from './translations.mjs'

/**
 * Translates a given key into the specified language using the translations object.
 * @param {string} lang - The language code (e.g., 'en', 'de').
 * @param {string} key - The translation key to look up.
 * @returns {string} The translated string, or the key in brackets if not found.
 */
export function translate (lang, key) {
  if (!lang) lang = 'en'
  return translations[lang][key] || `[${key}]`
}

/**
 * Applies translations to all elements on the page with the 'data-translate' attribute.
 * Updates text content, placeholders, and aria-labels based on the current language.
 */
export function applyTranslationsToPage () {
  const lang = getCookie('language') || 'en'
  const titleKey = document.querySelector('title')?.getAttribute('data-translate')
  if (titleKey) {
    document.title = translate(lang, titleKey)
  }

  document.querySelectorAll('[data-translate]').forEach(element => {
    const key = element.getAttribute('data-translate')

    if (element.hasAttribute('placeholder')) {
      element.placeholder = translate(lang, key)
    } else if (element.hasAttribute('aria-label') && element.getAttribute('aria-label') !== '') {
      element.setAttribute('aria-label', translate(lang, key))
    } else if (element.tagName !== 'TITLE') {
      element.textContent = translate(lang, key)
    }
  })
}
