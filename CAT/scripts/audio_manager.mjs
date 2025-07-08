import getCookie from "./functions.mjs";

export const backgroundMusic = new Audio('/audio/game-theme.mp3');

let isFading = false;

function _doFade(direction, duration = 500) {
    if (isFading) return Promise.resolve();
    isFading = true;

    return new Promise(resolve => {
        const startTime = Date.now();
        let startVolume = backgroundMusic.volume;
        if (getCookie("muted") === "true" || getCookie("master_volume") === "0" ||
        getCookie("music_volume") === "0") { startVolume = 0 }
        const targetVolume = direction === 'out' ? 0 : getTargetVolume();

        const tick = () => {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min(1, elapsedTime / duration);

            document.body.style.opacity = (direction === 'in') ? progress : 1 - progress;

            if (!backgroundMusic.paused) {
                const volumeChange = targetVolume - startVolume;
                backgroundMusic.volume = startVolume + (volumeChange * progress);
            }

            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                if (direction === 'out') {
                    backgroundMusic.pause();
                }
                isFading = false;
                resolve();
            }
        };

        tick();
    });
}

function getTargetVolume() {
    const master = ((parseInt(getCookie("master_volume")) / 100) || 1);
    const music = ((parseInt(getCookie("music_volume")) / 100) || 0.5);
    if (getCookie("muted") === "true" || getCookie("master_volume") === "0" ||
        getCookie("music_volume") === "0") return 0;
    return master * music * 0.5;
}

export function initPageSound() {
    document.head.insertAdjacentHTML('beforeend', '<style>body{opacity:0;}</style>');

    document.addEventListener('DOMContentLoaded', () => {
        const wasPlaying = sessionStorage.getItem('music_was_playing') === 'true';

        if (wasPlaying) {
            const resumeTime = parseFloat(sessionStorage.getItem('music_current_time') || '0');
            sessionStorage.clear();

            backgroundMusic.currentTime = resumeTime + 0.5;
            backgroundMusic.volume = 0;

            backgroundMusic.play().then(() => {
                _doFade('in');
            }).catch(() => {
                document.body.style.opacity = 1;
                document.body.addEventListener('click', () => {
                    backgroundMusic.volume = getTargetVolume();
                    backgroundMusic.play();
                }, { once: true });
            });
        } else {
            _doFade('in');
            backgroundMusic.volume = getTargetVolume();
            backgroundMusic.play().catch(() => {
                document.body.addEventListener('click', () => backgroundMusic.play(), { once: true });
            });
        }
    });
}

export function navigateWithFade(destinationUrl) {
    if (!backgroundMusic.paused) {
        sessionStorage.setItem('music_was_playing', 'true');
        sessionStorage.setItem('music_current_time', backgroundMusic.currentTime);
    }

    _doFade('out').then(() => {
        window.location.href = destinationUrl;
    });
}

export function playSound(filePath) {
    const sound = new Audio('/audio/game-theme.mp3');
    const master = ((parseInt(getCookie("master_volume")) / 100) || 1);
    const sfx = ((parseInt(getCookie("sfx_volume")) / 100) || 0.5);
    sound.volume = master * sfx * 0.5
    if (getCookie("muted") === "true" || getCookie("master_volume") === "0" ||
        getCookie("sfx_volume") === "0") { sound.volume = 0 }
    return sound.play()
}

export function updateBGVolume(){
    const master = ((getCookie("master_volume") / 100) || 1);
    const music = ((getCookie("music_volume")) / 100 || 0.5);
    backgroundMusic.volume = master * music * 0.5;
    if (getCookie("muted") === "true" || getCookie("master_volume") === "0" ||
        getCookie("music_volume") === "0") { backgroundMusic.volume = 0 }
}