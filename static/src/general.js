import { lang } from '/static/src/utils.js';

$('header').load(`/${lang}/header.html`);
$('#main-nav').load(`/${lang}/main-nav.html`);
$('footer').load(`/${lang}/footer.html`);

const pattern = /\(([0-9a-zA-Z]+)\)/g;

if (document.querySelector('.art-holder')) {
    $('.art-holder').each(function () {
        $(this).load($(this).attr('name'),

            // Clause references
            () => {
                $('.art-holder p').each(function () {
                    let html = $(this).html();

                    html = html.replace(pattern, function (match, inner) {
                        return `(<i>${inner}</i>)`;
                    });

                    $(this).html(html);
                });
            })
    });
}