import { flatParts, indexDirs } from "./contents.js";

const $select = $("#amendment");
for (let a = 1; a <= 106; a++) {
    let $option = $(`<option value="${a}">${a}</option>`);
    $option.appendTo($select);
}

var $articles_box = $('#articles');

async function updatedSelectedAmendment(selected_version) {
    $articles_box.empty();

    function makeArticle(dir) {
        var path = `${dir}version/a${selected_version}.html`;

        var $article_box = $('<div class="art-holder"></div>');

        var $jump_to = $('<a>Jump to</a>');
        $jump_to.attr('href', dir);
        $jump_to.appendTo($article_box);

        var $container = $('<div></div>');
        $container.load(path, (_, status, xhr) => {
            if (status === 'error' && xhr.status === 404) {
                return;
            }

            const $toggleButton = $container.find("#toggleButton");
            if ($toggleButton.length) {
                $toggleButton.css('display', 'none');
            }
            $container.find('script').attr('type', 'module');
            $container.appendTo($article_box);
            $article_box.appendTo($articles_box);
        });

    }

    let flat;
    try {
        flat = await flatParts();
    } catch (buildFailed) {
        $articles_box.replaceWith(buildFailed);
        return;
    }

    flat.map((part) => {
        let dir = part.dir;
        indexDirs(`Failed to index ${dir}`, (dir = dir)).then((articles) =>
            articles.map((article) => makeArticle(dir + article))
        );
    });
}

$select.on('input', () => {
    updatedSelectedAmendment($("#amendment").val());
});