import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

// We need to add an onPlayerInteract to the Canvas which we can trigger when right clicking a player
const oldClick = `        const dist = Math.sqrt((player.x - targetTx * TILE_SIZE) ** 2 + (player.y - targetTy * TILE_SIZE) ** 2);
        const MAX_REACH = TILE_SIZE * 6; // 6 blocks reach

        if (!propsRef.current.isInventoryOpen && state.rightMouseDown && inBounds && state.interactionCooldown <= 0) {
          if (dist <= MAX_REACH) {`;

const newClick = `        const dist = Math.sqrt((player.x - targetTx * TILE_SIZE) ** 2 + (player.y - targetTy * TILE_SIZE) ** 2);
        const MAX_REACH = TILE_SIZE * 6; // 6 blocks reach

        if (!propsRef.current.isInventoryOpen && state.rightMouseDown && inBounds && state.interactionCooldown <= 0) {
          let clickedPlayerId = null;
          let clickedPlayerName = null;
          const mx = state.cameraX + state.mouseX;
          const my = state.cameraY + state.mouseY;
          for (const opId in state.otherPlayers) {
              const op = state.otherPlayers[opId];
              if (mx >= op.x && mx <= op.x + op.width && my >= op.y && my <= op.y + op.height) {
                  clickedPlayerId = op.id;
                  clickedPlayerName = op.nickname;
                  break;
              }
          }
          if (clickedPlayerId && propsRef.current.onPlayerInteract) {
              propsRef.current.onPlayerInteract(clickedPlayerId, clickedPlayerName);
              state.interactionCooldown = 300;
              return;
          }

          if (dist <= MAX_REACH) {`;

code = code.replace(oldClick, newClick);
fs.writeFileSync('src/components/GameCanvas.tsx', code);
