const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\/\/ Add general XP for mining/;
const replacement = `            // Add Mining XP if applicable
            if ([BlockType.Stone, BlockType.CoalOre, BlockType.IronOre, BlockType.GoldOre, BlockType.DiamondOre, BlockType.Dirt].includes(minedBlockType)) {
               const miningXpGain = (minedBlockType === BlockType.DiamondOre) ? 50 : (minedBlockType === BlockType.GoldOre) ? 35 : (minedBlockType === BlockType.IronOre || minedBlockType === BlockType.CoalOre) ? 20 : 5;
               setSkills(prev => {
                  let currentLevel = prev.mining || 1;
                  let nextXp = (prev.miningXp || 0) + miningXpGain;
                  let levelUp = false;
                  while (nextXp >= currentLevel * 50) {
                     nextXp -= currentLevel * 50;
                     currentLevel++;
                     levelUp = true;
                  }
                  if (levelUp) {
                     addNotification('system', 'System', 'System', \`Mining Level Up! Now level \${currentLevel}.\`);
                  }
                  return { ...prev, mining: currentLevel, miningXp: nextXp };
               });
            }

            // Add general XP for mining`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
