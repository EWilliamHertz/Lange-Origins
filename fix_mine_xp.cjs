const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `            if (minedBlockType === BlockType.DiamondOre) blockType = BlockType.Diamond;
            Sounds.mineBlock();
            // Update quests`;

const replacement = `            if (minedBlockType === BlockType.DiamondOre) blockType = BlockType.Diamond;
            Sounds.mineBlock();
            
            // Add XP for mining
            const xpGain = (minedBlockType === BlockType.DiamondOre) ? 15 : (minedBlockType === BlockType.GoldOre) ? 10 : (minedBlockType === BlockType.IronOre || minedBlockType === BlockType.CoalOre) ? 5 : 1;
            setXp(prevXp => {
                let nextXp = prevXp + xpGain;
                setLevel(prevLevel => {
                   let currentLevel = prevLevel;
                   let newSkillPoints = 0;
                   while (nextXp >= currentLevel * 100) {
                      nextXp -= currentLevel * 100;
                      currentLevel++;
                      newSkillPoints++;
                   }
                   if (newSkillPoints > 0) {
                      setSkillPoints(sp => sp + newSkillPoints);
                      addNotification('system', 'System', 'Level Up! Press E to upgrade skills.');
                   }
                   return currentLevel;
                });
                return nextXp;
             });

            // Update quests`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed mining xp');
