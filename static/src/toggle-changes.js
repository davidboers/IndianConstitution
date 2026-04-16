window.onload = () => {

    // Convert <span class="ins/del"></span> to <ins></ins> or <del></del>

    const convertible = document.querySelectorAll('.ins, .del');
    for (let node of convertible) {
        const cls = node.classList.contains('ins') ? 'ins' : 'del';
        const html = node.innerHTML;
        const new_node = document.createElement(cls);
        new_node.innerHTML = html;

        // Copy other attributes
        for (const attr of node.attributes) {
            if (attr.name !== 'class') {
                new_node.setAttribute(attr.name, attr.value);
            }
        }

        node.replaceWith(new_node);
    }

    // .changes to be added to class list by default

    showChanges();

    // Set up toggle button

    const toggleButton = document.getElementById('toggleButton');

    if (!toggleButton) return;
    toggleButton.textContent = 'Hide Changes';

    toggleButton.addEventListener('click', () => {
        if (toggleButton.textContent === 'Show Changes') {
            showChanges();
            toggleButton.textContent = 'Hide Changes';
        } else {
            hideChanges();
            toggleButton.textContent = 'Show Changes';
        }
    });

    function showChanges() {
        const text_node = Array.from(document.querySelectorAll('ins'))
            .concat(Array.from(document.querySelectorAll('del')))
            .concat(Array.from(document.querySelectorAll('.overruled')))
            .concat(Array.from(document.querySelectorAll('li.renum')));

        text_node.forEach(span => {
            if (!span.classList.contains('changes')) {
                span.classList.add('changes');
            }
        });
    }

    function hideChanges() {
        const changed = document.querySelectorAll('.changes');
        for (let i = 0; i < changed.length; i++) {
            let c = changed[i];
            c.classList.remove('changes');
        }
    }
}

