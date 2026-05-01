
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
