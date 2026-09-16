import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const catchToss = `
    const handleToss = (e: Event) => {
       const detail = (e as CustomEvent).detail;
       if (state.socket) {
          state.socket.emit('drop_item', { type: detail.type, count: detail.count, facingRight: player.facingRight });
       }
    };
    window.addEventListener('toss_item', handleToss);
`;
code = code.replace(/window\.addEventListener\('keyup', handleKeyUp\);/, "window.addEventListener('keyup', handleKeyUp);\n" + catchToss);

code = code.replace(/window\.removeEventListener\('keyup', handleKeyUp\);/, "window.removeEventListener('keyup', handleKeyUp);\n      window.removeEventListener('toss_item', handleToss);");

fs.writeFileSync('src/components/GameCanvas.tsx', code);
