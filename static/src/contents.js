
import { parseHTMLDoc, getIndexedLinks, composeQueryDir, normalizeDirName, getTree, toc_link_attr } from './utils.js';

async function getTreeWithError() {

    try {
        const response = await getTree();
        if (!response.ok) throw new Error(response.statusText);

        return await response.json();

    } catch (error) {
        console.error('Caught error:', error.message);
        const buildFailed = $(`<p>Error: Failed to load table of contents.</p>`);
        throw buildFailed;
    }
}

export async function buildTableStructure(dir = undefined) {
    const $table = $('#main-con');

    try {
        const tree = await getTreeWithError();
        buildTableStructure1(dir, tree, $table);
    } catch (buildFailed) {

        if (buildFailed instanceof $ || buildFailed.jquery) {
            $table.replaceWith(buildFailed);
        } else {
            console.error('Unexpected error in buildTableStructure:', buildFailed);
            throw buildFailed;
        }
    }
}

function buildTableStructure1(dir, tree, $table) {

    let promises = [];

    if (!dir) { // Main TOC

        const preamble = tree.find((part) => part.preamble);

        $table.append($('<tr><td></td><td id="preamble-link"></td></tr>'));
        addLinkToEntry($('#preamble-link'), preamble.header, preamble.path_part);
    }

    for (let part of tree) {
        if ((dir && !dir.includes(part.path_part)) || part.preamble) {
            continue;
        }

        const $tbody_p = $(`
            <tbody class="contents" id="${partID(part.path_part)}">
                <tr>
                    <th class="part-num" colspan="2">${normalizeDirName(part.path_part)}</th>
                </tr>
            </tbody>`);

        if (part.header) {
            $tbody_p.append($(`<tr><th class="part-header" colspan="2">${part.header}</th></tr>`));
        }

        if (part.note) {
            $tbody_p.append($(`<tr><td colspan="2"><i>Note: </i>${part.note}</td></tr>`));
        }

        $table.append($tbody_p);

        let p_dir = composeQueryDir(part.path_part);

        if (part.has_chapters) {

            for (let chapter of part.chapters) {
                if (dir && dir !== part.path_part && !dir.includes(chapter.path_part)) {
                    continue;
                }

                const $tbody_c = $(`
                    <tbody class="contents" id="${partID(chapter.path_part)}">
                        <tr>
                            <th class="part-header" colspan="2">${chapter.header}</th>
                        </tr>
                    </tbody>`);

                $table.append($tbody_c);

                let c_dir = composeQueryDir(chapter.path_part, p_dir);
                promises.push(articles($tbody_c, undefined, c_dir).then(() => {
                    if (chapter.subheadings) {
                        makeSubheadings(chapter.subheadings);
                    }
                }));

            }

        } else {

            promises.push(articles($tbody_p, undefined, p_dir).then(() => {
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
    const split_path = article.split('/');
    const dir = split_path[split_path.length - 2];
    const id = (isNaN(dir) && isNaN(dir.substr(0, dir.length - 1))) ? dir : 'a' + dir;
    const num = (dir + '.').replace('_', ' ');

    const $entry = $(`
        <tr id="${id}" ${toc_link_attr}="${article}">
            <td style="width: 5em;">${num}</td>
        </tr>`);

    $('<div></div>').load(article, function () {
        const $doc = $(this);
        const latest_version_path = article.toString().concat($(this).find('.art-holder').attr('name'));
        $('<div></div>').load(latest_version_path, function () {
            const $margin_elem = $(this).find('.art');

            if ($margin_elem.clone().children().remove().end().html().trim().length === 0) {
                // This is for articles that have been totally omitted.
                $margin_elem.html($margin_elem.text());

            } else {
                $margin_elem.find('del, .del').remove();
            }

            let margin_text = $margin_elem.html();
            margin_text = margin_text.replace(/—$/, '').replace(`${num} `, '');

            const $margin = $('<td></td>');
            addLinkToEntry($margin, margin_text, article);

            if ($doc.find('#omitted-indicator').length > 0) {
                $margin.append(' <i>(Omitted)</i>');
            }

            $entry.append($margin);
        });
    });

    return $entry;
}

async function articles($contents, exclude = [], dir = './') {
    return indexDirs('Error fetching articles:', dir = dir)
        .then(articles =>
            articles
                .filter(a => !exclude.includes(normalizeDirName(a)))
                .sort((a, b) => parseInt(normalizeDirName(a)) - parseInt(normalizeDirName(b)))
                .map(a => dir + a)
                .map(makeArticle)
                .map($a => $contents.append($a))
        );
}

function addLinkToEntry($margin, margin_text, link) {
    $margin.append($(`<a href="${link}">${margin_text}</a>`));
}

// Subheadings

function makeSubheadings(subheadings) {
    for (let article in subheadings) {
        let subheading = subheadings[article];
        const $article_row = $(`#${article}`);
        if ($article_row.length === 0) {
            continue;
        }

        $(` <tr>
                <th class="subheading" colspan="2">${subheading}</th>
            </tr>`).insertBefore($article_row);
    }
}

// Table builder

function partID(part) {
    return part
        .replaceAll(', ', '_')
        .replaceAll(' ', '_')
        .toLowerCase();
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
