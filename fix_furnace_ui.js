import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/<h3 className="text-white font-bold text-xl mb-2 text-center">Furnace Smelting<\/h3>/, '<h3 className="text-white font-bold text-xl mb-2 text-center">Drug Lab / Workbench</h3>');
code = code.replace(/<span className="text-xs text-neutral-500 mb-1 font-semibold uppercase">Ore<\/span>/, '<span className="text-xs text-neutral-500 mb-1 font-semibold uppercase">Input</span>');
code = code.replace(/<span className="text-xs text-neutral-500 mb-1 font-semibold uppercase">Fuel \(Coal\)<\/span>/, '<span className="text-xs text-neutral-500 mb-1 font-semibold uppercase">Catalyst / Fuel (Scrap Metal)</span>');
code = code.replace(/SMELT/g, 'PROCESS');

fs.writeFileSync('src/App.tsx', code);
