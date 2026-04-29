import { lang } from './utils.js';

if ($('header').children().length === 0) $('header').load(`/${lang}/header.html`);
if ($('#main-nav').children().length === 0) $('#main-nav').load(`/${lang}/main-nav.html`);
if ($('footer').children().length === 0) $('footer').load(`/${lang}/footer.html`);

const pattern = /(?<=>|^|\s|"|—)\(([a-z]+|[A-Z]+)\)/g;

function formatRefs($div) {
    $div.find('p, li, td, th').each(function () {
        let html = $(this).html();

        html = html.replace(pattern, function (match, inner) {
            return `(<i>${inner}</i>)`;
        });

        $(this).html(html);
    });
}


// Provisions with limited application

function setupLimitedApplication($div) {

    function updateShowing(state) {
        $div.find('.la').each(function () {
            $(this).hide();
        });

        $div.find(`.la-${state}`).each(function () {
            if ($(this).is('del, .del') && !$(this).hasClass('changes')) {
                return;
            }
            $(this).show();
        });
    }

    if ($div.find('.la').length === 0) return;

    updateShowing($div.find('.toggled-la').text().toLowerCase());

    $div.find('.toggle-la').each(function () {
        const state = $(this).text().toLowerCase();
        $(this).on('click', function () {
            if ($(this).hasClass('toggled-la')) {
                $(this).toggleClass('toggled-la');
                updateShowing('x');
                return;
            }

            updateShowing(state);

            $div.find('.toggled-la').toggleClass('toggled-la');
            $(this).toggleClass('toggled-la');
        });
    })
};


// Full formatting of article text

export function formatArticleText($div) {
    formatRefs($div);
    setupLimitedApplication($div);
}

if ($('.art-holder').length) {
    $('.art-holder').each(function () {
        if ($(this).children().length) formatArticleText($(this));
        $(this).load($(this).attr('name'), () => formatArticleText($(this)));
    });
}