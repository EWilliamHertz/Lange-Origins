import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The main return
const anchor = `  return (
    <div className="w-full h-screen bg-neutral-900 flex flex-col overflow-hidden font-sans select-none touch-none" style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}>
      
      {/* Main Game Area */}
      <div className="flex-1 relative">

        <GameCanvas
          helmet={hasHelmet}
          chestplate={hasChestplate}`;

const replacement = `  const equippedHelmet = backpack.find(s => s && [BlockType.IronHelmet, BlockType.GoldHelmet, BlockType.DiamondHelmet].includes(s.type)) || 
                           hotbar.find(s => s && [BlockType.IronHelmet, BlockType.GoldHelmet, BlockType.DiamondHelmet].includes(s.type));
  const equippedChestplate = backpack.find(s => s && [BlockType.IronChestplate, BlockType.GoldChestplate, BlockType.DiamondChestplate].includes(s.type)) || 
                               hotbar.find(s => s && [BlockType.IronChestplate, BlockType.GoldChestplate, BlockType.DiamondChestplate].includes(s.type));
                               
  const helmetType = equippedHelmet ? equippedHelmet.type : null;
  const chestplateType = equippedChestplate ? equippedChestplate.type : null;

  return (
    <div className="w-full h-screen bg-neutral-900 flex flex-col overflow-hidden font-sans select-none touch-none" style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}>
      
      {/* Main Game Area */}
      <div className="flex-1 relative">

        <GameCanvas
          helmet={helmetType}
          chestplate={chestplateType}`;

code = code.replace(anchor, replacement);

fs.writeFileSync('src/App.tsx', code);
