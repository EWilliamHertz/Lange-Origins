import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const oldMiningLogic = `               if (currentBlock === BlockType.Grass && Math.random() < 0.2) {
                   state.socket.emit('spawn_item', { type: BlockType.CarrotSeed, x: targetTx * TILE_SIZE, y: targetTy * TILE_SIZE });
               } else if (currentBlock === BlockType.CarrotCrop3) {
                   state.socket.emit('spawn_item', { type: BlockType.Carrot, x: targetTx * TILE_SIZE, y: targetTy * TILE_SIZE });
                   if (Math.random() > 0.5) state.socket.emit('spawn_item', { type: BlockType.Carrot, x: targetTx * TILE_SIZE, y: targetTy * TILE_SIZE });
               } else if (currentBlock === BlockType.Leaves && Math.random() < 0.1) {
                   state.socket.emit('spawn_item', { type: BlockType.Apple, x: targetTx * TILE_SIZE, y: targetTy * TILE_SIZE });
               } else if (currentBlock === BlockType.Chest) {
                   state.socket.emit('spawn_item', { type: BlockType.Chest, x: targetTx * TILE_SIZE, y: targetTy * TILE_SIZE });
                   // Note: To keep things simple in this prototype, items inside the chest are lost when broken
               }
            }
            if (propsRef.current.onBlockMined) {
              propsRef.current.onBlockMined(currentBlock);
            }`;

const newMiningLogic = `               // Always spawn the broken block itself!
               let dropType = currentBlock;
               if (currentBlock === BlockType.Grass) dropType = BlockType.Dirt;
               if (currentBlock === BlockType.StoneOre) dropType = BlockType.Stone;

               // If it's a crop or leaves, handle custom drops instead of the block itself
               if (currentBlock === BlockType.CarrotCrop3) {
                   state.socket.emit('spawn_item', { type: BlockType.Carrot, x: targetTx * TILE_SIZE, y: targetTy * TILE_SIZE });
                   if (Math.random() > 0.5) state.socket.emit('spawn_item', { type: BlockType.Carrot, x: targetTx * TILE_SIZE, y: targetTy * TILE_SIZE });
               } else if (currentBlock === BlockType.CarrotCrop1 || currentBlock === BlockType.CarrotCrop2) {
                   // No drop
               } else if (currentBlock === BlockType.Leaves) {
                   if (Math.random() < 0.1) state.socket.emit('spawn_item', { type: BlockType.Apple, x: targetTx * TILE_SIZE, y: targetTy * TILE_SIZE });
               } else {
                   // Spawn the block item
                   state.socket.emit('spawn_item', { type: dropType, x: targetTx * TILE_SIZE, y: targetTy * TILE_SIZE });
               }

               // Additional bonus drops
               if (currentBlock === BlockType.Grass && Math.random() < 0.2) {
                   state.socket.emit('spawn_item', { type: BlockType.CarrotSeed, x: targetTx * TILE_SIZE, y: targetTy * TILE_SIZE });
               }
            }
            // Do NOT call onBlockMined directly here. 
            // It will be called when the player physically collects the spawned item via the 'item_collected' socket event.`;

code = code.replace(oldMiningLogic, newMiningLogic);

fs.writeFileSync('src/components/GameCanvas.tsx', code);
