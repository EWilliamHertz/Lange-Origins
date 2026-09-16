import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

code = code.replace(/particles: Particle\[\];/, "particles: Particle[];\n    projectiles: Record<string, any>;");
code = code.replace(/particles: \[\],/, "particles: [],\n      projectiles: {},");

const projSocket = `
    socket.on('projectiles_update', (projs: Record<string, any>) => {
       if (gameState.current) gameState.current.projectiles = projs;
    });
`;
code = code.replace(/socket\.on\('items_update',/, projSocket + "\n    socket.on('items_update',");

const renderProj = `
      // Draw projectiles
      Object.values(state.projectiles).forEach((p: any) => {
          ctx.fillStyle = p.type === 'grenade' ? '#2E7D32' : (p.type === 'bullet' ? '#FFC107' : '#FFFFFF');
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.type === 'grenade' ? 6 : (p.type === 'bullet' ? 2 : 3), 0, Math.PI * 2);
          ctx.fill();
      });
`;
code = code.replace(/\/\/ Draw players/, renderProj + "\n      // Draw players");

const clickLogic = `
             const isGun = propsRef.current.selectedBlock === 302;
             const isBow = propsRef.current.selectedBlock === 109;
             const isGrenade = propsRef.current.selectedBlock === 304;
             
             if (isGun || isBow || isGrenade) {
                 if (state.interactionCooldown <= 0) {
                     const dx = (targetTx * TILE_SIZE) - player.x;
                     const dy = (targetTy * TILE_SIZE) - player.y;
                     const dist = Math.sqrt(dx*dx + dy*dy);
                     const speed = isGun ? 25 : (isBow ? 15 : 10);
                     const vx = (dx / dist) * speed;
                     const vy = (dy / dist) * speed;
                     const type = isGun ? 'bullet' : (isBow ? 'arrow' : 'grenade');
                     
                     state.socket.emit('fire_projectile', { type, x: player.x, y: player.y, vx, vy });
                     state.interactionCooldown = isGun ? 10 : (isBow ? 30 : 40);
                     
                     // We should ideally call a prop to consume ammo here
                 }
                 break;
             }
`;
code = code.replace(/const isSword = propsRef\.current\.selectedBlock === BlockType\.WoodSword \|\| propsRef\.current\.selectedBlock === BlockType\.IronSword;/, clickLogic + "\n             const isSword = propsRef.current.selectedBlock === BlockType.WoodSword || propsRef.current.selectedBlock === BlockType.IronSword;");

fs.writeFileSync('src/components/GameCanvas.tsx', code);
