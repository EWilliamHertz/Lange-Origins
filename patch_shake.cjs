const fs = require('fs');
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

code = code.replace(
  "interactionCooldown: number;",
  "interactionCooldown: number;\n    shakeTimer: number;"
);

code = code.replace(
  "interactionCooldown: 0,",
  "interactionCooldown: 0,\n      shakeTimer: 0,"
);

// Add screenshake trigger
code = code.replace(
  "if (player.health < prevHealth) {\n           Sounds.hurt();\n         }",
  "if (player.health < prevHealth) {\n           Sounds.hurt();\n           state.shakeTimer = 20;\n         }"
);

// Add screenshake effect during rendering
const renderShake = `
      // --- SCREEN SHAKE & DAMAGE FLASH ---
      if (state.shakeTimer > 0) {
         const intensity = (state.shakeTimer / 20) * 10;
         const sx = (Math.random() - 0.5) * intensity;
         const sy = (Math.random() - 0.5) * intensity;
         ctx.translate(sx, sy);
         state.shakeTimer--;
      }
`;

code = code.replace(
  "// Smooth camera tracking",
  renderShake.trim() + "\n      // Smooth camera tracking"
);

const redFlash = `
      // Red Flash Overaly
      if (state.shakeTimer > 0) {
         ctx.save();
         ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform for UI
         ctx.fillStyle = \`rgba(255, 0, 0, \${(state.shakeTimer / 20) * 0.3})\`;
         ctx.fillRect(0, 0, canvas.width, canvas.height);
         ctx.restore();
      }
      
      // Draw UI
`;

code = code.replace(
  "// Draw UI",
  redFlash.trim()
);

fs.writeFileSync('src/components/GameCanvas.tsx', code);
console.log('Screenshake patched.');
