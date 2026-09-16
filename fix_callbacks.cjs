const fs = require('fs');

// 1. Update GameCanvas.tsx
let gameCanvas = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

// Add new props to interface
const propsToInsert = `
  onDuelRequest?: (senderId: string, senderName: string) => void;
  onDuelStarted?: (opponentId: string, opponentName: string) => void;
  onChestData?: (tx: number, ty: number, inventory: any[]) => void;
  onChestUpdated?: (tx: number, ty: number, inventory: any[]) => void;
`;
gameCanvas = gameCanvas.replace("  currentGang?: any;", propsToInsert + "\n  currentGang?: any;");

// Update component signature
gameCanvas = gameCanvas.replace(
  "onFriendRequest, currentGang, socketRef, onFireWeapon, currentAmmoCount, duelingOpponents }: GameProps) {",
  "onFriendRequest, onDuelRequest, onDuelStarted, onChestData, onChestUpdated, currentGang, socketRef, onFireWeapon, currentAmmoCount, duelingOpponents }: GameProps) {"
);

// Update propsRef
gameCanvas = gameCanvas.replace(
  "helmet, chestplate });",
  "onDuelRequest, onDuelStarted, onChestData, onChestUpdated, helmet, chestplate });"
);

// Add the socket listeners inside GameCanvas
const socketListeners = `
    socket.on('duel_request', (data: { senderId: string, senderName: string }) => {
      if (propsRef.current.onDuelRequest) propsRef.current.onDuelRequest(data.senderId, data.senderName);
    });
    socket.on('duel_started', (data: { opponentId: string, opponentName: string }) => {
      if (propsRef.current.onDuelStarted) propsRef.current.onDuelStarted(data.opponentId, data.opponentName);
    });
    socket.on('chest_data', (data: {tx: number, ty: number, inventory: any[]}) => {
      if (propsRef.current.onChestData) propsRef.current.onChestData(data.tx, data.ty, data.inventory);
    });
    socket.on('chest_updated', (data: {tx: number, ty: number, inventory: any[]}) => {
      if (propsRef.current.onChestUpdated) propsRef.current.onChestUpdated(data.tx, data.ty, data.inventory);
    });
`;
gameCanvas = gameCanvas.replace("    socket.on('trade_request', (data: { senderId: string, senderName: string }) => {", socketListeners + "\n    socket.on('trade_request', (data: { senderId: string, senderName: string }) => {");

fs.writeFileSync('src/components/GameCanvas.tsx', gameCanvas);

// 2. Update App.tsx
let appTsx = fs.readFileSync('src/App.tsx', 'utf8');

const appPropsToInsert = `
          onDuelRequest={(senderId, senderName) => addNotification('duel', senderId, senderName)}
          onDuelStarted={(opponentId, opponentName) => {
             setChatMessages(prev => [...prev, { id: Math.random().toString(), sender: 'System', text: 'Duel started against ' + opponentName + '!', timestamp: Date.now() }]);
             setDuelingOpponents(prev => [...prev, opponentId]);
          }}
          onChestData={(tx, ty, inventory) => {
             setChestInventory(inventory || Array(27).fill(null));
             setActiveChestCoords({tx, ty});
             setChestOpen(true);
             Sounds.openChest();
          }}
          onChestUpdated={(tx, ty, inventory) => {
             if (activeChestCoords?.tx === tx && activeChestCoords?.ty === ty) {
                setChestInventory(inventory);
             }
          }}
`;
appTsx = appTsx.replace("          onFriendRequest={(senderId, senderName) => addNotification('friend', senderId, senderName)}", "          onFriendRequest={(senderId, senderName) => addNotification('friend', senderId, senderName)}\n" + appPropsToInsert);

// Remove the old chest_data listener block in App.tsx
appTsx = appTsx.replace(/  \/\/ Keyboard shortcuts\n  useEffect\(\(\) => \{\n    if \(socketRef\.current\) \{\n      socketRef\.current\.on\('chest_data',[\s\S]*?\}, \[activeChestCoords\]\);\n/, "  // Keyboard shortcuts\n");

// Add 'duel' to Notif type in App.tsx if needed
appTsx = appTsx.replace("type: 'trade' | 'gang' | 'friend'", "type: 'trade' | 'gang' | 'friend' | 'duel'");

fs.writeFileSync('src/App.tsx', appTsx);
console.log("Fixed callbacks for duel and chest.");
