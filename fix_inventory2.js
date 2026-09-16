import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/const \[hotbar, setHotbar\] = useState<InventorySlot\[\]>\(\[[\s\S]*?\]\);/, 
`const [hotbar, setHotbar] = useState<InventorySlot[]>([
    { type: BlockType.WoodPickaxe, count: 1 },
    { type: BlockType.Gun, count: 1 },
    { type: BlockType.Bow, count: 1 },
    { type: BlockType.Grenade, count: 64 },
    { type: BlockType.TNT, count: 64 },
    { type: BlockType.Wire, count: 64 },
    { type: BlockType.PressurePlate, count: 64 },
    { type: BlockType.Door, count: 64 },
    { type: BlockType.Platform, count: 64 },
    { type: BlockType.Fists, count: 1 }
  ]);`);

fs.writeFileSync('src/App.tsx', code);
