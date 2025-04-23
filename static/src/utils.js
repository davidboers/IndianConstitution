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