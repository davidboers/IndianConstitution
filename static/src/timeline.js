
const begin = new Date(1949, 11, 26);
const end = new Date();

getFrac = function (date) {
    return (date.getTime() - begin.getTime()) / (end.getTime() - begin.getTime());
}

changeVersion = function (link) {
    document.querySelector('.art-holder').setAttribute('data', link);
    document.querySelector('.timeline-label-bold').className = 'timeline-label';
    const labels = document.getElementsByClassName('timeline-label');
    for (let i = 0; i < labels.length; i++) {
        const selected = labels[i].getAttribute('name') === link;
        labels[i].className = (selected) ? 'timeline-label-bold' : 'timeline-label';
    }
}

amendmentNumber = function (link) {
    if (link.includes('/')) {
        link = link.substr(link.lastIndexOf('/') + 1);
    }
    if (link === 'original.html') {
        return 'Orig.';
    }
    if (link.startsWith('a') && link.endsWith('.html')) {
        return link.replace('a', '').replace('.html', '');
    }
}

window.onload = () => {
    const timeline = document.getElementById('timeline');
    const coefficient = timeline.clientWidth / document.querySelector('body').clientWidth * 100;

    addAmendment = function (link) {
        fetch(link)
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const effectiveDate = doc.querySelector('#effective-date');
                const day = parseInt(effectiveDate.querySelector('#eff-day').innerHTML);
                const month = parseInt(effectiveDate.querySelector('#eff-month').innerHTML);
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
                timeline.appendChild(label);
            })
            .catch(error => console.error('Error fetching version html:', error))
    }

    fetch('./version')
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = Array.from(doc.querySelectorAll('a'))
                .map(link => 'version/' + link.innerHTML)
                .filter(href => href.endsWith('.html'));
            links.forEach(link => addAmendment(link));
        })
        .catch(error => console.error('Error fetching directory listing:', error));

    const line = document.createElement('div');
    line.className = 'timeline-axis';
    timeline.appendChild(line);

    for (let decade = 1950; decade < 2030; decade += 10) {
        
    }
}