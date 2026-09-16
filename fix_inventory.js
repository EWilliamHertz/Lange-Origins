import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/const \[hotbar, setHotbar\] = useState<InventorySlot\[\]>\(\[\n\s*\{ blockType: BlockType\.WoodPickaxe, count: 1 \},\n\s*\{ blockType: BlockType\.WoodSword, count: 1 \},\n\s*\{ blockType: BlockType\.Wood, count: 64 \},\n\s*\{ blockType: BlockType\.Platform, count: 64 \},\n\s*\{ blockType: BlockType\.Torch, count: 32 \},\n\s*null,\n\s*null,\n\s*null,\n\s*null\n\s*\]\);/, 
`const [hotbar, setHotbar] = useState<InventorySlot[]>([
    { blockType: BlockType.WoodPickaxe, count: 1 },
    { blockType: BlockType.Gun, count: 1 },
    { blockType: BlockType.Bow, count: 1 },
    { blockType: BlockType.Grenade, count: 10 },
    { blockType: BlockType.TNT, count: 10 },
    { blockType: BlockType.Wire, count: 64 },
    { blockType: BlockType.PressurePlate, count: 10 },
    { blockType: BlockType.Door, count: 10 },
    { blockType: BlockType.AdminBrick, count: 64 }
  ]);`);

fs.writeFileSync('src/App.tsx', code);
