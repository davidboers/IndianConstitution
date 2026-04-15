
const begin = new Date(1949, 10, 26); // 10 = November (0 indexed)
const end = new Date();

function getFrac(date) {
    return (date.getTime() - begin.getTime()) / (end.getTime() - begin.getTime());
}

function changeVersion(link) {
    document.querySelector('.art-holder').setAttribute('data', link);
    document.querySelector('.timeline-label-bold').className = 'timeline-label';
    const labels = document.getElementsByClassName('timeline-label');
    for (let i = 0; i < labels.length; i++) {
        const selected = labels[i].getAttribute('name') === link;
        labels[i].className = (selected) ? 'timeline-label-bold' : 'timeline-label';
    }
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

window.onload = () => {
    const timeline = document.getElementById('timeline');
    const coefficient = timeline.clientWidth / document.querySelector('body').clientWidth * 100;

    const top_labels = document.createElement('div');
    const bottom_labels = document.createElement('div');
    top_labels.className = bottom_labels.className = 'timeline-label-container';

    async function addAmendment(link) {
        try {
            const response = await fetch(link);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const effectiveDate = doc.querySelector('#effective-date');
            const day = parseInt(effectiveDate.querySelector('#eff-day').innerHTML);
            const month = parseInt(effectiveDate.querySelector('#eff-month').innerHTML) - 1; // 0 indexed
            const year = parseInt(effectiveDate.querySelector('#eff-year').innerHTML);

            const date = new Date(year, month, day);
            const frac = getFrac(date) * coefficient;

            const selected = document.querySelector('.art-holder').getAttribute('data') === link;
            const label = document.createElement('span');
            label.innerHTML = year.toString() + '</br>' + amendmentNumber(link);
            label.style.left = `${frac}%`;
            label.className = (selected) ? 'timeline-label-bold' : 'timeline-label';
            label.onclick = () => changeVersion(link);
            label.setAttribute('name', link);

            return { date, label };
        } catch (error) {
            console.error('Error fetching version html:', error);
        }
    }

    fetch('./version')
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = Array.from(doc.querySelectorAll('a'))
                .map(link => 'version/' + link.innerHTML)
                .filter(href => href.endsWith('.html'));

            Promise.all(links.map(addAmendment)).then(amendments =>
                amendments
                    .sort((a1, a2) => a1.date - a2.date)
                    .forEach(amendment => {

                        if (bottom_labels.children.length > top_labels.children.length) {
                            top_labels.appendChild(amendment.label);
                        } else {
                            bottom_labels.appendChild(amendment.label);
                        }

                    }))
        })
        .catch(error => console.error('Error fetching directory listing:', error));

    const axis = document.createElement('div');
    const line = document.createElement('div');
    axis.className = 'timeline-axis';
    line.className = 'timeline-line';
    axis.appendChild(line);

    for (let decade = 1950; decade < 2030; decade += 10) {
        const dec_mark = document.createElement('div');

        const date = new Date(decade, 0, 1); // 0 = January (0 indexed)
        const frac = getFrac(date) * coefficient;

        dec_mark.className = 'dec-mark';
        dec_mark.style.left = `${frac}%`;
        axis.appendChild(dec_mark);
    }

    timeline.appendChild(top_labels);
    timeline.appendChild(axis);
    timeline.appendChild(bottom_labels);
}