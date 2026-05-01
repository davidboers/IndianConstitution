
import { parseHTMLDoc, getLangIndex, langurl } from './utils.js';

function searchArticleVersion(html, query, articlePath) {
    const doc = parseHTMLDoc(html);
    const body = doc.querySelector('body');
    body.querySelectorAll('.word-count').forEach(word_count => word_count.remove());
    const text = body.innerText.replace(/\s{2,}/g, ' ');
    let matches = [];
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'gi');
    let match;

    while ((match = regex.exec(text)) !== null) {
        matches.push(match.index);

    }

    return { matches: matches, text: text, path: articlePath, query: regex };
}

function searchArticle(article, query) {
    for (let version of article) {
        const hits = searchArticleVersion(version.content, query, version.article);

        if (hits.matches.length > 0) return hits;

    }

    return null;
}

function searchArticles(index, query) {
    // Fold index by article
    let articles = index.reduce((acc, entry) => {
        const key = entry.article;
        (acc[key] ||= []).push(entry);
        return acc;

    }, {});

    const hits = Object.values(articles)
        .map(article => searchArticle(article, query))
        .filter(hits => hits !== null);

    const $results = $('#hits');
    $results.find('#loading').hide();
    const $no_results = $results.find('#no-results');
    const $article_list = $results.find('#article-list');
    $article_list.empty();

    if (hits.length === 0) {
        $no_results.show();

    } else {
        $no_results.hide();
        hits.map(hit => makeHitEntry(hit, query))
            .forEach(hit => $article_list.append(hit));

    }
}

function makeHitEntry(hit, query) {
    const $entry = $('<div class="hit"></div>');

    const link_text = hit.path.replace(langurl, '').split('/').map(seg => seg.replace('_', ' ')).filter(seg => seg.length > 0).join(' > ');
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
                try {
                    query = decodeURIComponent(query).replaceAll('+', ' ');
                } catch (e) {
                    query = query.replaceAll('+', ' ');
                }
                $('#query').val(query);
                $('#no-results').hide();
                $('#loading').show();
                getLangIndex().then(index => searchArticles(index, query));
            } else {
                localStorage.removeItem('query');
            }
        }
    }
}();