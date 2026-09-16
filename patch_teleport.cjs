const fs = require('fs');
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const replacement = `
    socket.on('chat_message', (msg: {id: string, name?: string, message: string}) => {
      if (onChatMessage) {
        onChatMessage({ sender: msg.name || msg.id, text: msg.message });
      }
    });

    socket.on('teleport', (data: {x: number, y: number}) => {
       gameState.current.player.x = data.x;
       gameState.current.player.y = data.y;
       gameState.current.player.vy = 0;
    });
`;

code = code.replace(/    socket\.on\('chat_message', \(msg: \{id: string, name\?: string, message: string\}\) => \{[\s\S]*?    \}\);/, replacement.trim());
fs.writeFileSync('src/components/GameCanvas.tsx', code);
console.log('Teleport patched.');
