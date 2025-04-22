
import { parseHTMLDoc } from './utils.js';

function getIndexedLinks (html) {
    const doc = parseHTMLDoc(html);
    const links = Array.from(doc.querySelectorAll('a'))
        .filter(link => link.innerText != '../')
        .map(link => link.href);
    return links;
}

async function indexDirs(errorPrefix) {
    return fetch('./')
        .then(response => response.text())
        .then(html => {
            const links = getIndexedLinks(html);
            const dirs = links
                .filter(link => link.endsWith('/') && !link.includes('Preamble'));
            return dirs;
        })
        .catch(error => console.error(errorPrefix, error));
}

// Articles

function makeArticle(article) {
    const entry = document.createElement('tr');
    const num_cell = document.createElement('td');
    const split_path = article.split('/');
    const dir = split_path[split_path.length-2];
    entry.id = (isNaN(dir) && isNaN(dir.substr(0, dir.length - 1))) ? dir : 'a' + dir;
    entry.title = article;
    const num = (dir + '.').replace('_', ' ');
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

export async function articles(contents, exclude = []) {
    const tbody = contents.querySelector('tbody');
    return indexDirs('Error fetching articles:')
        .then(articles =>
            articles
                .filter(a => !exclude.includes(normalizeDirName(a)))
                .sort((a, b) => parseInt(normalizeDirName(a)) - parseInt(normalizeDirName(b)))
                .map(makeArticle)
                .map(a => tbody.appendChild(a))
        );
}

// Chapters and Parts

function normalizeDirName(path) {
    const parts = path.split('/');
    const parentDir = parts[parts.length - 2];
    return parentDir.replace(/_/g, ' ');
}

export function addPart(part) {
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
    return details;
}

export async function mainTable(contents, parts = []) {
    if (parts.length === 0) {
        parts = await indexDirs('Error fetching parts:');
    }
    parts.map(part => {
        contents.appendChild(addPart(part));
    })
}

// Subheadings

export function makeSubheadings(subheadings) {
    for (let article in subheadings) {
        let subheading = subheadings[article];
        const article_row = document.getElementById(article);
        if (article_row == null) {
            continue;
        }
        const subheading_row = document.createElement('tr');
        const subheading_th = document.createElement('th');
        subheading_th.className = 'subheading';
        subheading_th.colSpan = '2';
        subheading_th.innerText = subheading;
        subheading_row.appendChild(subheading_th)
        article_row.parentNode.insertBefore(subheading_row, article_row);
    }
}