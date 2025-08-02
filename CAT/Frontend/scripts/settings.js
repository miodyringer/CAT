import getCookie from "./functions.mjs";
import {playSound, updateBGVolume} from "./audio_manager.mjs";
import {applyPageSettings} from "./page_settings.js";
import {applyTranslationsToPage} from "./translator.mjs";

const light = document.querySelector("#theme-light");
const dark = document.querySelector("#theme-dark");
const grayscale = document.querySelector("#theme-grayscale");
const volume = document.querySelector('#mute-all');
const volumeSliders = document.querySelectorAll('input[type="range"][id*="volume"]');
const textSize = document.querySelector('#text_size');
const contrast = document.querySelector('#high-contrast-mode');
const contrastBox = document.querySelector("#high-contrast-mode");
const colorblind = document.querySelector("#colorblind-mode");
const languageSelect = document.querySelector("#language-select");

const currentLang = getCookie("language") || "en";
languageSelect.value = currentLang;

const contrast_mode = getCookie("high_contrast_mode") || "false";
contrastBox.checked = contrast_mode === "true";

const color_theme = getCookie("color_theme") || "light";
if(color_theme === "light") { light.checked = true }
if(color_theme === "dark") { dark.checked = true }
if(color_theme === "grayscale") { grayscale.checked = true }

const colorblind_mode = getCookie("colorblind_mode") || "off";
colorblind.value = colorblind_mode;

const muted = getCookie("muted") || "false";
volume.checked = muted === "true";

const text = getCookie("text_size") || 1;
textSize.value = text * 100;
textSize.nextElementSibling.textContent = Math.round(textSize.value) + "%";

if(muted === "true") {
    volumeSliders.forEach((range) => {
        range.disabled = true;
        range.value = 0;
        range.nextElementSibling.textContent = "0%";
    });
}
else{
    volumeSliders.forEach((range) => {
        const volume = getCookie(range.id) || "50";
        range.value = volume;
        range.nextElementSibling.textContent = volume + "%";
    });
}

languageSelect.addEventListener('change', () => {
    document.cookie = "language=" + languageSelect.value;
    applyTranslationsToPage();
});

document.querySelectorAll('#theme-select input[type="radio"]').forEach(range => {
    range.oninput = () => {
        if(range.checked){
            document.cookie = "color_theme="+ range.value;
            applyPageSettings();
        }
    }
});

textSize.oninput = () => {
    document.cookie = "text_size=" + (textSize.value / 100);
    textSize.nextElementSibling.textContent = textSize.value + "%";
    applyPageSettings();
}

volumeSliders.forEach(slider => {
    slider.oninput = () => {
        document.cookie = slider.id + "=" + (slider.value);
        slider.nextElementSibling.textContent = slider.value + "%";
        updateBGVolume();
    }
})

colorblind.addEventListener('change', () => {
    document.cookie = "colorblind_mode=" + colorblind.value;
    applyPageSettings();
})

contrast.oninput = () => {
    if(contrast.checked){
        document.cookie = "high_contrast_mode=true";
    }
    else{
        document.cookie = "high_contrast_mode=false";
    }
    applyPageSettings();
};

volume.oninput = () => {
    if(volume.checked){
        document.cookie = "muted=true";
        volumeSliders.forEach(range => {
            range.disabled = true;
            range.value = 0;
            range.nextElementSibling.textContent = "0%";
        })
    }
    else{
        document.cookie = "muted=false";
        volumeSliders.forEach(range => {
            range.disabled = false;
            range.value = getCookie(range.id);
            range.nextElementSibling.textContent = range.value + "%";
        })
    }
    updateBGVolume()
};