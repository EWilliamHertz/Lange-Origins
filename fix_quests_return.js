import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex1 = /if\s*\(isLocked\)\s*\{\s*<div key=\{q\.id\}/m;
const repl1 = `if (isLocked) {\n                     return (\n                       <div key={q.id}`;
code = code.replace(regex1, repl1);

const regex2 = /\}\s*<div key=\{q\.id\}\s*className=\{\`p-5 rounded-2xl/m;
const repl2 = `}\n                   return (\n                   <div key={q.id} className={\`p-5 rounded-2xl`;
code = code.replace(regex2, repl2);

fs.writeFileSync('src/App.tsx', code);
