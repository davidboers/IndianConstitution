const text = Array.from(document.querySelectorAll('span.ins'))
     .concat(Array.from(document.querySelectorAll('span.del')));
text.forEach(span => span.classList.add('changes'));