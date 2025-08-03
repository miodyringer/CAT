import getCookie from './functions.mjs'
import { updateBGVolume } from './audio_manager.mjs'
import { applyPageSettings } from './page_settings.js'
import { applyTranslationsToPage } from './translator.mjs'

const light = document.querySelector('#theme-light')
const dark = document.querySelector('#theme-dark')
const grayscale = document.querySelector('#theme-grayscale')
const volume = document.querySelector('#mute-all')
const volumeSliders = document.querySelectorAll('input[type="range"][id*="volume"]')
const textSize = document.querySelector('#text_size')
const contrast = document.querySelector('#high-contrast-mode')
const contrastBox = document.querySelector('#high-contrast-mode')
const colorblind = document.querySelector('#colorblind-mode')
const languageSelect = document.querySelector('#language-select')

const currentLang = getCookie('language') || 'en'
languageSelect.value = currentLang

const contrastMode = getCookie('high_contrast_mode') || 'false'
contrastBox.checked = contrastMode === 'true'

const colorTheme = getCookie('color_theme') || 'light'
if (colorTheme === 'light') { light.checked = true }
if (colorTheme === 'dark') { dark.checked = true }
if (colorTheme === 'grayscale') { grayscale.checked = true }

const colorblindMode = getCookie('colorblind_mode') || 'off'
colorblind.value = colorblindMode

const muted = getCookie('muted') || 'false'
volume.checked = muted === 'true'

const text = getCookie('text_size') || 1
textSize.value = text * 100
textSize.nextElementSibling.textContent = Math.round(textSize.value) + '%'

if (muted === 'true') {
  volumeSliders.forEach((range) => {
    range.disabled = true
    range.value = 0
    range.nextElementSibling.textContent = '0%'
  })
} else {
  volumeSliders.forEach((range) => {
    const volume = getCookie(range.id) || '50'
    range.value = volume
    range.nextElementSibling.textContent = volume + '%'
  })
}

/**
 * Initializes the settings page by reading cookies and setting UI elements accordingly.
 * Handles theme, volume, text size, contrast, colorblind mode, and language settings.
 */

/**
 * Handles language selection changes and applies translations to the page.
 */
languageSelect.addEventListener('change', () => {
  document.cookie = 'language=' + languageSelect.value
  applyTranslationsToPage()
})

/**
 * Handles theme selection changes and applies the selected theme.
 */
document.querySelectorAll('#theme-select input[type="radio"]').forEach(range => {
  range.oninput = () => {
    if (range.checked) {
      document.cookie = 'color_theme=' + range.value
      applyPageSettings()
    }
  }
})

/**
 * Handles text size slider changes and applies the new text size.
 */
textSize.oninput = () => {
  document.cookie = 'text_size=' + (textSize.value / 100)
  textSize.nextElementSibling.textContent = textSize.value + '%'
  applyPageSettings()
}

/**
 * Handles volume slider changes and updates the background volume.
 */
volumeSliders.forEach(slider => {
  slider.oninput = () => {
    document.cookie = slider.id + '=' + (slider.value)
    slider.nextElementSibling.textContent = slider.value + '%'
    updateBGVolume()
  }
})

/**
 * Handles colorblind mode selection changes and applies the setting.
 */
colorblind.addEventListener('change', () => {
  document.cookie = 'colorblind_mode=' + colorblind.value
  applyPageSettings()
})

/**
 * Handles high contrast mode toggle and applies the setting.
 */
contrast.oninput = () => {
  if (contrast.checked) {
    document.cookie = 'high_contrast_mode=true'
  } else {
    document.cookie = 'high_contrast_mode=false'
  }
  applyPageSettings()
}

/**
 * Handles mute toggle and updates all volume sliders and background volume.
 */
volume.oninput = () => {
  if (volume.checked) {
    document.cookie = 'muted=true'
    volumeSliders.forEach(range => {
      range.disabled = true
      range.value = 0
      range.nextElementSibling.textContent = '0%'
    })
  } else {
    document.cookie = 'muted=false'
    volumeSliders.forEach(range => {
      range.disabled = false
      range.value = getCookie(range.id)
      range.nextElementSibling.textContent = range.value + '%'
    })
  }
  updateBGVolume()
}
