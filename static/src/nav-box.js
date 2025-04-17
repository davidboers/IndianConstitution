const parser = new DOMParser();
const current_lang = document.querySelector('html').lang;

document.querySelector('#nav').innerHTML += `
    <object id="contents-hidden" type="text/html" data="../contents.html" hidden></object>
    <div style="padding: 5px; text-align: center;">
        <a id="prev-art">Previous article</a> * <a href="/en/contents.html">Table of Contents</a> * <a id="next-art">Next article</a>
        <form action="/en/search.html" id="search-form"></form>
    </div>
    <ul id="parent-nav"></ul>
    <p class="nav-sec" id="see-also">See also</p>
    <ul></ul>
    <p class="nav-sec" id="cross-reference">Cross reference</p>
    <ul></ul>
    <div id="lang-nav"></div>`;

// Search form

const form = document.querySelector('form#search-form');

const input = document.createElement('input');
input.type = 'text';
input.id = 'query';
input.name = 'query';
form.appendChild(input);

const button = document.createElement('button');
button.innerHTML = 'Search';
form.appendChild(button);

// Parent nav

function getParentText(contents) {
    let part_num = contents.querySelector('#part-num');
    let part_header = contents.querySelector('#part-header');
    
    if (part_header === null) {
        console.error('Could not find expected element of contents page.');
        console.log(contents);
        return 'Unknown';
    }
    return (part_num === null)
        ? part_header.innerText
        : part_num.innerText + '.—' + part_header.innerText;
}

function makeLinkListElem(link, text) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = link;
    a.innerHTML = text;
    li.appendChild(a);
    return li;
}

let parent_toc = document.querySelector('#contents-hidden');
void async function () {
    const parent_nav = document.getElementById('parent-nav');
    if (parent_nav != undefined) {
        let part_contents = await fetch('../../contents.html');
        if (part_contents.status === 200) {
            let html = await(part_contents).text();
            let parent_text = getParentText(parser.parseFromString(html, 'text/html'));
            let link_elem = makeLinkListElem('../../contents.html', parent_text);
            parent_nav.appendChild(link_elem);
        }

        let parent_text = getParentText(parser.parseFromString(parent_toc.innerHTML, 'text/html'));
        let link_elem = makeLinkListElem('../contents.html', parent_text);
        parent_nav.appendChild(link_elem);
    }
} ();

// Previous/next articles

parent_toc.onload = () => {
    let tr_entry = Array.from(parent_toc.querySelectorAll('tr')).find(tr => tr.title == window.location.href);
    console.log(parent_toc);
    let prev_sibling = tr_entry.previousElementSibling;
    let next_sibling = tr_entry.nextElementSibling;
    while (prev_sibling !== null && prev_sibling.firstChild.className === 'subheading') {
        prev_sibling = prev_sibling.previousElementSibling
    }
    if (prev_sibling !== null) {
        let adjacent_article = prev_sibling.title;
        document.querySelector('a#prev-art').href = adjacent_article;
    }
    while (next_sibling !== null && next_sibling.firstChild.className === 'subheading') {
        next_sibling = next_sibling.nextElementSibling
    }
};

// See also & cross reference

function handleLinkGroups(json, header) {
    const path_wo_lang = window.location.pathname.toString().replace(`/${current_lang}/`, '');
    var in_groups = json.filter(group => group.map(e => e.path).includes(path_wo_lang));
    var links = [...new Set(in_groups.flat(1))]
        .filter(link => link.path !== path_wo_lang);
    if (links.length === 0) {
        [header, header.nextElementSibling].forEach(p => p.style.display = 'none');
        return;
    }
    const list = header.nextElementSibling;
    links.forEach(link => {
        const li = makeLinkListElem(`/${current_lang}/${link.path}`, link.name);
        list.appendChild(li);
    });
}

void async function () {
    var see_also = await (await fetch('/static/data/see-also.json')).json();
    var header = document.querySelector('.nav-sec#see-also');
    handleLinkGroups(see_also, header);
} ();

void async function () {
    var see_also = await (await fetch('/static/data/cross-reference.json')).json();
    var header = document.querySelector('.nav-sec#cross-reference');
    handleLinkGroups(see_also, header);
} ();

// Switch language

void async function () {
    var lang_nav = document.querySelector('div#lang-nav');
    lang_nav.innerHTML = await ( await fetch( '/static/templates/lang-nav.html' ) ).text();
    Array.from(document.querySelectorAll('a.lang')).map(a => {
        a.href = window.location.href.replace('/en/', `/${a.id}/`);
    });
} ();