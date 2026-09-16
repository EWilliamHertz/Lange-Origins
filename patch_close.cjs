const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Inventory Modal
code = code.replace(
  '{inventoryOpen && (\n          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40">',
  `{inventoryOpen && (
          <div 
             className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40"
             onMouseDown={(e) => {
               if (e.target === e.currentTarget) {
                 setInventoryOpen(false);
                 returnCursorItemToInventory(cursorItem);
               }
             }}
          >`
);

code = code.replace(
  '<div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-hidden">',
  '<div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto custom-scrollbar">'
);

// Chest Modal
code = code.replace(
  '{chestOpen && (\n          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40">',
  `{chestOpen && (
          <div 
             className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40"
             onMouseDown={(e) => {
               if (e.target === e.currentTarget) {
                 setChestOpen(false);
                 setActiveChestCoords(null);
                 if (cursorItem) returnCursorItemToInventory(cursorItem);
               }
             }}
          >`
);

// Furnace Modal
code = code.replace(
  '{furnaceOpen && (\n          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40">',
  `{furnaceOpen && (
          <div 
             className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40"
             onMouseDown={(e) => {
               if (e.target === e.currentTarget) {
                 setFurnaceOpen(false);
                 returnCursorItemToInventory(cursorItem);
               }
             }}
          >`
);

// Merchant Modal
code = code.replace(
  '{merchantOpen && (\n          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40">',
  `{merchantOpen && (
          <div 
             className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40"
             onMouseDown={(e) => {
               if (e.target === e.currentTarget) {
                 setMerchantOpen(false);
                 returnCursorItemToInventory(cursorItem);
               }
             }}
          >`
);


fs.writeFileSync('src/App.tsx', code);
console.log('Modals patched for click-away to close and scrolling.');
