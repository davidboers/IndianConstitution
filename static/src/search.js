
import { parseHTMLDoc } from './utils.js';

function getIndexedLinks(html) {
    const doc = parseHTMLDoc(html);
    const links = Array.from(doc.querySelectorAll('a'))
        .filter(link => link.innerText != '../' && !link.innerText.includes('http-server'))
        .map(link => link.innerText);
    return links;
}

async function searchArticleVersion(path, query, articlePath) {
    return fetch(path)
        .then(response => response.text())
        .then(html => {
            const doc = parseHTMLDoc(html);
            const text = doc.querySelector('body').innerText.replace(/\s{2,}/g, ' ');
            let matches = [];
            let i = text.search(query);
            while (i != -1) {
                matches.push(i);
                i = text.indexOf(query, i + 1);
            }
            return { matches: matches, text: text, path: articlePath, query: query };
        })
        .catch(error => console.error('Error searching article version:', error));
}

async function searchArticle(path, query) {
    const currentVersion = await fetch(path)
        .then(response => response.text())
        .then(html => {
            const doc = parseHTMLDoc(html);
            return doc.querySelector('.art-holder').getAttribute('data');
        })
        .catch(error => console.error('Error finding current version of article:', error));
    const resultsCurrent = await searchArticleVersion(path + currentVersion, query, path);
    if (resultsCurrent.matches.length > 0) {
        return resultsCurrent;
    }
    const versions = await fetch(path + 'version/')
        .then(response => response.text())
        .then(html => getIndexedLinks(html, path).filter(link => link !== currentVersion))
        .catch(error => console.error('Error finding article version list:', error));
    const hits = await Promise.all(versions.map(version => searchArticleVersion(path + 'version/' + version, query, path)))
        .then(hits => hits.filter(result => result.matches.length > 0));
    if (hits.length === 0) {
        return null;
    }
    return hits.pop();
}

export async function searchArticles(paths, query) {
    const hits = await Promise.all(paths.map(path => searchArticle(path, query)))
        .then(hits => hits.filter(hit => hit != null));
    const container = document.getElementById('hits');
    if (hits.length === 0) {
        container.innerHTML = '<p id="no-results">No results found.</p>';
        return;
    }
    container.innerHTML = '';
    hits.map(hit => makeHitEntry(hit, query))
        .forEach(hit => container.appendChild(hit));
}

function makeHitEntry(hit, query) {
    const entry = document.createElement('div');
    entry.className = 'hit';

    const link = document.createElement('a');
    link.href = hit.path;
    link.className = 'hit-link';
    link.innerText = hit.path.split('/').map(seg => seg.replace('_', ' ')).filter(seg => seg.length > 0).join(' > ');
    entry.appendChild(link);

    for (let match of hit.matches) {
        let excerpt = document.createElement('p');
        let text = hit.text;
        let trail = 100;
        if (text.length > trail * 2) {
            let begin = Math.max(match - trail, 0);
            let end = Math.min(match + query.length + trail, text.length);
            text = text.substring(begin, end);
            if (begin !== 0) {
                text = '...' + text;
            }
            if (end !== text.length) {
                text += '...';
            }
        }
        excerpt.innerHTML = text.split(query).join(`<span class='excerpt-highlight'>${hit.query}</span>`);
        entry.appendChild(excerpt);
    }

    return entry;
}

// Article lists

async function getArticleListRecursive(path, list) {
    const html = await fetch(path)
        .then(response => response.text())
        .catch(error => console.error('Failed to index articles:', error));

    const doc = parseHTMLDoc(html);
    if (doc.querySelector('.art-holder') !== null) {
        list.push(path);
        return list;
    }
    
    const links = getIndexedLinks(html);
    return Promise.all(links.filter(link => link.endsWith('/'))
            .map(link => (path === './') ? link : path + link)
            .map(link => getArticleListRecursive(link, list)))
        .then(() => { return list });
}

export function getArticleList(root = './') {
    let list = [];
    return getArticleListRecursive(root, list);
}