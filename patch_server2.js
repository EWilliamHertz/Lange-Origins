import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/io\.to\(roomId\)\.emit\('world_reset'/g, "io.to(roomId).emit('world_wiped'");

fs.writeFileSync('server.ts', code);
