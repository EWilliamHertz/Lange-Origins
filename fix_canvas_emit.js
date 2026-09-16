import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const emit1Old = `           socket.emit('player_update', { name: propsRef.current.nickname,
             x: gameState.current.player.x,
             y: gameState.current.player.y,
             vx: gameState.current.player.vx,
             vy: gameState.current.player.vy,
             facingRight: gameState.current.player.facingRight,
             tool: propsRef.current.selectedBlock,
             isMining: false
           });`;
const emit1New = `           socket.emit('player_update', { name: propsRef.current.nickname, skin: propsRef.current.characterSkin, helmet: propsRef.current.helmet, chest: propsRef.current.chestplate,
             x: gameState.current.player.x,
             y: gameState.current.player.y,
             vx: gameState.current.player.vx,
             vy: gameState.current.player.vy,
             facingRight: gameState.current.player.facingRight,
             tool: propsRef.current.selectedBlock,
             isMining: false
           });`;
code = code.replace(emit1Old, emit1New);

const emit2Old = `           state.socket.emit('player_update', { name: propsRef.current.nickname, 
             x: player.x, y: player.y, vx: player.vx, vy: player.vy, facingRight: player.facingRight,
             tool: currentTool, isMining: currentIsMining
           });`;
const emit2New = `           state.socket.emit('player_update', { name: propsRef.current.nickname, skin: propsRef.current.characterSkin, helmet: propsRef.current.helmet, chest: propsRef.current.chestplate,
             x: player.x, y: player.y, vx: player.vx, vy: player.vy, facingRight: player.facingRight,
             tool: currentTool, isMining: currentIsMining
           });`;
code = code.replace(emit2Old, emit2New);

const emit3Old = `           state.socket.emit('player_update', { name: propsRef.current.nickname, 
             x: player.x, y: player.y, vx: 0, vy: 0, facingRight: player.facingRight,
             tool: propsRef.current.selectedBlock, isMining: false
           });`;
const emit3New = `           state.socket.emit('player_update', { name: propsRef.current.nickname, skin: propsRef.current.characterSkin, helmet: propsRef.current.helmet, chest: propsRef.current.chestplate,
             x: player.x, y: player.y, vx: 0, vy: 0, facingRight: player.facingRight,
             tool: propsRef.current.selectedBlock, isMining: false
           });`;
code = code.replace(emit3Old, emit3New);

fs.writeFileSync('src/components/GameCanvas.tsx', code);
