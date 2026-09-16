const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement1 = `             const defaultHotbar = [
                         { type: 103, count: 1 },
                         { type: 302, count: 1 },
                         { type: 105, count: 1 }, // Grappling Hook
                         { type: 304, count: 64 },
                         { type: 34, count: 64 },
                         { type: 31, count: 64 },
                         { type: 32, count: 64 },
                         { type: 100, count: 1 },
                         { type: 28, count: 64 },
                         null
             ];`;
code = code.replace(/             const defaultHotbar = \[\n(?:.*\n){11}             \];/, replacement1);

const replacement2 = `                     const defaultHotbar = [
                         { type: 103 /* BlockType.Fists */, count: 1 },
                         { type: 302 /* BlockType.Gun */, count: 1 },
                         { type: 105 /* BlockType.GrapplingHook */, count: 1 },
                         { type: 304 /* BlockType.Grenade */, count: 64 },
                         { type: 303 /* BlockType.Bullet */, count: 64 },
                         { type: 110 /* BlockType.Arrow */, count: 64 },
                         { type: 34 /* BlockType.TNT */, count: 64 },
                         { type: 31 /* BlockType.Wire */, count: 64 },
                         { type: 32 /* BlockType.PressurePlate */, count: 64 },
                         { type: 100 /* BlockType.WoodPickaxe */, count: 1 }
                      ];`;
code = code.replace(/                     const defaultHotbar = \[\n(?:.*\n){13}                      \];/, replacement2);

fs.writeFileSync('src/App.tsx', code);
console.log('Updated hotbars');
