import getCookie from './functions.mjs'

/**
 * The background music Audio object for the game.
 */
export const backgroundMusic = new Audio('/audio/game-theme.mp3')
backgroundMusic.addEventListener('ended', () => {
  this.currentTime = 0
  this.play()
})
backgroundMusic.loop = true

let isFading = false

/**
 * Fades the background music in or out over a given duration.
 *
 * @param {string} direction - 'in' to fade in, 'out' to fade out.
 * @param {number} [duration=500] - Duration of the fade in milliseconds.
 * @returns {Promise<void>} Resolves when the fade is complete.
 */
function _doFade (direction, duration = 500) {
  if (isFading) return Promise.resolve()
  isFading = true

  return new Promise(resolve => {
    const startTime = Date.now()
    let startVolume = backgroundMusic.volume
    if (getCookie('muted') === 'true' || getCookie('master_volume') === '0' ||
        getCookie('music_volume') === '0') { startVolume = 0 }
    const targetVolume = direction === 'out' ? 0 : getTargetVolume()

    const tick = () => {
      const elapsedTime = Date.now() - startTime
      const progress = Math.min(1, elapsedTime / duration)

      document.body.style.opacity = (direction === 'in') ? progress : 1 - progress

      if (!backgroundMusic.paused) {
        const volumeChange = targetVolume - startVolume
        backgroundMusic.volume = startVolume + (volumeChange * progress)
      }

      if (progress < 1) {
        window.requestAnimationFrame(tick)
      } else {
        if (direction === 'out') {
          backgroundMusic.pause()
        }
        isFading = false
        resolve()
      }
    }

    tick()
  })
}

/**
 * Gets the target volume for the background music based on user settings.
 *
 * @returns {number} The target volume between 0 and 1.
 */
function getTargetVolume () {
  const master = ((parseInt(getCookie('master_volume')) / 100) || 1)
  const music = ((parseInt(getCookie('music_volume')) / 100) || 0.5)
  if (getCookie('muted') === 'true' || getCookie('master_volume') === '0' ||
        getCookie('music_volume') === '0') return 0
  return master * music * 0.5
}

/**
 * Initializes the page sound, fading in the background music if applicable.
 */
export function initPageSound () {
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) {
      document.body.style.opacity = 0
      const wasPlaying = sessionStorage.getItem('music_was_playing') === 'true'

      if (wasPlaying) {
        const resumeTime = parseFloat(sessionStorage.getItem('music_current_time') || '0')
        sessionStorage.clear()
        backgroundMusic.currentTime = resumeTime + 0.5
        backgroundMusic.volume = 0
        backgroundMusic.play().then(() => {
          _doFade('in')
        }).catch(() => {
          document.body.addEventListener('click', () => backgroundMusic.play(), { once: true })
          _doFade('in')
        })
      } else {
        backgroundMusic.volume = getTargetVolume()
        backgroundMusic.play().catch(() => {
          document.body.addEventListener('click', () => backgroundMusic.play(), { once: true })
        })
        _doFade('in')
      }
    } else {
      _doFade('in')
    }
  })
}

/**
 * Navigates to a new URL with a fade effect, saving the current music state.
 *
 * @param {string} destinationUrl - The URL to navigate to.
 */
export function navigateWithFade (destinationUrl) {
  if (!backgroundMusic.paused) {
    sessionStorage.setItem('music_was_playing', 'true')
    sessionStorage.setItem('music_current_time', backgroundMusic.currentTime)
  }

  _doFade('out').then(() => {
    window.location.href = destinationUrl
  })
}

/**
 * Plays a sound effect from the given file path.
 *
 * @param {string} filePath - The file path of the sound effect.
 * @returns {Promise<void>} Resolves when the sound effect is played.
 */
export function playSound (filePath) {
  const sound = new Audio(filePath)
  const master = ((parseInt(getCookie('master_volume')) / 100) || 1)
  const sfx = ((parseInt(getCookie('sfx_volume')) / 100) || 0.5)
  sound.volume = master * sfx * 0.5
  if (getCookie('muted') === 'true' || getCookie('master_volume') === '0' ||
        getCookie('sfx_volume') === '0') { sound.volume = 0 }
  return sound.play()
}

/**
 * Updates the background music volume based on user settings.
 */
export function updateBGVolume () {
  const master = ((getCookie('master_volume') / 100) || 1)
  const music = ((getCookie('music_volume')) / 100 || 0.5)
  backgroundMusic.volume = master * music * 0.5
  if (getCookie('muted') === 'true' || getCookie('master_volume') === '0' ||
        getCookie('music_volume') === '0') { backgroundMusic.volume = 0 }
}
