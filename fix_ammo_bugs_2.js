import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

// I'll ensure there's a space around selectedSlotIndex if any are missing, but it looks fine.
