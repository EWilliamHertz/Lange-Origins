const fs = require('fs');
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const oldDraw = `        ctx.save();
        ctx.translate(armX + 4, armY + 4);
        
        let armRotation = 0;
        if (state.grapplePoint && state.grappleTimer > 0) {
           ctx.beginPath();
           ctx.moveTo(pX + pWidth/2, pY + pHeight/2);
           ctx.lineTo(mapX + state.grapplePoint.x * mapScale, mapY + state.grapplePoint.y * mapScale);
           ctx.strokeStyle = 'rgba(200, 200, 200, 0.8)';
           ctx.lineWidth = 2 * mapScale;
           ctx.stroke();
           state.grappleTimer--;
           if (state.grappleTimer <= 0) state.grapplePoint = null;
        }

        if (isMining) {`;

const newDraw = `        ctx.save();

        if (state.grapplePoint && state.grappleTimer > 0) {
           ctx.beginPath();
           ctx.moveTo(pX + pWidth/2, pY + pHeight/2);
           ctx.lineTo(state.grapplePoint.x - state.cameraX, state.grapplePoint.y - state.cameraY);
           ctx.strokeStyle = '#FFFFFF';
           ctx.lineWidth = 2;
           ctx.stroke();
           state.grappleTimer--;
           if (state.grappleTimer <= 0) state.grapplePoint = null;
        }

        ctx.translate(armX + 4, armY + 4);
        
        let armRotation = 0;
        if (isMining) {`;

code = code.replace(oldDraw, newDraw);
fs.writeFileSync('src/components/GameCanvas.tsx', code);
console.log('Fixed grapple draw');
