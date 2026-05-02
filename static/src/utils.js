export const toc_link_attr = 'name'; 


export function parseHTMLDoc(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return doc;
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



export async function getLangIndex() {
    return (await fetch(`${langurl}/search.json`)).json();
}