import { lang } from './utils.js';

$('header').load(`/${lang}/header.html`);
$('#main-nav').load(`/${lang}/main-nav.html`);
$('footer').load(`/${lang}/footer.html`);

if (document.querySelector('.art-holder')) {
    $('.art-holder').each(function() {
        $(this).load($(this).attr('name'));
    });
}

// Clause references

let pattern = /\(([a-z]|ii)\)/;
Array.from(document.querySelectorAll('p')).map(p => {
    while (p.innerHTML.search(pattern) != -1) {
        let html = p.innerHTML;
        let index = html.search(pattern);
        let newhtml = `(<i>${html.substr(index + 1, 1)}</i>)`;
        p.innerHTML = html.replace(pattern, newhtml);
    }
});