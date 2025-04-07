parseHTMLDoc = function (html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return doc;
}

getIndexedLinks = function (html) {
    const doc = parseHTMLDoc(html);
    const links = Array.from(doc.querySelectorAll('a'))
        .filter(link => link.innerText != '../')
        .map(link => link.href);
    return links;
}

indexDirs = async function (errorPrefix) {
    return fetch('./')
        .then(response => response.text())
        .then(html => {
            const links = getIndexedLinks(html);
            const dirs = links
                .filter(link => link.endsWith('/'));
            return dirs;
        })
        .catch(error => console.error(errorPrefix, error));
}

// Articles

makeArticle = function (article) {
    const entry = document.createElement('tr');
    const num_cell = document.createElement('td');
    const split_path = article.split('/');
    const num = split_path[split_path.length-2] + '.';
    num_cell.innerHTML = num;
    num_cell.style = 'width: 50px;';
    entry.appendChild(num_cell);

    fetch(article)
        .then(response => response.text())
        .then(html => {
            const doc = parseHTMLDoc(html);
            const latest_version_path = article.toString() + doc.querySelector('.art-holder').getAttribute('data');
            fetch(latest_version_path)
                .then(response => response.text())
                .then(html => {
                    const version_doc = parseHTMLDoc(html);
                    let margin_text = version_doc.querySelector('.art').innerText;
                    if (margin_text.startsWith(num)) {
                        margin_text = margin_text.substr(num.length + 1);
                    }
                    margin_text = margin_text.replace('—', '');

                    const margin = document.createElement('td');
                    const link = document.createElement('a');
                    link.innerHTML = margin_text;
                    link.onclick = () => {
                        window.top.location.href = article;
                    };
                    margin.appendChild(link);
                    
                    entry.appendChild(margin);
                })
                .catch(error => console.error('Error fetching article text:', error));
        })
        .catch(error => console.error('Error fetching article version:', error));

    return entry;
}

articles = function (contents) {
    const tbody = contents.querySelector('tbody');
    indexDirs('Error fetching articles:')
        .then(articles =>
            articles
                .sort((a, b) => parseInt(normalizeDirName(a)) - parseInt(normalizeDirName(b)))
                .map(makeArticle)
                .map(a => tbody.appendChild(a))
        );
}

// Chapters and Parts

normalizeDirName = function (path) {
    const parts = path.split('/');
    const parentDir = parts[parts.length - 2];
    return parentDir.replace(/_/g, ' ');
}

mainTable = function (contents) {
    indexDirs('Error fetching parts:')
        .then(parts => {
            for (let part of parts) {
                const details = document.createElement('details');
                details.name = 'contents';

                const summary = document.createElement('summary');
                summary.innerHTML = normalizeDirName(part);

                const part_div = document.createElement('iframe');
                part_div.src = `${part}contents.html`;
                part_div.width = '100%';
                part_div.style.height = '50vh';
                part_div.style.border = 'none'

                details.appendChild(summary);
                details.appendChild(part_div);
                contents.appendChild(details);
            }
        });
}