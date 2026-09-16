import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const slotTypes = ['crafting', 'craftingResult', 'backpack', 'hotbar', 'chest', 'furnaceInput', 'furnaceFuel', 'furnaceOutput'];

for (const st of slotTypes) {
    if (st.startsWith('furnace') || st === 'craftingResult') {
        // Find onClick={() => handleSlotClick('furnaceInput', 0)}
        const regex = new RegExp(`onClick=\\{\\(\\) => handleSlotClick\\('${st}', 0\\)\\}`);
        code = code.replace(regex, `onClick={() => handleSlotClick('${st}', 0)}\n                      onContextMenu={(e) => { e.preventDefault(); handleSlotClick('${st}', 0, true); }}`);
    } else {
        const regex = new RegExp(`onClick=\\{\\(\\) => handleSlotClick\\('${st}', i\\)\\}`, 'g');
        code = code.replace(regex, `onClick={() => handleSlotClick('${st}', i)}\n                            onContextMenu={(e) => { e.preventDefault(); handleSlotClick('${st}', i, true); }}`);
    }
}

// Write it out
fs.writeFileSync('src/App.tsx', code);
