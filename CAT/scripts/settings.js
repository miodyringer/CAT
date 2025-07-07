import getCookie from "./functions.mjs";

const light = document.querySelector("#theme-light");
const dark = document.querySelector("#theme-dark");
const grayscale = document.querySelector("#theme-grayscale");
const volume = document.querySelector('#mute-all');
const volumeSliders = document.querySelectorAll('input[type="range"][id*="volume"]');
const textSize = document.querySelector('#text-size');
const contrast = document.querySelector('#high-contrast-mode');
const contrastBox = document.querySelector("#high-contrast-mode");
const colorblind = document.querySelector("#colorblind-mode");

textSize.addEventListener("mouseup", () => {
    window.location.reload()
});

if(getCookie("high_contrast_mode") === "true") {
    contrastBox.checked = true;
}

if(getCookie("color_theme") === "light" || !getCookie("color_theme")) {
    light.checked = true;
}
if(getCookie("color_theme") === "dark") {
    dark.checked = true;
}
if(getCookie("color_theme") === "grayscale") {
    grayscale.checked = true;
}

if(getCookie("colorblind_mode")){
    colorblind.value = getCookie("colorblind_mode");
}

if(getCookie("text_size")) {
    textSize.value = getCookie("text_size") * 100;
    textSize.nextElementSibling.textContent = Math.round(textSize.value) + "%";
}

if(getCookie("muted") === "true") {
    volume.checked = true;
    volumeSliders.forEach((range) => {
        range.disabled = true;
        range.value = 0;
        range.nextElementSibling.textContent = "0%";
    });
}

volumeSliders.forEach((range) => {
    if(getCookie(range.id)){
        range.value = getCookie(range.id);
        range.nextElementSibling.textContent = range.value + "%";
    }
    else{
        range.value = 50;
        range.nextElementSibling.textContent = "50%";
    }
})

document.querySelectorAll('#theme-select input[type="radio"]').forEach(range => {
    range.oninput = () => {
        if(range.checked){
            document.cookie = "color_theme="+ range.value;
            window.location.reload()
        }
    }
});

document.querySelectorAll('input[type="range"]').forEach(range => {
    const valueSpan = range.nextElementSibling;
    if (valueSpan && valueSpan.classList.contains('range-value')) {
        range.oninput = () => {
            if(range.id === "text-size") {
                document.cookie = "text_size=" + (range.value / 100);
            }
            valueSpan.textContent = range.value + '%';
            document.cookie = range.id + "=" + range.value;
        };
    }
});

colorblind.addEventListener('change', () => {
    document.cookie = "colorblind_mode=" + colorblind.value;
    window.location.reload()
})

contrast.oninput = () => {
    if(contrast.checked){
        document.cookie = "high_contrast_mode=true";
        window.location.reload();
    }
    else{
        document.cookie = "high_contrast_mode=false";
        window.location.reload();
    }
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
};