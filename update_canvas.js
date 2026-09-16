import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

// Add nickname to props
code = code.replace(/export interface GameCanvasProps \{/, "export interface GameCanvasProps { nickname: string;");

// Update join_room
code = code.replace(/socket\.emit\('join_room', roomId\);/, "socket.emit('join_room', { roomId, nickname: propsRef.current.nickname });");

// Update player drawing
// other.name might be undefined in the type, but let's assume it's passed down
code = code.replace(/drawPlayer\(other\.x, other\.y, other\.vx, other\.facingRight, 'blue', other\.id\.substring\(0, 4\)/, "drawPlayer(other.x, other.y, other.vx, other.facingRight, 'blue', other.name || other.id.substring(0, 4)");
code = code.replace(/drawPlayer\(player\.x, player\.y, player\.vx, player\.facingRight, 'red', 'YOU'/g, "drawPlayer(player.x, player.y, player.vx, player.facingRight, 'red', propsRef.current.nickname || 'YOU'");

fs.writeFileSync('src/components/GameCanvas.tsx', code);
