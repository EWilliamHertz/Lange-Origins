const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /onMobKilled=\{\(type\) => \{\s*setKills\(prev => prev \+ 1\);\s*\}\}/;

code = code.replace(regex, `onMobKilled={(type) => {
             setKills(prev => prev + 1);
             const xpGain = type === 'golem_boss' ? 250 : 25;
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
          }}`);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed onMobKilled to grant XP and Level up');
