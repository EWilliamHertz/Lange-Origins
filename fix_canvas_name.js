import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

code = code.replace(/socket\.emit\('player_update', \{/g, "socket.emit('player_update', { name: propsRef.current.nickname,");

fs.writeFileSync('src/components/GameCanvas.tsx', code);
