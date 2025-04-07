window.onload = () => {
    const toggleButton = document.getElementById('toggleButton');
    
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
        const classes = ['del', 'ins', 'overruled'];
        for (let cls of classes) {
            const elems = document.getElementsByClassName(cls);
            for (let i = 0; i < elems.length; i++) {
                elems[i].classList.add('changes');
            }
        }
    }
    
    function hideChanges() {
        const changed = document.querySelectorAll('.changes');
        for (let i = 0; i < changed.length; i++) {
            let c = changed[i];
            c.classList.remove('changes');
        }
    }
}

