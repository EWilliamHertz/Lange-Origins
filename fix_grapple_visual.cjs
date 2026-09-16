const fs = require('fs');
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const hookStateTarget = `    socket: Socket | null;
    myId: string | null;
    keys: Record<string, boolean>;`;

const hookStateReplacement = `    socket: Socket | null;
    myId: string | null;
    keys: Record<string, boolean>;
    grapplePoint: { x: number, y: number } | null;
    grappleTimer: number;`;

code = code.replace(hookStateTarget, hookStateReplacement);

const hookInitTarget = `      socket: null,
      myId: null,
      keys: {},`;

const hookInitReplacement = `      socket: null,
      myId: null,
      keys: {},
      grapplePoint: null,
      grappleTimer: 0,`;

code = code.replace(hookInitTarget, hookInitReplacement);

const hookTriggerTarget = `                   if (player.vx > 25) player.vx = 25;
                   state.interactionCooldown = 250;
                   
                   player.grounded = false;
                   state.damageTexts.push({ id: Math.random().toString(), text: 'Swoosh!', x: player.x, y: player.y - 15, life: 1, maxLife: 30, color: '#DDDDDD', size: 12 });
                   state.interactionCooldown = 400;
               } else {`;

const hookTriggerReplacement = `                   if (player.vx > 25) player.vx = 25;
                   state.interactionCooldown = 250;
                   
                   player.grounded = false;
                   state.grapplePoint = { x: hx, y: hy };
                   state.grappleTimer = 15;
                   state.damageTexts.push({ id: Math.random().toString(), text: 'Swoosh!', x: player.x, y: player.y - 15, life: 1, maxLife: 30, color: '#DDDDDD', size: 12 });
                   state.interactionCooldown = 400;
               } else {`;

code = code.replace(hookTriggerTarget, hookTriggerReplacement);

const hookRenderTarget = `        if (isMining) {
           // Swing animation`;

const hookRenderReplacement = `        if (state.grapplePoint && state.grappleTimer > 0) {
           ctx.beginPath();
           ctx.moveTo(pX + pWidth/2, pY + pHeight/2);
           ctx.lineTo(mapX + state.grapplePoint.x * mapScale, mapY + state.grapplePoint.y * mapScale);
           ctx.strokeStyle = 'rgba(200, 200, 200, 0.8)';
           ctx.lineWidth = 2 * mapScale;
           ctx.stroke();
           state.grappleTimer--;
           if (state.grappleTimer <= 0) state.grapplePoint = null;
        }

        if (isMining) {
           // Swing animation`;

code = code.replace(hookRenderTarget, hookRenderReplacement);

fs.writeFileSync('src/components/GameCanvas.tsx', code);
console.log('Fixed grapple visual');
