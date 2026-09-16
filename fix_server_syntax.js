import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/    \}\);\n       \}\n    \}\);\n    socket\.on\('disconnect',/g, 
`    });\n    socket.on('disconnect',`);

fs.writeFileSync('server.ts', code);
