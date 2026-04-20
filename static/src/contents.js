
import { parseHTMLDoc, getIndexedLinks, composeQueryDir, normalizeDirName, getTree, toc_link_attr } from './utils.js';

async function getTreeWithError() {

    try {
        const response = await getTree();
        if (!response.ok) throw new Error(response.statusText);

        return await response.json();

    } catch (error) {
        console.error('Caught error:', error.message);
        const buildFailed = document.createElement('p');
        buildFailed.innerHTML = 'Error: Failed to load table of contents.'
        throw buildFailed;
    }
}

export async function buildTableStructure(dir = undefined) {
    const table = document.querySelector('#main-con');

    try {
        const tree = await getTreeWithError();
        buildTableStructure1(dir, tree, table);
    } catch (buildFailed) {

        if (buildFailed instanceof HTMLElement) {
            table.replaceWith(buildFailed);
        } else {
            console.error('Unexpected error in buildTableStructure:', buildFailed);
            throw buildFailed;
        }
    }
}

function buildTableStructure1(dir, tree, table) {

    let promises = [];

    if (!dir) { // Main TOC

        const preamble = tree.find((part) => part.preamble);

        const tr = document.createElement('tr');
        const tdx = document.createElement('td');
        const p_link = document.createElement('td');
        addLinkToEntry(p_link, preamble.header, preamble.path_part);
        tr.appendChild(tdx);
        tr.appendChild(p_link);
        table.appendChild(tr);

    }

    for (let part of tree) {
        if ((dir && !dir.includes(part.path_part)) || part.preamble) {
            continue;
        }

        const tbody_p = document.createElement('tbody');
        tbody_p.classList.add('contents');
        tbody_p.id = partID(part.path_part);

        const tr1 = document.createElement('tr');
        const part_num = document.createElement('th');
        part_num.id = 'part-num';
        part_num.setAttribute('colspan', 2);
        part_num.innerHTML = normalizeDirName(part.path_part);
        tr1.appendChild(part_num);
        tbody_p.appendChild(tr1);

        if (part.header) {
            const tr2 = document.createElement('tr');
            const part_header = document.createElement('th');
            part_header.id = 'part-header';
            part_header.setAttribute('colspan', 2);
            part_header.innerHTML = part.header;
            tr2.appendChild(part_header);
            tbody_p.appendChild(tr2);
        }

        if (part.note) {
            const td = document.createElement('td');
            const i = document.createElement('i');
            i.innerHTML = 'Note: ';
            td.appendChild(i);
            td.innerHTML += part.note;
            td.setAttribute('colspan', '2');
            tbody_p.appendChild(td);
        }

        table.appendChild(tbody_p);

        let p_dir = composeQueryDir(part.path_part);

        if (part.has_chapters) {

            for (let chapter of part.chapters) {
                if (dir && dir !== part.path_part && !dir.includes(chapter.path_part)) {
                    continue;
                }

                const tbody_c = document.createElement('tbody');
                tbody_c.classList.add('contents');
                tbody_c.id = partID(chapter.path_part);

                const tr_c = document.createElement('tr');
                const c_header = document.createElement('th');
                c_header.id = 'part-header';
                c_header.setAttribute('colspan', 2);
                c_header.innerHTML = chapter.header;
                tr_c.appendChild(c_header);
                tbody_c.appendChild(tr_c);

                table.appendChild(tbody_c);

                let c_dir = composeQueryDir(chapter.path_part, p_dir);
                promises.push(articles(tbody_c, undefined, c_dir).then(() => {
                    if (chapter.subheadings) {
                        makeSubheadings(chapter.subheadings);
                    }
                }));

            }

        } else {

            promises.push(articles(tbody_p, undefined, p_dir).then(() => {
                if (part.subheadings) {
                    makeSubheadings(part.subheadings);
                }
            }));
        }
    }

    Promise.all(promises).then(() => $(document).trigger('tableBuilt'));
}

// Find articles

export async function indexDirs(errorPrefix, dir = './') {
    return fetch(dir)
        .then(response => response.text())
        .then(html => {
            const links = getIndexedLinks(html);
            const dirs = links
                .filter(link => link.endsWith('/')
                    && !link.includes('Preamble'));
            return dirs;
        })
        .catch(error => console.error(errorPrefix, error));
}

// Make article entries

function makeArticle(article) {
    const entry = document.createElement('tr');
    const num_cell = document.createElement('td');
    const split_path = article.split('/');
    const dir = split_path[split_path.length - 2];
    entry.id = (isNaN(dir) && isNaN(dir.substr(0, dir.length - 1))) ? dir : 'a' + dir;
    entry.setAttribute(toc_link_attr, article);
    const num = (dir + '.').replace('_', ' ');
    num_cell.innerHTML = num;
    num_cell.style = 'width: 5em;';
    entry.appendChild(num_cell);

    fetch(article)
        .then(response => response.text())
        .then(html => {
            const doc = parseHTMLDoc(html);
            const latest_version_path = article.toString() + doc.querySelector('.art-holder').getAttribute('name');
            fetch(latest_version_path)
                .then(response => response.text())
                .then(html => {
                    const version_doc = parseHTMLDoc(html);
                    let margin_elem = version_doc.querySelector('.art');

                    Array.from(margin_elem.querySelectorAll('del, .del')).map(del => margin_elem.removeChild(del));

                    let margin_text = margin_elem.innerText;
                    if (margin_text.startsWith(num)) {
                        margin_text = margin_text.substr(num.length + 1);
                    }
                    margin_text = margin_text.replace('—', '');

                    const margin = document.createElement('td');
                    addLinkToEntry(margin, margin_text, article);

                    if (doc.querySelector('#omitted-indicator')) {
                        const i = document.createElement('i');
                        i.innerText = '(Omitted)';
                        margin.innerHTML += ' ';
                        margin.appendChild(i);
                    }

                    entry.appendChild(margin);
                })
                .catch(error => console.error('Error fetching article text:', error));
        })
        .catch(error => console.error('Error fetching article version:', error));

    return entry;
}

async function articles(contents, exclude = [], dir = './') {
    //const tbody = contents.querySelector('tbody');
    return indexDirs('Error fetching articles:', dir = dir)
        .then(articles =>
            articles
                .filter(a => !exclude.includes(normalizeDirName(a)))
                .sort((a, b) => parseInt(normalizeDirName(a)) - parseInt(normalizeDirName(b)))
                .map(a => dir + a)
                .map(makeArticle)
                .map(a => contents.appendChild(a))
        );
}

function addLinkToEntry(margin, margin_text, link) {
    const a = document.createElement('a');
    a.innerHTML = margin_text;
    a.setAttribute('href', link);
    margin.appendChild(a);
}

// Subheadings

function makeSubheadings(subheadings) {
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

// Table builder

function partID(part) {
    return part
        .replaceAll(', ', '_')
        .replaceAll(' ', '_')
        .toLowerCase()
        .replace('/');
}

export function partDir(part) {
    return part.replaceAll(', ', '/').replaceAll(' ', '_') + '/';
}

export async function flatParts() {
    const tree = await getTreeWithError();

    let flat = [];

    for (let part of tree) {
        part.dir = part.path_part;
        flat.push(part);

        if (part.has_chapters) {
            for (let chapter of part.chapters) {
                chapter.dir = composeQueryDir(chapter.path_part, part.dir);
                flat.push(chapter);
            }
        }
    }

    return flat;
}
