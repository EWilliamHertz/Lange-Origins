const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `          onChestData={(tx, ty, inventory) => {
             setChestInventory(inventory || Array(27).fill(null));
             setActiveChestCoords({tx, ty});
             setChestOpen(true);
             Sounds.openChest();
          }}
          onMobKilled={(type) => {
             setKills(prev => prev + 1);
          }}`;

code = code.replace(
  `          onChestData={(tx, ty, inventory) => {
             setChestInventory(inventory || Array(27).fill(null));
             setActiveChestCoords({tx, ty});
             setChestOpen(true);
             Sounds.openChest();
          }}`,
  replacement
);

fs.writeFileSync('src/App.tsx', code);
console.log('Added onMobKilled to GameCanvas call');
