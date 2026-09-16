import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

code = code.replace(/    mouseDown: boolean;\n    cameraX: number;\n    cameraY: number;/, "    mouseDown: boolean;");

fs.writeFileSync('src/components/GameCanvas.tsx', code);
