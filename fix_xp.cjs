const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /onGiveXp=\{\(amount\) => \{[\s\S]*?\}\);[\s]*\}\}/;
const replacement = `onGiveXp={(amount) => {
            let currentLevel = saveStateRef.current.level;
            let currentXp = saveStateRef.current.xp;
            let currentSp = saveStateRef.current.skillPoints;

            currentXp += amount;
            let newSp = 0;
            while (currentXp >= currentLevel * 100) {
               currentXp -= currentLevel * 100;
               currentLevel++;
               newSp++;
            }
            
            setXp(currentXp);
            if (newSp > 0) {
               setLevel(currentLevel);
               setSkillPoints(currentSp + newSp);
               addNotification('level_up', 'System', 'System', 'Level Up! Press E to upgrade skills.'); 
               setLevelUpFlash(true); setTimeout(() => setLevelUpFlash(false), 2000);
            }
          }}`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
