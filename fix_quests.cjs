const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regexQuests = /const defaultQuests: Quest\[\] = \[[\s\S]*?\];/;
const replacementQuests = `const defaultQuests: Quest[] = [
    { id: 'q1', title: 'Getting Started', description: 'Mine 5 blocks of Dirt.', goal: 5, current: 0, completed: false, rewardText: 'Knowledge of the world.' },
    { id: 'q2', title: 'Wood Gatherer', description: 'Chop down 3 Wood Logs.', goal: 3, current: 0, completed: false, rewardText: 'Access to Tools', prerequisiteId: 'q1' },
    { id: 'q3', title: 'First Tool', description: 'Craft a Wooden Pickaxe.', goal: 1, current: 0, completed: false, rewardText: 'Mining Capability', prerequisiteId: 'q2' },
    { id: 'q4', title: 'Upgrades', description: 'Craft an Iron Pickaxe.', goal: 1, current: 0, completed: false, rewardText: 'Mining Efficiency', prerequisiteId: 'q3' },
    { id: 'q5', title: 'Magician\\'s Journey', description: 'Mine 5 Blue Crystals to unlock the secrets of magic.', goal: 5, current: 0, completed: false, rewardText: 'Unlock Magic & Mana', prerequisiteId: 'q4' },
    { id: 'q6', title: 'Monster Hunter', description: 'Slay 3 Skeletons or Creepers.', goal: 3, current: 0, completed: false, rewardText: 'Warrior\\'s Pride', prerequisiteId: 'q5' },
    { id: 'q7', title: 'Master Miner', description: 'Mine 5 Diamond Ores.', goal: 5, current: 0, completed: false, rewardText: 'Unmatched Wealth', prerequisiteId: 'q6' },
    { id: 'q8', title: 'Boss Slayer', description: 'Slay the Giant Golem.', goal: 1, current: 0, completed: false, rewardText: 'Legendary Status', prerequisiteId: 'q7' }
  ];`;

code = code.replace(regexQuests, replacementQuests);

// We need to find onMobKilled to add q6 and q8 updates.
const mobKilledRegex = /onMobKilled=\{\(mobType\) => \{[\s\S]*?\}\}/;
const mobKilledReplacement = `onMobKilled={(mobType) => {
            setKills(prev => {
              const newKills = { ...prev };
              newKills[mobType] = (newKills[mobType] || 0) + 1;
              return newKills;
            });
            setQuests(prev => prev.map(q => {
               if (q.id === 'q6' && !q.completed && q.prerequisiteId && prev.find(p => p.id === q.prerequisiteId)?.completed) {
                  if (mobType === 'Skeleton' || mobType === 'Creeper') {
                     const newCount = q.current + 1;
                     return { ...q, current: newCount, completed: newCount >= q.goal };
                  }
               }
               if (q.id === 'q8' && !q.completed && q.prerequisiteId && prev.find(p => p.id === q.prerequisiteId)?.completed) {
                  if (mobType === 'BossGolem') {
                     const newCount = q.current + 1;
                     return { ...q, current: newCount, completed: newCount >= q.goal };
                  }
               }
               return q;
            }));
          }}`;
code = code.replace(mobKilledRegex, mobKilledReplacement);

// Add q7 (Diamond Ore) to onBlockMined
const diamondRegex = /if \(blockType === BlockType\.Wood\) \{/;
const diamondReplacement = `if (blockType === BlockType.DiamondOre) {
               setQuests(prev => prev.map(q => {
                 if (q.id === 'q7' && !q.completed && q.prerequisiteId && prev.find(p => p.id === q.prerequisiteId)?.completed) {
                   const newCount = q.current + 1;
                   return { ...q, current: newCount, completed: newCount >= q.goal };
                 }
                 return q;
               }));
            }
            if (blockType === BlockType.Wood) {`;
code = code.replace(diamondRegex, diamondReplacement);

fs.writeFileSync('src/App.tsx', code);
