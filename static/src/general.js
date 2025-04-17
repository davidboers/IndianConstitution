let pattern = /\(([a-z]|ii)\)/;
Array.from(document.querySelectorAll('p')).map(p => {
    while (p.innerHTML.search(pattern) != -1) {
        let html = p.innerHTML;
        let index = html.search(pattern);
        let newhtml = `(<i>${html.substr(index + 1, 1)}</i>)`;
        p.innerHTML = html.replace(pattern, newhtml);
    }
});