import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /  app\.get\('\/api\/servers', \(req, res\) => \{/,
  `  app.post('/api/servers/:id/reset', async (req, res) => {
    const roomId = req.params.id;
    if (activeRooms[roomId]) {
      // Regenerate the world
      activeRooms[roomId].world = generateWorld(roomId);
      activeRooms[roomId].mobs = {};
      activeRooms[roomId].items = {};
      activeRooms[roomId].chests = {};
      
      // Delete all saved chests for this room in Firestore
      try {
        const chestsRef = db.collection('rooms').doc(roomId).collection('chests');
        const snapshot = await chestsRef.get();
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      } catch (e) {
        console.error("Failed to delete room chests in firestore:", e);
      }
      
      io.to(roomId).emit('chat_message', { sender: 'System', text: 'The world has been reset by an admin!' });
      io.to(roomId).emit('world_reset', { world: activeRooms[roomId].world });
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Room not found or not active.' });
    }
  });

  app.get('/api/servers', (req, res) => {`
);

fs.writeFileSync('server.ts', code);
