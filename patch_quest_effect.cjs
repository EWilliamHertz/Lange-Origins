const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const questEffect = `
  // Detect Quest completions
  const prevQuestsRef = useRef<Quest[]>([]);
  useEffect(() => {
    if (prevQuestsRef.current.length > 0) {
       for (let i = 0; i < quests.length; i++) {
         if (quests[i].completed && !prevQuestsRef.current[i]?.completed) {
            Sounds.achievement?.();
            setNotifications(prev => [...prev, { id: Math.random().toString(), type: 'system', senderId: 'System', senderName: 'System', timestamp: Date.now(), msg: 'Quest Completed: ' + quests[i].title } as any]);
         }
       }
    }
    prevQuestsRef.current = quests;
  }, [quests]);
`;

code = code.replace("  const saveStateRef = useRef({ equipment, hotbar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin });", questEffect + "\n  const saveStateRef = useRef({ equipment, hotbar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin });");

fs.writeFileSync('src/App.tsx', code);
console.log("Quest completion effect added.");
