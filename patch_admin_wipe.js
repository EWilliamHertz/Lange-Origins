import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `  app.post('/api/admin/wipe', async (req, res) => {
    const { email, roomId } = req.body;
    if (email !== 'ewilliamhe@gmail.com' && email !== 'zudran@gmail.com') return res.status(403).json({error: "Unauthorized"});
    
    const targetRoom = roomId || 'public-lobby';
    if (activeRooms[targetRoom]) {
      activeRooms[targetRoom].world = generateWorld(targetRoom);
      activeRooms[targetRoom].chests = {};
      activeRooms[targetRoom].items = {};
      activeRooms[targetRoom].mobs = {};
      
      try {
        const chestsRef = db.collection('rooms').doc(targetRoom).collection('chests');
        const snapshot = await chestsRef.get();
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      } catch (e) {
        console.error("Failed to delete room chests in firestore:", e);
      }
      
      io.to(targetRoom).emit('world_wiped', { world: activeRooms[targetRoom].world });
      io.to(targetRoom).emit('chat_message', { sender: 'System', message: 'The world has been reset by an admin!' });
      res.json({ success: true });
    } else {
      res.status(404).json({error: "Room not found"});
    }
  });`;

code = code.replace(/  app\.post\('\/api\/admin\/wipe', \(req, res\) => \{[\s\S]*?res\.status\(404\)\.json\(\{error: "Room not found"\}\);\n    \}\n  \}\);/, replacement);

fs.writeFileSync('server.ts', code);
