import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/<span className="opacity-50 text-xs mr-2">\{msg\.sender\.substring\(0,4\)\}:<\/span>/g, '<span className="opacity-50 text-xs mr-2">{msg.sender}:</span>');

fs.writeFileSync('src/App.tsx', code);
