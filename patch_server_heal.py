lines = open('server.ts').read().split('\n')
for i, line in enumerate(lines):
    if "io.to(currentRoom).emit('damage_indicator', { id: Math.random().toString(), x: player.x, y: player.y - 30, damage: -20 });" in line:
        lines.insert(i+1, "          socket.emit('heal', { amount: 20 });")
        break
open('server.ts', 'w').write('\n'.join(lines))
