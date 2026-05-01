import { formatArticleText } from "./general.js";
import { getLangIndex, parseHTMLDoc } from "./utils.js";

const begin = new Date(1949, 10, 26); // 10 = November (0 indexed)
const end = new Date();

function getFrac(date) {
    return (date.getTime() - begin.getTime()) / (end.getTime() - begin.getTime());
}

function loadVersion(path, $holder) {
    // Do not import using article.content, as this is the raw template, not the complete version.
    $holder.load(path, () => formatArticleText($holder));
}

function changeVersion($label, slug, url) {
    const $holder = $('.art-holder');
    $holder.attr('data-version', slug);
    loadVersion(url, $holder);
    $('.timeline-label-bold').removeClass('timeline-label-bold');
    $label.addClass('timeline-label-bold');
}

function amendmentNumber(slug) {
    if (slug === 'original') return 'Orig.';
    return (/a[0-9]+/.test(slug)) ? slug.replace('a', '') : slug.toUpperCase();

}

void function () {
    const $holder = $('.art-holder');
    loadVersion(`version/${$holder.attr('data-version')}.html`, $holder);

    const $timeline = $('#timeline');
    const coefficient = $timeline.width() / $('body').width() * 100;

    const $top_labels = $('<div class="timeline-label-container"></div>');
    const $bottom_labels = $('<div class="timeline-label-container"></div>');

    function addAmendment(entry) {
        const $effectiveDate = $(parseHTMLDoc(entry.content)).find('#effective-date');
        const day = parseInt($effectiveDate.find('#eff-day').html());
        const month = parseInt($effectiveDate.find('#eff-month').html()) - 1; // 0 indexed
        const year = parseInt($effectiveDate.find('#eff-year').html());

        const date = new Date(year, month, day);
        const frac = getFrac(date) * coefficient;

        const selected = $('.art-holder').attr('data-version') === entry.slug;
        const $label = $(`<span class="timeline-label"><span>${year.toString()}<br>${amendmentNumber(entry.slug)}</span></span>`);
        $label.css('left', `${frac}%`);
        if (selected) $label.addClass('timeline-label-bold');
        $label.on('click', () => changeVersion($label, entry.slug, entry.url));
        $label.attr('data-version', entry.slug);

        return { date, $label };
    }

    getLangIndex()
        .then(index => {
            index.filter(entry => entry.article == window.location.pathname)
                .map(addAmendment)
                .sort((a1, a2) => a1.date - a2.date)
                .forEach(amendment => {
                    if ($bottom_labels.children().length > $top_labels.children().length) {
                        $top_labels.append(amendment.$label);

                    } else {
                        $bottom_labels.append(amendment.$label);

                    }

                });
        });

    const $axis = $('<div class="timeline-axis"></div>');
    const $line = $('<div class="timeline-line"></div>');
    $line.appendTo($axis);

    for (let decade = 1950; decade < 2030; decade += 10) {
        const $dec_mark = $('<div class="dec-mark"></div>');

        const date = new Date(decade, 0, 1); // 0 = January (0 indexed)
        const frac = getFrac(date) * coefficient;

        $dec_mark.css('left', `${frac}%`);
        $dec_mark.appendTo($axis);
    }

    $top_labels.appendTo($timeline);
    $axis.appendTo($timeline);
    $bottom_labels.appendTo($timeline);
}();