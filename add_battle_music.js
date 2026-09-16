import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const battleMusicLogic = `
      // Battle Music logic
      let closestMobDist = Infinity;
      Object.values(state.mobs).forEach((mob: any) => {
         if (mob.health && mob.health > 0) {
            const dist = Math.hypot(mob.x - player.x, mob.y - player.y);
            if (dist < closestMobDist) closestMobDist = dist;
         }
      });
      if (closestMobDist < 400) {
         Sounds.startBattleMusic();
      } else {
         Sounds.stopBattleMusic();
      }

      ctx.save();
`;
code = code.replace(/ctx\.save\(\);\n\s*ctx\.translate\(-Math\.floor\(state\.cameraX\)/, battleMusicLogic + "      ctx.translate(-Math.floor(state.cameraX)");
fs.writeFileSync('src/components/GameCanvas.tsx', code);
