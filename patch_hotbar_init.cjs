const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `
  const [hotbar, setHotbar] = useState<InventorySlot[]>([
    { type: BlockType.Fists, count: 1 },
    { type: BlockType.WoodPickaxe, count: 1 },
    { type: BlockType.Gun, count: 1 },
    { type: BlockType.Bow, count: 1 },
    { type: BlockType.Grenade, count: 64 },
    { type: BlockType.Bullet, count: 64 },
    { type: BlockType.Arrow, count: 64 },
    { type: BlockType.TNT, count: 64 },
    { type: BlockType.Platform, count: 64 }
  ]);
`;

code = code.replace(/  const \[hotbar, setHotbar\] = useState<InventorySlot\[\]>\(\[[\s\S]*?  \]\);/, replacement.trim());
fs.writeFileSync('src/App.tsx', code);
console.log('Hotbar init patched.');
