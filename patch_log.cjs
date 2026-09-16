const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace("socket.on('open_chest', async (data: { tx: number, ty: number }) => {", "socket.on('open_chest', async (data: { tx: number, ty: number }) => {\nconsole.log('open_chest received', data);");
fs.writeFileSync('server.ts', code);
