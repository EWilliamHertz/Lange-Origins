const fs = require('fs');
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const takeDamageHandler = `
      socket.on('take_damage', (data: { amount: number, facingRight: boolean }) => {
          if (propsRef.current.onArmorDamage) propsRef.current.onArmorDamage();
          if (propsRef.current.onHealthChange) propsRef.current.onHealthChange(-data.amount);
          gameState.current.player.vy = -6;
          gameState.current.player.vx = data.facingRight ? 8 : -8;
      });
`;
code = code.replace("      socket.on('chat_message', (data: { sender: string, text: string }) => {", takeDamageHandler + "\n      socket.on('chat_message', (data: { sender: string, text: string }) => {");

fs.writeFileSync('src/components/GameCanvas.tsx', code);
console.log("GameCanvas patched for take damage.");
