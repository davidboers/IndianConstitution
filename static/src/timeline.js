import { formatRefs } from "./general.js";

const begin = new Date(1949, 10, 26); // 10 = November (0 indexed)
const end = new Date();

function getFrac(date) {
    return (date.getTime() - begin.getTime()) / (end.getTime() - begin.getTime());
}

function changeVersion($label, link) {
    $('.art-holder').attr('name', link);
    $('.art-holder').each(function() {
        formatRefs($(this));
    });
    $('.timeline-label-bold').removeClass('timeline-label-bold');
    $label.addClass('timeline-label-bold');
}

function amendmentNumber(link) {
    if (link.includes('/')) {
        link = link.substr(link.lastIndexOf('/') + 1);
    }
    if (link === 'original.html') {
        return 'Orig.';
    }
    if (link.endsWith('.html')) {
        link = link.replace('.html', '');
        if (/a[0-9]+/.test(link)) {
            return link.replace('a', '');
        } else {
            return link.toUpperCase();
        }
    }
}

void function () {
    const $timeline = $('#timeline');
    const coefficient = $timeline.width() / $('body').width() * 100;

    const $top_labels = $('<div></div>');
    const $bottom_labels = $('<div></div>');
    $top_labels.addClass('timeline-label-container');
    $bottom_labels.addClass('timeline-label-container');

    async function addAmendment(link) {
        try {
            const response = await fetch(link);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const $effectiveDate = $(doc).find('#effective-date');
            const day = parseInt($effectiveDate.find('#eff-day').html());
            const month = parseInt($effectiveDate.find('#eff-month').html()) - 1; // 0 indexed
            const year = parseInt($effectiveDate.find('#eff-year').html());

            const date = new Date(year, month, day);
            const frac = getFrac(date) * coefficient;

            const selected = $('.art-holder').attr('name') === link;
            const $label = $(`<span class="timeline-label"><span>${year.toString()}<br>${amendmentNumber(link)}</span></span>`);
            $label.css('left', `${frac}%`);
            if (selected) $label.addClass('timeline-label-bold');
            $label.on('click', () => changeVersion($label, link));
            $label.attr('name', link);

            return { date, $label };
        } catch (error) {
            console.error('Error fetching version html:', error);
        }
    }

    fetch('./version')
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const $links = Array.from($(doc).find('a')
                .map((_, link) => 'version/' + link.innerHTML)
                .filter((_, href) => href.endsWith('.html')));

            Promise.all($links.map(addAmendment)).then(amendments =>
                amendments
                    .filter(Boolean)
                    .sort((a1, a2) => a1.date - a2.date)
                    .forEach(amendment => {

                        if ($bottom_labels.children().length > $top_labels.children().length) {
                            $top_labels.append(amendment.$label);
                        } else {
                            $bottom_labels.append(amendment.$label);
                        }

                    }))
        })
        .catch(error => console.error('Error fetching directory listing:', error));

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