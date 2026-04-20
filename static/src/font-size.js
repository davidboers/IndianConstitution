
const root = document.documentElement;

const $toggle_small = $('#font-size-small');
const $toggle_large = $('#font-size-large');

function setSize(option) {
    root.style.setProperty('--base-font-size', option.css('fontSize'));
}

let cookie = decodeURIComponent(document.cookie).split(';').find((cookie) => cookie.startsWith('font-size='));
if (cookie && cookie.startsWith('font-size=large')) {
    setSize($toggle_large);
}

$toggle_small.on('click', () => {
    setSize($toggle_small);
    document.cookie = 'font-size=small; path=/';
});

$toggle_large.on('click', () => {
    setSize($toggle_large);
    document.cookie = 'font-size=large; path=/';
});