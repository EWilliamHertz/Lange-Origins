const fs = require('fs');
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const targetDraw = `           const isSword = tool === BlockType.WoodSword || tool === BlockType.IronSword;
           const isPickaxe = tool === BlockType.WoodPickaxe || tool === BlockType.StonePickaxe || tool === BlockType.IronPickaxe;`;

const replaceDraw = `           const isSword = tool === BlockType.WoodSword || tool === BlockType.StoneSword || tool === BlockType.IronSword || tool === BlockType.GoldSword || tool === BlockType.DiamondSword;
           const isPickaxe = tool === BlockType.WoodPickaxe || tool === BlockType.StonePickaxe || tool === BlockType.IronPickaxe || tool === BlockType.GoldPickaxe || tool === BlockType.DiamondPickaxe;
           const isGrapple = tool === BlockType.GrapplingHook;
           const isGun = tool === BlockType.Gun;
           const isBow = tool === BlockType.Bow;
           const isStaff = tool === BlockType.WizardStaff;`;

code = code.replace(targetDraw, replaceDraw);

const targetShape = `           } else {
              // Normal block
              ctx.fillRect(-6, -6, 12, 12);
           }`;

const replaceShape = `           } else if (isGrapple) {
              ctx.fillStyle = '#455A64';
              ctx.fillRect(-2, -4, 4, 10);
              ctx.fillStyle = '#78909C';
              ctx.fillRect(-6, -8, 12, 4);
           } else if (isGun) {
              ctx.fillStyle = '#212121';
              ctx.fillRect(-4, -2, 12, 4);
              ctx.fillRect(-4, -2, 4, 8);
           } else if (isBow) {
              ctx.strokeStyle = '#8D6E63';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(0, 0, 8, -Math.PI/2, Math.PI/2);
              ctx.stroke();
              ctx.strokeStyle = '#FFF';
              ctx.beginPath();
              ctx.moveTo(0, -8);
              ctx.lineTo(0, 8);
              ctx.stroke();
           } else if (isStaff) {
              ctx.fillStyle = '#5D4037';
              ctx.fillRect(-2, -10, 4, 20);
              ctx.fillStyle = '#9C27B0';
              ctx.beginPath();
              ctx.arc(0, -12, 4, 0, Math.PI*2);
              ctx.fill();
           } else {
              // Normal block
              if (tool < 100) {
                 ctx.fillRect(-6, -6, 12, 12);
              }
           }`;

code = code.replace(targetShape, replaceShape);
fs.writeFileSync('src/components/GameCanvas.tsx', code);
console.log('Fixed tool drawing');
