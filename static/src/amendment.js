import { flatParts,indexDirs } from "./contents.js";

const select = document.querySelector("#amendment");
for (let a = 1; a <= 106; a++) {
    let option = document.createElement("option");
    option.value = `${a}`;
    option.innerHTML = `${a}`;

    select.appendChild(option);
}

var articles_box = document.querySelector('#articles');

async function updatedSelectedAmendment(selected_version) {
    articles_box.textContent = '';

    function makeArticle(dir) {
        var path = `${dir}version/a${selected_version}.html`;

        var article_box = document.createElement('div');
        article_box.style.display = 'none'; // Until fully loaded

        var jump_to = document.createElement('a');
        jump_to.setAttribute('href', dir);
        jump_to.innerHTML = 'Jump to';
        article_box.appendChild(jump_to);

        var container = document.createElement('object');
        container.type = 'text/html';
        container.data = path;
        container.onload = () => {
            const toggleButton = container.contentDocument?.querySelector("#toggleButton");
            if (toggleButton) {
                toggleButton.style.display = "none";
            }
            const body = container.contentDocument?.querySelector('body');
            if (body) {
                container.height = body.clientHeight + 24;
            }
        };        
        article_box.appendChild(container);

        fetch(path).then((response) => {
            if (response.status !== 200) {
                // Don't render this article
                
            } else {
                container.data = path;
                articles_box.appendChild(article_box);
                article_box.style.display = 'block';
            }
        }).catch((error) => {
            console.error('Error checking article:', error);
        });

    }

    let flat;
    try {
        flat = await flatParts();
    } catch (buildFailed) {
        articles_box.replaceWith(buildFailed);
        return;
    }

    flat.map((part) => {
        let dir = part.dir;
        indexDirs(`Failed to index ${dir}`, (dir = dir)).then((articles) =>
            articles.map((article) => makeArticle(dir + article))
        );
    });
}

select.oninput = () => {
    updatedSelectedAmendment(document.querySelector("#amendment").value);
}