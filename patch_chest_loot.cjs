const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `
    socket.on('open_chest', async (data: { tx: number, ty: number }) => {
      if (!currentRoom || !activeRooms[currentRoom]) return;
      const chestKey = \`\${data.tx}_\${data.ty}\`;
      if (!activeRooms[currentRoom].chests[chestKey]) {
        try {
          const chestDoc = await db.collection('rooms').doc(currentRoom).collection('chests').doc(chestKey).get();
          if (chestDoc.exists) {
            activeRooms[currentRoom].chests[chestKey] = JSON.parse(chestDoc.data()?.inventory || "[]");
          } else {
            // Generate random loot for wild chest
            const inv = Array(27).fill(null);
            const numItems = Math.floor(Math.random() * 5) + 2; // 2 to 6 items
            const possibleLoot = [202, 304, 303, 18, 19, 20]; // Apple, Grenade, Bullet, Coal, Iron, Diamond
            for (let i = 0; i < numItems; i++) {
                const idx = Math.floor(Math.random() * 27);
                const type = possibleLoot[Math.floor(Math.random() * possibleLoot.length)];
                const count = Math.floor(Math.random() * 5) + 1;
                inv[idx] = { type, count };
            }
            activeRooms[currentRoom].chests[chestKey] = inv;
            // Save initial generated chest
            db.collection('rooms').doc(currentRoom).collection('chests').doc(chestKey).set({
                inventory: JSON.stringify(inv),
                updatedAt: Date.now()
            }).catch(console.error);
          }
        } catch (e) {
          activeRooms[currentRoom].chests[chestKey] = Array(27).fill(null);
        }
      }
      socket.emit('chest_data', { tx: data.tx, ty: data.ty, inventory: activeRooms[currentRoom].chests[chestKey] });
    });
`;

code = code.replace(/    socket\.on\('open_chest', async \(data: \{ tx: number, ty: number \}\) => \{[\s\S]*?    \}\);/, replacement.trim());
fs.writeFileSync('server.ts', code);
console.log('Chest loot patched.');
