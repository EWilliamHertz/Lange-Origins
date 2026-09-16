import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const newQuests = `  const [quests, setQuests] = useState<Quest[]>([
    { id: 'q1', title: 'Street Sweeper', description: 'Clear out 5 blocks of Dirt.', goal: 5, current: 0, completed: false, rewardText: 'Street Cred' },
    { id: 'q2', title: 'Scavenger', description: 'Scavenge 3 Wood Logs.', goal: 3, current: 0, completed: false, rewardText: 'Access to Tools', prerequisiteId: 'q1' },
    { id: 'q3', title: 'First Weapon', description: 'Craft a Baseball Bat (Wooden Pickaxe).', goal: 1, current: 0, completed: false, rewardText: 'Self Defense', prerequisiteId: 'q2' },
    { id: 'q4', title: 'Heavy Hitter', description: 'Craft a Glock 19 (Iron Pickaxe).', goal: 1, current: 0, completed: false, rewardText: 'Firepower', prerequisiteId: 'q3' },
  ]);`;

code = code.replace(/  const \[quests, setQuests\] = useState<Quest\[\]>\(\[\n    \{ id: 'q1'[\s\S]*?\n  \]\);/, newQuests);

// Also fix the quest check condition for q1 to listen for BlockType.Dirt again instead of BlockType.Stone
code = code.replace(/if \(blockType === BlockType\.Stone\) \{\n               setQuests\(prev => prev\.map\(q => \{\n                 if \(q\.id === 'q1'/, 
`if (blockType === BlockType.Dirt) {
               setQuests(prev => prev.map(q => {
                 if (q.id === 'q1'`);


fs.writeFileSync('src/App.tsx', code);
