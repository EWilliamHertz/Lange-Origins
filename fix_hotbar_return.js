import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const isSelected = selectedSlotIndex === index && !inventoryOpen;\n\s*<button/m;
const replacement = `const isSelected = selectedSlotIndex === index && !inventoryOpen;\n            return (\n              <button`;
code = code.replace(regex, replacement);

fs.writeFileSync('src/App.tsx', code);
