const fs = require('fs');
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const pvpLogic = `
          // 1.5 Check PvP Hit
          if (!hitMob && state.socket && propsRef.current.duelingOpponents && propsRef.current.duelingOpponents.length > 0) {
             for (const otherId in state.players) {
                if (propsRef.current.duelingOpponents.includes(otherId)) {
                   const other = state.players[otherId];
                   const dx = other.x - player.x;
                   const dy = other.y - player.y;
                   const distToOther = Math.sqrt(dx*dx + dy*dy);
                   if (distToOther <= ATTACK_RANGE) {
                      // Hit them!
                      const dmg = propsRef.current.selectedBlock === BlockType.DiamondSword ? 10 
                                : propsRef.current.selectedBlock === BlockType.GoldSword ? 7 
                                : propsRef.current.selectedBlock === BlockType.IronSword ? 6 
                                : propsRef.current.selectedBlock === BlockType.StoneSword ? 5 
                                : propsRef.current.selectedBlock === BlockType.WoodSword ? 4 
                                : 2;
                      state.socket.emit('hit_player', { targetId: otherId, damage: dmg, facingRight: player.x < other.x });
                      state.interactionCooldown = 300;
                      hitMob = true; // reusing this to skip block mining
                      break;
                   }
                }
             }
          }
`;

code = code.replace("        // 2. Block interaction if no mob hit and in reach", pvpLogic + "\n        // 2. Block interaction if no mob hit and in reach");

code = code.replace(
  "  currentGang?: any;\n  socketRef?: React.MutableRefObject<Socket | null>;",
  "  currentGang?: any;\n  socketRef?: React.MutableRefObject<Socket | null>;\n  duelingOpponents?: string[];"
);
code = code.replace(
  "currentGang, socketRef, onFireWeapon, currentAmmoCount }: GameProps) {",
  "currentGang, socketRef, onFireWeapon, currentAmmoCount, duelingOpponents }: GameProps) {"
);
code = code.replace(
  "onBlockPlaced, currentGang, onFireWeapon, characterSkin",
  "onBlockPlaced, currentGang, onFireWeapon, characterSkin, duelingOpponents"
);
code = code.replace(
  "onBlockPlaced, currentGang, onFireWeapon, characterSkin",
  "onBlockPlaced, currentGang, onFireWeapon, characterSkin, duelingOpponents"
);

fs.writeFileSync('src/components/GameCanvas.tsx', code);
console.log("GameCanvas patched for PvP.");
