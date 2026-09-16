const fs = require('fs');
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const tooltipCode = `
      // --- INTERACTION TOOLTIPS ---
      const px = Math.floor(player.x / TILE_SIZE);
      const py = Math.floor(player.y / TILE_SIZE);
      let closestInteractable = null;
      let closestDist = 999;
      
      for (let tx = Math.max(0, px - 3); tx <= Math.min(WORLD_WIDTH - 1, px + 3); tx++) {
         for (let ty = Math.max(0, py - 3); ty <= Math.min(WORLD_HEIGHT - 1, py + 3); ty++) {
            const b = world[tx][ty];
            if (b === BlockType.Chest || b === BlockType.Merchant || b === BlockType.Furnace || b === BlockType.QuestNPC) {
               const dist = Math.sqrt(Math.pow(player.x - tx * TILE_SIZE, 2) + Math.pow(player.y - ty * TILE_SIZE, 2));
               if (dist < closestDist && dist < TILE_SIZE * 4) {
                   closestDist = dist;
                   closestInteractable = { tx, ty, type: b };
               }
            }
         }
      }
      
      if (closestInteractable && !propsRef.current.isInventoryOpen) {
         ctx.font = 'bold 12px sans-serif';
         ctx.textAlign = 'center';
         let msg = "Right Click to Interact";
         if (closestInteractable.type === BlockType.Chest) msg = "Right Click to Open Chest";
         else if (closestInteractable.type === BlockType.Merchant) msg = "Right Click to Trade";
         else if (closestInteractable.type === BlockType.QuestNPC) msg = "Right Click to Talk";
         else if (closestInteractable.type === BlockType.Furnace) msg = "Right Click to Smelt";
         
         const tx = closestInteractable.tx * TILE_SIZE + TILE_SIZE/2;
         const ty = closestInteractable.ty * TILE_SIZE - 10;
         
         ctx.fillStyle = 'rgba(0,0,0,0.7)';
         const textWidth = ctx.measureText(msg).width;
         ctx.fillRect(tx - textWidth/2 - 4, ty - 12, textWidth + 8, 16);
         ctx.fillStyle = '#FFF';
         ctx.fillText(msg, tx, ty);
      }
      // --- END TOOLTIPS ---
`;

code = code.replace(
  "      // Draw damage texts",
  tooltipCode + "\n      // Draw damage texts"
);

fs.writeFileSync('src/components/GameCanvas.tsx', code);
console.log('Tooltips patched.');
