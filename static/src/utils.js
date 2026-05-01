export const toc_link_attr = 'name'; 


export function parseHTMLDoc(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return doc;
}



export function getIndexedLinks(html) {
    const doc = parseHTMLDoc(html);
    const links = Array.from(doc.querySelectorAll('a'))
        .filter(link => link.innerText != '../' && !link.innerText.includes('http-server'))
        .map(link => link.innerText);
    return links;
}


export const lang = getLanguage();

function getLanguage(enDefault = true) {
    const $html = $('html');

    if ($html.is('[lang]')) {
        return $html.attr('lang');
    }

    if (enDefault) {
        return 'en';
    }
}



export const baseurl = '/IndianConstitution';
export const langurl = `${baseurl}/${lang}`;



const tree_path = `${langurl}/tree.json`;

export async function getTree() {
    return fetch(tree_path);
}


export function normalizeDirName(path) {
    const parts = path.split('/');
    const parentDir = parts[parts.length - 2];
    return parentDir.replace(/_/g, ' ');
}

export function composeQueryDir(path, dir = undefined) {
    const stripSideSlashes = (t) => t.split('/').filter((prt) => prt.length > 0).join('/');

    path = stripSideSlashes(path);
    if (dir) {
        dir = stripSideSlashes(dir);

        const dup_lang = langurl.substring(1);
        if (dir.startsWith(dup_lang)) {
            dir = dir.substring(dup_lang.length)
        }
    }

    let query_dir = langurl;
    if (dir && path !== dir) query_dir = `${query_dir}/${dir}`;
    query_dir = `${query_dir}/${path}/`;
    return query_dir;
}



export async function getLangIndex() {
    return (await fetch(`${langurl}/search.json`)).json();
}