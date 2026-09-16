const fs = require('fs');
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

code = code.replace(
  "socket.on('damage_indicator', (data: { id: string, x: number, y: number, damage: number }) => {",
  `socket.on('mob_killed', (data: { mobId: string, type: string, killerId: string }) => {
      if (data.killerId === socket.id && propsRef.current.onMobKilled) {
        propsRef.current.onMobKilled(data.type);
      }
    });\n\n    socket.on('damage_indicator', (data: { id: string, x: number, y: number, damage: number }) => {`
);

// update type signature
code = code.replace(
  "onChestUpdated?: (tx: number, ty: number, inventory: any[]) => void;",
  "onChestUpdated?: (tx: number, ty: number, inventory: any[]) => void;\n  onMobKilled?: (type: string) => void;"
);

fs.writeFileSync('src/components/GameCanvas.tsx', code);
console.log('Added mob_killed event handler');
