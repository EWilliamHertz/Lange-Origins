const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regexRight = /          \{\/\* Right Action Bar Slideout \*\/\}[\s\S]*?          \}\)/;
code = code.replace(regexRight, "");

const regexRightToggle = /          \{\/\* Right Action Bar Toggle \*\/\}[\s\S]*?          <\/button>/;
code = code.replace(regexRightToggle, "");

fs.writeFileSync('src/App.tsx', code);
console.log('Right Action Bar toggle cleaned.');
