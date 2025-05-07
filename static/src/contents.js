
import { parseHTMLDoc, getIndexedLinks } from './utils.js';

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

// Articles

function makeArticle(article) {
    const entry = document.createElement('tr');
    const num_cell = document.createElement('td');
    const split_path = article.split('/');
    const dir = split_path[split_path.length - 2];
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

                    if (doc.querySelector('#omitted-indicator') !== null) {
                        const i = document.createElement('i');
                        i.innerText = '(Omitted)';
                        link.innerHTML += ' ';
                        link.appendChild(i);
                    }

                    entry.appendChild(margin);
                })
                .catch(error => console.error('Error fetching article text:', error));
        })
        .catch(error => console.error('Error fetching article version:', error));

    return entry;
}

export async function articles(contents, exclude = [], dir = './') {
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

export async function mainTable(contents, parts = [], dir = './') {
    if (parts.length === 0) {
        parts = await indexDirs('Error fetching parts:', dir = dir);
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

// Table builder

function partID(part) {
    return part.replaceAll(', ', '_').replaceAll(' ', '_').toLowerCase();
}

export function partDir(part) {
    return part.replaceAll(', ', '/').replaceAll(' ', '_') + '/';
}

export async function buildFlatPart(part) {
    const id = partID(part);
    const dir = partDir(part);
    var contents = document.querySelector(`.contents#${id}`);
    if (contents === null) {
        return;
    }
    return articles(contents, undefined, dir);
}

export var flat_parts = [
    'Part I',
    'Part II', 
    'Part III',
    'Part IV', 
    'Part IVA', 
    'Part V, Chapter I', 'Part V, Chapter II', 'Part V, Chapter III', 'Part V, Chapter IV', 'Part V, Chapter V', 
    'Part VI, Chapter I', 'Part VI, Chapter II', 'Part VI, Chapter III', 'Part VI, Chapter IV', 'Part VI, Chapter V', 'Part VI, Chapter VI', 
    'Part VII',
    'Part VIII', 
    'Part IX', 
    'Part IXA',
    'Part IXB', 
    'Part X',
    'Part XI, Chapter I', 'Part XI, Chapter II',
    'Part XII, Chapter I', 'Part XII, Chapter II', 'Part XII, Chapter III', 'Part XII, Chapter IV',
    'Part XIII', 
    'Part XIV, Chapter I', 'Part XIV, Chapter II',
    'Part XIVA', 
    'Part XV',
    'Part XVI', 
    'Part XVII, Chapter I', 'Part XVII, Chapter II', 'Part XVII, Chapter III', 'Part XVII, Chapter IV',
    'Part XVIII', 
    'Part XIX',
    'Part XX', 
    'Schedules, First Schedule',
    'Schedules, Second Schedule'];

export var subheadings = {
    // Part III
    'a12': 'General',
    'a14': 'Right to Equality',
    'a19': 'Right to Freedom',
    'a23': 'Right against Exploitation',
    'a25': 'Right to Freedom of Religion',
    'a29': 'Cultural and Educational Rights',
    'a31A': 'Saving of Certain Laws',
    'a32': 'Right to Constitutional Remedies',

    // Part V, Chapter I
    'a52': 'The President and Vice-President',
    'a74': 'Council of Ministers',
    'a76': 'The Attorney-General for India',
    'a77': 'Conduct of Government Business',

    // Part V, Chapter II
    'a79': 'General',
    'a89': 'Officers of Parliament',
    'a99': 'Conduct of Business',
    'a101': 'Disqualification of Members',
    'a105': 'Powers, Privileges and Immunities of Parliament and its Members',
    'a107': 'Legislative Procedure',
    'a112': 'Procedure in Financial Matters',
    'a118': 'Procedure Generally',

    // Part VI, Chapter II
    'a153': 'The Governor',
    'a163': 'Council of Ministers',
    'a165': 'The Advocate-General for the State',
    'a166': 'Conduct of Government Business',

    // Part VI, Chapter III
    'a168': 'General',
    'a178': 'Officers of the State Legislature',
    'a188': 'Conduct of Business',
    'a194': 'Powers, privileges and immunities of State Legislatures and their Members',
    'a196': 'Legislative Procedure',
    'a202': 'Procedure in Financial Matters',
    'a208': 'Procedure Generally',

    // Part XI, Chapter I
    'a245': 'Distribution of Legislative Powers',

    // Part XI, Chapter II
    'a256': 'General',
    'a262': 'Disputes relating to Waters',
    'a263': 'Co-ordination between States',

    // Part XII, Chapter I
    'a264': 'General',
    'a268': 'Distribution of Revenues between the Union and the States',
    'a282': 'Miscellaneous Financial Provisions'
}
