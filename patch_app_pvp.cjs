const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace("  const [showEquipment, setShowEquipment] = useState(false);", "  const [showEquipment, setShowEquipment] = useState(false);\n  const [duelingOpponents, setDuelingOpponents] = useState<string[]>([]);");

const duelStartedRepl = `
      socketRef.current.on('duel_started', (data: { opponentId: string, opponentName: string }) => {
        setChatMessages(prev => [...prev, { id: Math.random().toString(), sender: 'System', text: 'Duel started against ' + data.opponentName + '!', timestamp: Date.now() }]);
        setDuelingOpponents(prev => [...prev, data.opponentId]);
      });
`;
code = code.replace("      socketRef.current.on('duel_started', (data: { opponentId: string, opponentName: string }) => {\n        setChatMessages(prev => [...prev, { id: Math.random().toString(), sender: 'System', text: 'Duel started against ' + data.opponentName + '!', timestamp: Date.now() }]);\n        // Here we could set a 'duelingOpponentId' state to allow PVP damage to them\n      });", duelStartedRepl);

code = code.replace(
  "          currentGang={currentGang}\n          socketRef={socketRef}\n          onFireWeapon={handleFireWeapon}",
  "          currentGang={currentGang}\n          socketRef={socketRef}\n          duelingOpponents={duelingOpponents}\n          onFireWeapon={handleFireWeapon}"
);

fs.writeFileSync('src/App.tsx', code);
console.log("App.tsx patched for duelingOpponents state.");
