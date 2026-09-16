import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

code = code.replace(/interface GameProps \{/, "interface GameProps {\n  nickname: string;");
code = code.replace(/drawPlayer\(other\.x, other\.y, other\.vx, other\.facingRight, 'blue', other\.name \|\| other\.id\.substring\(0, 4\), other\.tool, other\.isMining\)/, "drawPlayer(other.x, other.y, other.vx, other.facingRight, 'blue', (other as any).name || other.id.substring(0, 4), other.tool, other.isMining)");
code = code.replace(/drawPlayer\(player\.x, player\.y, player\.vx, player\.facingRight, 'red', propsRef\.current\.nickname \|\| 'YOU', propsRef\.current\.selectedBlock, state\.miningProgress > 0\)/, "drawPlayer(player.x, player.y, player.vx, player.facingRight, 'red', propsRef.current.nickname || 'YOU', propsRef.current.selectedBlock, state.miningProgress > 0)");

fs.writeFileSync('src/components/GameCanvas.tsx', code);
