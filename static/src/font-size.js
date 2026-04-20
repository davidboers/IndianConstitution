
const root = document.documentElement;

const $toggle_small = $('#font-size-small');
const $toggle_large = $('#font-size-large');

toggle_small.addEventListener('click', () => {
    root.style.setProperty('--base-font-size', toggle_small.css('fontSize'));
});

toggle_large.addEventListener('click', () => {
    root.style.setProperty('--base-font-size', toggle_large.css('fontSize'));
});