import { flat_parts, partDir, indexDirs } from "/static/src/contents.js";

const select = document.getElementById("amendment");
for (let a = 1; a <= 106; a++) {
    let option = document.createElement("option");
    option.value = `${a}`;

    if (`${a}`.endsWith("1")) {
        option.innerHTML = `${a}st`;
    } else if (`${a}`.endsWith("2")) {
        option.innerHTML = `${a}nd`;
    } else if (`${a}`.endsWith("3")) {
        option.innerHTML = `${a}rd`;
    } else {
        option.innerHTML = `${a}th`;
    }

    select.appendChild(option);
}

var articles_box = document.getElementById("articles");

function updatedSelectedAmendment(selected_version) {
    articles_box.textContent = '';

    function makeArticle(dir) {
        var path = `${dir}version/a${selected_version}.html`;
        var container = document.createElement("object");
        container.type = "text/html";
        container.data = path;
        container.onload = () => {
            container.contentDocument.querySelector(
                "#toggleButton"
            ).style.display = "none";
            container.height =
                container.contentDocument.querySelector("body").clientHeight + 24;
        };
        articles_box.appendChild(container);
        fetch(path).then((response) => {
            if (response.status !== 200) {
                articles_box.removeChild(container);
            }
        });
    }

    function makePart(articles) {
        articles.map(makeArticle);
    }

    flat_parts.map((part) => {
        let dir = partDir(part);
        indexDirs(`Failed to index ${dir}`, (dir = dir)).then((articles) =>
            articles.map((article) => makeArticle(dir + article))
        );
    });
}

select.oninput = () => {
    updatedSelectedAmendment(document.getElementById("amendment").value);
}