import getCookie from './functions.mjs'

export const backgroundMusic = new Audio('/audio/game-theme.mp3')
backgroundMusic.addEventListener('ended', () => {
  this.currentTime = 0
  this.play()
})
backgroundMusic.loop = true

let isFading = false

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

function getTargetVolume () {
  const master = ((parseInt(getCookie('master_volume')) / 100) || 1)
  const music = ((parseInt(getCookie('music_volume')) / 100) || 0.5)
  if (getCookie('muted') === 'true' || getCookie('master_volume') === '0' ||
        getCookie('music_volume') === '0') return 0
  return master * music * 0.5
}

export function initPageSound () {
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) {
      document.body.style.opacity = 0
      const wasPlaying = sessionStorage.getItem('music_was_playing') === 'true'

      if (wasPlaying) {
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

export function navigateWithFade (destinationUrl) {
  if (!backgroundMusic.paused) {
    sessionStorage.setItem('music_was_playing', 'true')
    sessionStorage.setItem('music_current_time', backgroundMusic.currentTime)
  }

  _doFade('out').then(() => {
    window.location.href = destinationUrl
  })
}

export function playSound (filePath) {
  const sound = new Audio(filePath)
  const master = ((parseInt(getCookie('master_volume')) / 100) || 1)
  const sfx = ((parseInt(getCookie('sfx_volume')) / 100) || 0.5)
  sound.volume = master * sfx * 0.5
  if (getCookie('muted') === 'true' || getCookie('master_volume') === '0' ||
        getCookie('sfx_volume') === '0') { sound.volume = 0 }
  return sound.play()
}

export function updateBGVolume () {
  const master = ((getCookie('master_volume') / 100) || 1)
  const music = ((getCookie('music_volume')) / 100 || 0.5)
  backgroundMusic.volume = master * music * 0.5
  if (getCookie('muted') === 'true' || getCookie('master_volume') === '0' ||
        getCookie('music_volume') === '0') { backgroundMusic.volume = 0 }
}
