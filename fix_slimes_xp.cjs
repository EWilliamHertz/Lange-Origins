const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldXp = `const xpGain = type === 'golem_boss' ? 250 : 25;`;
const newXp = `const xpGain = type === 'golem_boss' ? 250 : type === 'slime' ? 10 : 25;`;
code = code.replace(oldXp, newXp);

const oldText1 = `<div className="text-[9px] text-white/50 text-center uppercase tracking-tighter w-12 pb-1 border-b border-white/10 mb-1 leading-tight">Ctrl+T<br/>Bind</div>`;
const oldText2 = `<div className="text-[9px] text-white/50 text-center uppercase tracking-tighter w-12 pb-1 border-b border-white/10 mb-1 leading-tight">Ctrl+Y<br/>Bind</div>`;

code = code.replace(oldText1, "");
code = code.replace(oldText2, "");

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed slimes xp and removed text');
