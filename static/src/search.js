
import { parseHTMLDoc, getIndexedLinks } from './utils.js';

async function searchArticleVersion(path, query, articlePath) {
    return fetch(path)
        .then(response => response.text())
        .then(html => {
            const doc = parseHTMLDoc(html);
            const text = doc.querySelector('body').innerText.replace(/\s{2,}/g, ' ');
            let matches = [];
            const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedQuery, 'gi');
            let match;
            while ((match = regex.exec(text)) !== null) {
                matches.push(match.index);
            }
            return { matches: matches, text: text, path: articlePath, query: regex };
        })
        .catch(error => console.error('Error searching article version:', error));
}

async function searchArticle(path, query) {
    const currentVersion = await fetch(path)
        .then(response => response.text())
        .then(html => {
            const doc = parseHTMLDoc(html);
            return doc.querySelector('.art-holder').getAttribute('name');
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

async function searchArticles(paths, query) {
    const hits = await Promise.all(paths.map(path => searchArticle(path, query)))
        .then(hits => hits.filter(hit => hit != null));
    const $container = $('#hits');
    if (hits.length === 0) {
        $container.html('<p id="no-results">No results found.</p>');
        return;
    }
    $container.empty();
    hits.map(hit => makeHitEntry(hit, query))
        .forEach(hit => $container.append(hit));
}

function makeHitEntry(hit, query) {
    const $entry = $('<div class="hit"></div>');

    const link_text = hit.path.split('/').map(seg => seg.replace('_', ' ')).filter(seg => seg.length > 0).join(' > ');
    $entry.append(`<a href="${hit.path}" class="hit-link">${link_text}</a>`);

    for (let match of hit.matches) {
        let text = hit.text;
        const trail = 100;
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
        function escapeHtml(str) {
            return str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
        }
        const escapedText = escapeHtml(text);
        const highlightRegex = new RegExp(hit.query.source, 'gi');
        let excerpt = escapedText.replace(highlightRegex, function (match) {
            return `<span class='excerpt-highlight'>${match}</span>`;
        });
        $entry.append(`<p>${excerpt}</p>`);
    }

    return $entry;
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

function getArticleList(root = './') {
    let list = [];
    return getArticleListRecursive(root, list);
}

// Run

void function () {
    var search = window.location.search;
    if (search) {
        var queryParam = search.substr(1).split('&')
            .map(param => param.split('='))
            .find(param => param[0] === 'query');
        var query = queryParam ? queryParam[1] : undefined;
        if (query) {
            query = query.trim();
            if (query.length > 0) {
                query = query.replaceAll('+', ' ');
                $('#query').val(query);
                $('#hits').html(`<p id="loading">Loading...</p>`);
                getArticleList().then(articles => searchArticles(articles, query));
            } else {
                localStorage.removeItem('query');
            }
        }
    }
}();