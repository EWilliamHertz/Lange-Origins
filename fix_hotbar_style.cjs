const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStyle = `                  isSelected 
                    ? 'ring-2 ring-white scale-110 bg-white/20 z-10' 
                    : 'hover:bg-white/10 opacity-70 hover:opacity-100 bg-black/50'`;

const replacementStyle = `                  isSelected 
                    ? 'ring-2 ring-amber-400 scale-110 bg-gradient-to-t from-white/20 to-transparent shadow-[0_0_15px_rgba(251,191,36,0.5)] z-10' 
                    : 'hover:bg-white/10 opacity-70 hover:opacity-100 bg-black/50'`;

code = code.replace(targetStyle, replacementStyle);
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed hotbar style');
