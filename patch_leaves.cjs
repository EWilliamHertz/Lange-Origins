const fs = require('fs');
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

code = code.replace(
  "if (Math.random() < 0.1) state.socket.emit('spawn_item', { type: BlockType.Apple, x: targetTx * TILE_SIZE, y: targetTy * TILE_SIZE });",
  "if (Math.random() < 0.1) state.socket.emit('spawn_item', { type: BlockType.Apple, x: targetTx * TILE_SIZE, y: targetTy * TILE_SIZE });\n                   if (Math.random() < 0.2) state.socket.emit('spawn_item', { type: BlockType.TreeSeed, x: targetTx * TILE_SIZE, y: targetTy * TILE_SIZE });"
);

// We also need to be able to place the seed, and it should turn into a tree or place a sapling
// Add interaction logic for TreeSeed
// "else if (selected === BlockType.TreeSeed && (currentBlock === BlockType.Grass || currentBlock === BlockType.Dirt) && world[targetTx][targetTy - 1] === BlockType.Air) {"
code = code.replace(
  "else if (selected === BlockType.CarrotSeed && currentBlock === BlockType.Farmland",
  "else if (selected === BlockType.TreeSeed && (currentBlock === BlockType.Grass || currentBlock === BlockType.Dirt) && world[targetTx][targetTy - 1] === BlockType.Air) {\n             world[targetTx][targetTy - 1] = BlockType.Wood;\n             world[targetTx][targetTy - 2] = BlockType.Wood;\n             world[targetTx][targetTy - 3] = BlockType.Wood;\n             world[targetTx - 1][targetTy - 4] = BlockType.Leaves;\n             world[targetTx][targetTy - 4] = BlockType.Leaves;\n             world[targetTx + 1][targetTy - 4] = BlockType.Leaves;\n             world[targetTx][targetTy - 5] = BlockType.Leaves;\n             if (state.socket) {\n                 state.socket.emit('block_update', { tx: targetTx, ty: targetTy - 1, blockType: BlockType.Wood });\n                 state.socket.emit('block_update', { tx: targetTx, ty: targetTy - 2, blockType: BlockType.Wood });\n                 state.socket.emit('block_update', { tx: targetTx, ty: targetTy - 3, blockType: BlockType.Wood });\n                 state.socket.emit('block_update', { tx: targetTx - 1, ty: targetTy - 4, blockType: BlockType.Leaves });\n                 state.socket.emit('block_update', { tx: targetTx, ty: targetTy - 4, blockType: BlockType.Leaves });\n                 state.socket.emit('block_update', { tx: targetTx + 1, ty: targetTy - 4, blockType: BlockType.Leaves });\n                 state.socket.emit('block_update', { tx: targetTx, ty: targetTy - 5, blockType: BlockType.Leaves });\n             }\n             if (propsRef.current.onInteract) propsRef.current.onInteract(BlockType.TreeSeed, targetTx, targetTy);\n          } else if (selected === BlockType.CarrotSeed && currentBlock === BlockType.Farmland"
);

fs.writeFileSync('src/components/GameCanvas.tsx', code);
console.log('Leaves drop TreeSeed and TreeSeed plants tree patched.');
