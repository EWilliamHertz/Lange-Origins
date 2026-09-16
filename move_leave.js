import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

// Remove onLeave from GameProps and button
code = code.replace(/  onLeave\?: \(\) => void;\n/, '');
code = code.replace(/      \{props\.onLeave && \([\s\S]*?<\/button>\n      \)\}/, '');
code = code.replace(/      \{onLeave && \([\s\S]*?<\/button>\n      \)\}/, '');

fs.writeFileSync('src/components/GameCanvas.tsx', code);
