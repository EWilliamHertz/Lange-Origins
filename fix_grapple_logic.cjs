const fs = require('fs');
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const regex = /player\.vx \+= \(pullDx\/pullDist\) \* 20; \/\/ impulse instead of absolute set to allow swinging\s*player\.vy \+= \(pullDy\/pullDist\) \* 20;\s*if \(player\.vy < -25\) player\.vy = -25;\s*if \(player\.vx < -25\) player\.vx = -25;\s*if \(player\.vx > 25\) player\.vx = 25;/;

code = code.replace(regex, `player.vx += (pullDx/pullDist) * 15;
                   player.vy += (pullDy/pullDist) * 15;
                   if (player.vy < -25) player.vy = -25;
                   if (player.vx < -25) player.vx = -25;
                   if (player.vx > 25) player.vx = 25;
                   state.interactionCooldown = 250;`); // Added cooldown

fs.writeFileSync('src/components/GameCanvas.tsx', code);
console.log('Fixed grappling hook logic');
