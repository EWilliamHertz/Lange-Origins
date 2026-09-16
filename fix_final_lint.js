import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/import \{ ([^}]+) \} from 'lucide-react';/, "import { $1, Layers } from 'lucide-react';");
fs.writeFileSync('src/App.tsx', code);

let canvasCode = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');
const handleToss = `
    const handleToss = (e: Event) => {
       const detail = (e as CustomEvent).detail;
       if (gameState.current.socket) {
          gameState.current.socket.emit('drop_item', { type: detail.type, count: detail.count, facingRight: gameState.current.player.facingRight });
       }
    };
`;
canvasCode = canvasCode.replace(/const handleToss = \(e: Event\) => \{[\s\S]*?\};/, handleToss);
fs.writeFileSync('src/components/GameCanvas.tsx', canvasCode);
