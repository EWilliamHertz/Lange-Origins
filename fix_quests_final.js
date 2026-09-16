import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const newQuests = `  const [quests, setQuests] = useState<Quest[]>([
    { id: 'q1', title: 'Getting Started', description: 'Mine 5 blocks of Dirt.', goal: 5, current: 0, completed: false, rewardText: 'Knowledge of the world.' },
    { id: 'q2', title: 'Wood Gatherer', description: 'Chop down 3 Wood Logs.', goal: 3, current: 0, completed: false, rewardText: 'Access to Tools', prerequisiteId: 'q1' },
    { id: 'q3', title: 'First Tool', description: 'Craft a Wooden Pickaxe.', goal: 1, current: 0, completed: false, rewardText: 'Mining Capability', prerequisiteId: 'q2' },
    { id: 'q4', title: 'Upgrades', description: 'Craft an Iron Pickaxe.', goal: 1, current: 0, completed: false, rewardText: 'Mining Efficiency', prerequisiteId: 'q3' },
  ]);`;

code = code.replace(/  const \[quests, setQuests\] = useState<Quest\[\]>\(\[\n    \{ id: 'q1'[\s\S]*?\n  \]\);/, newQuests);

fs.writeFileSync('src/App.tsx', code);
