import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/selectedSlotIndexIndex/g, "selectedSlotIndex");
fs.writeFileSync('src/App.tsx', code);
