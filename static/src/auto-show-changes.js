const text = Array.from(document.querySelectorAll('span.ins'))
     .concat(Array.from(document.querySelectorAll('span.del')))
     .concat(Array.from(document.querySelectorAll('li.renum')));
text.forEach(span => span.classList.add('changes'));