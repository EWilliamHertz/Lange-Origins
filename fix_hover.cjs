const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const hoverBackpack = `onContextMenu={(e) => { e.preventDefault(); handleSlotClick('backpack', i, true); }}`;
const replaceBackpack = `onContextMenu={(e) => { e.preventDefault(); handleSlotClick('backpack', i, true); }}
                            onMouseEnter={() => { if(hoveredSlotRef) hoveredSlotRef.current = { type: 'backpack', index: i }; }}
                            onMouseLeave={() => { if(hoveredSlotRef) hoveredSlotRef.current = null; }}`;
code = code.replace(hoverBackpack, replaceBackpack);

const hoverLeft = `onContextMenu={(e) => { e.preventDefault(); handleSlotClick('leftActionBar', i, true); }}`;
const replaceLeft = `onContextMenu={(e) => { e.preventDefault(); handleSlotClick('leftActionBar', i, true); }}
                            onMouseEnter={() => { if(hoveredSlotRef) hoveredSlotRef.current = { type: 'leftActionBar', index: i }; }}
                            onMouseLeave={() => { if(hoveredSlotRef) hoveredSlotRef.current = null; }}`;
code = code.replace(hoverLeft, replaceLeft);

const hoverRight = `onContextMenu={(e) => { e.preventDefault(); handleSlotClick('rightActionBar', i, true); }}`;
const replaceRight = `onContextMenu={(e) => { e.preventDefault(); handleSlotClick('rightActionBar', i, true); }}
                            onMouseEnter={() => { if(hoveredSlotRef) hoveredSlotRef.current = { type: 'rightActionBar', index: i }; }}
                            onMouseLeave={() => { if(hoveredSlotRef) hoveredSlotRef.current = null; }}`;
code = code.replace(hoverRight, replaceRight);

fs.writeFileSync('src/App.tsx', code);
console.log('Added hover tracking');
