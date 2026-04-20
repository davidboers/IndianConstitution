import { composeQueryDir, getTree, lang, normalizeDirName, toc_link_attr } from "./utils.js";


const $nav = $('#nav');

const $influences = $nav.find('#influence');
const influence_set = $influences.length > 0;
if (influence_set) {
    $influences.detach();
}

$nav.html(`
    <div id="contents-hidden" hidden></div>
    <div style="padding: 5px; text-align: center;">
        <p><a id="prev-art">Previous article</a> * <a href="/${lang}/contents.html">Table of Contents</a> * <a id="next-art">Next article</a></p>
        <form action="/${lang}/search.html" id="search-form">
            <input type="text" id="query" name="query"></input>
            <button>Search</button>
        </form>
    </div>
    <ul id="parent-nav"></ul>
    <p class="nav-sec" id="see-also">See also</p>
    <ul></ul>
    <p class="nav-sec" id="cross-reference">Cross reference</p>
    <ul></ul>
    <p class="nav-sec" id="lang-select">Select language</p>
    <div id="lang-nav"></div>`);

if (influence_set) {
    $('#lang-nav').after($influences);
}

// Parent nav

function makeLinkListElem(link, text) {
    return $(`<li><a href="${link}">${text}</a></li>`);
}

void async function () {
    const $parent_nav = $('#parent-nav');
    if ($parent_nav.length === 0) return;

    function addLink(dir, header) {
        let $link_elem = makeLinkListElem(`${dir}contents.html`, header);
        $parent_nav.append($link_elem);
    }

    const tree = await (await getTree()).json();

    const part = tree.find((part) => location.href.includes(part.path_part));
    if (!part) return; // Means tree.json not updated yet

    const part_dir = composeQueryDir(part.path_part);
    let part_label = normalizeDirName(part.path_part);
    if (part.header) {
        part_label = part_label.concat(`.—${part.header}`);
    }
    addLink(part_dir, part_label);

    if (part.has_chapters) {
        const chapter = part.chapters.find((chapter) => location.href.includes(chapter.path_part));
        if (!chapter) return; // Ditto

        const chapter_dir = composeQueryDir(chapter.path_part, part_dir);
        const chapter_header = chapter.header;
        addLink(chapter_dir, chapter_header);

    }

}();

// Previous/next articles

void function () {
    $('#contents-hidden').load('../contents.html', function () {
        $(this).one('tableBuilt', function() { console.error('Wrong place for the event.'); });
        $(document).one('tableBuilt', function () {
            let $tr_entry = $(this).find(`tr[${toc_link_attr}='${window.location.pathname.toString()}']`);
            let $prev_sibling = $tr_entry.prev();
            let $next_sibling = $tr_entry.next();
            while ($prev_sibling.length && $prev_sibling.children().first().hasClass('subheading')) {
                $prev_sibling = $prev_sibling.prev();
            }
            if ($prev_sibling.length) {
                let adjacent_article = $prev_sibling.attr(toc_link_attr);
                $('a#prev-art').attr('href', adjacent_article);
            }
            while ($next_sibling.length && $next_sibling.children().first().hasClass('subheading')) {
                $next_sibling = $next_sibling.next();
            }
            if ($next_sibling.length) {
                let adjacent_article = $next_sibling.attr(toc_link_attr);
                $('a#next-art').attr('href', adjacent_article);
            }
        })
    });

}();

// See also & cross reference

function handleLinkGroups(json, $header, exclude = []) {
    const path_wo_lang = window.location.pathname.toString().replace(`/${lang}/`, '');
    var in_groups = json.filter(group => group.map(e => e.path).includes(path_wo_lang));
    var links = [...new Set(in_groups.flat(1))]
        .filter(link => link.path !== path_wo_lang &&
            !exclude.map(l2 => l2.path).includes(link.path));
    if (links.length === 0) {
        [$header, $header.next()].forEach($p => $p.css('display', 'none'));
        return [];
    }
    const $list = $header.next();
    links.forEach(link => {
        const path_use = (link.path.startsWith('https')) ? link.path : `/${lang}/${link.path}`;
        const $li = makeLinkListElem(path_use, link.name);
        $list.append($li);
    });
    return links;
}

void async function () {
    var see_also = await (await fetch('/static/data/see-also.json')).json();
    var $header = $('.nav-sec#see-also');
    var exclude = handleLinkGroups(see_also, $header);

    var cross_reference = await (await fetch('/static/data/cross-reference.json')).json();
    $header = $('.nav-sec#cross-reference');
    handleLinkGroups(cross_reference, $header, exclude);
}();

// Switch language

void function () {
    $('div#lang-nav').load('/static/templates/lang-nav.html', function () {
        $(this).find('a.lang').each((_, $a) => $($a).attr('href', window.location.href.replace(`/${lang}/`, `/${$($a).attr('id')}/`)));
    });
}();