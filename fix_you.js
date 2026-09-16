import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

code = code.replace(/drawPlayer\(player\.x, player\.y, player\.vx, player\.facingRight, 'orange', 'You'/g, "drawPlayer(player.x, player.y, player.vx, player.facingRight, 'orange', propsRef.current.nickname || 'You'");

fs.writeFileSync('src/components/GameCanvas.tsx', code);
