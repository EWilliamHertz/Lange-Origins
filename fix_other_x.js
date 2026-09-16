import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

code = code.replace(/const px = other\.x - \(TILE_SIZE \* 0\.8\) \/ 2;/, "const px = (other as any).x - (TILE_SIZE * 0.8) / 2;");
code = code.replace(/const py = other\.y - \(TILE_SIZE \* 1\.8\) \/ 2;/, "const py = (other as any).y - (TILE_SIZE * 1.8) / 2;");

fs.writeFileSync('src/components/GameCanvas.tsx', code);
