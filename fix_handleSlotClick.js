import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/type: 'hotbar' \| 'backpack' \| 'crafting' \| 'craftingResult' \| 'furnaceInput' \| 'furnaceFuel' \| 'furnaceOutput' \| 'chest',/, 
`type: 'hotbar' | 'backpack' | 'crafting' | 'craftingResult' | 'furnaceInput' | 'furnaceFuel' | 'furnaceOutput' | 'chest' | 'merchantPayment' | 'merchantOutput',`);

fs.writeFileSync('src/App.tsx', code);
