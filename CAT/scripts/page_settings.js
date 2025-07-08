import getCookie from "./functions.mjs";
import { applyTranslationsToPage } from "./translator.mjs";

applyTranslationsToPage();

const r = document.querySelector(':root');

if(getCookie("high_contrast_mode") === "true") {
    r.style.setProperty('--color-soft-border', '#000000');
    r.style.setProperty('--color-softer-border', '#000000');
    r.style.setProperty('--color-shadow', '#333333');
    r.style.setProperty('--color-shadow-darker', '#222222');
    r.style.setProperty('--color-text', '#000000');
}

if(getCookie("color_theme") === "dark") {
    r.style.setProperty('--color-background', '#292929');
    r.style.setProperty('--color-background-darker', '#1F1F1F');
    r.style.setProperty('--color-border', '#FFFFFF');
    r.style.setProperty('--color-soft-border', '#EEEEEE');
    r.style.setProperty('--color-softer-border', '#AAAAAA');
    r.style.setProperty('--color-icon', '#FFFFFF');
    r.style.setProperty('--color-shadow', '#999999');
    r.style.setProperty('--color-shadow-darker', '#666666');
    r.style.setProperty('--color-text', '#FFFFFF');
    r.style.setProperty('--color-pink', '#CDA2D8');
    r.style.setProperty('--color-blue', '#A2CDD8');
    r.style.setProperty('--color-green', '#C2D8A2');
    r.style.setProperty('--color-orange', '#D8BCA2');
    r.style.setProperty('--color-important', '#C0392B');
    r.style.setProperty('--color-strong', '#D35400');
}

if(getCookie("colorblind_mode") === "protanopia") {
    r.style.setProperty('--color-pink', '#D55E00');
    r.style.setProperty('--color-blue', '#56B4E9');
    r.style.setProperty('--color-orange', '#E69F00');
    r.style.setProperty('--color-green', '#F0E442');
    r.style.setProperty('--color-pink-darker', '#bd5200');
    r.style.setProperty('--color-blue-darker', '#4c9fcf');
    r.style.setProperty('--color-orange-darker', '#cc8b00');
    r.style.setProperty('--color-green-darker', '#d6cc3a');
}

if(getCookie("colorblind_mode") === "deuteranopia") {
    r.style.setProperty('--color-pink', '#D55E00');
    r.style.setProperty('--color-blue', '#56B4E9');
    r.style.setProperty('--color-orange', '#E69F00');
    r.style.setProperty('--color-green', '#F0E442');
    r.style.setProperty('--color-pink-darker', '#bd5200');
    r.style.setProperty('--color-blue-darker', '#4c9fcf');
    r.style.setProperty('--color-orange-darker', '#cc8b00');
    r.style.setProperty('--color-green-darker', '#d6cc3a');
}

if(getCookie("colorblind_mode") === "tritanopia") {
    r.style.setProperty('--color-pink', '#CC79A7');
    r.style.setProperty('--color-blue', '#0072B2');
    r.style.setProperty('--color-orange', '#D55E00');
    r.style.setProperty('--color-green', '#009E73');
    r.style.setProperty('--color-pink-darker', '#b36992');
    r.style.setProperty('--color-blue-darker', '#006199');
    r.style.setProperty('--color-orange-darker', '#bd5200');
    r.style.setProperty('--color-green-darker', '#008561');
}

if(getCookie("color_theme") === "grayscale") {
    r.style.setProperty('--color-pink', '#777777');
    r.style.setProperty('--color-blue', '#999999');
    r.style.setProperty('--color-orange', '#BBBBBB');
    r.style.setProperty('--color-green', '#DDDDDD');
    r.style.setProperty('--color-pink-darker', '#777777');
    r.style.setProperty('--color-blue-darker', '#999999');
    r.style.setProperty('--color-orange-darker', '#BBBBBB');
    r.style.setProperty('--color-green-darker', '#DDDDDD');
    r.style.setProperty('--color-important', '#111111');
    r.style.setProperty('--color-strong', '#333333');
}

if(getCookie("text_size")) {
    const scale = getCookie("text_size");
    r.style.setProperty('--size-p', (1 * scale).toString() + 'rem');
    r.style.setProperty('--size-h1', (2.5 * scale).toString() + 'rem');
    r.style.setProperty('--size-h2', (1.8 * scale).toString() + 'rem');
    r.style.setProperty('--size-h3', (1.3 * scale).toString() + 'rem');
    r.style.setProperty('--size-icon', (1 * scale).toString() + 'rem');
    r.style.setProperty('--size-icon-action', (1.5 * scale).toString() + 'rem');
}

