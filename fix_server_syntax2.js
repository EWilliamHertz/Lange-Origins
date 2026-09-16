import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/           \}\n       \}\n    \}\);\n       \}\n    \}\);\n    socket\.on\('disconnect',/g, 
`           }
       }
    });
    socket.on('disconnect',`);

fs.writeFileSync('server.ts', code);
