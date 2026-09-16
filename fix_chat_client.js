import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

code = code.replace(/socket\.on\('chat_message', \(msg: \{id: string, message: string\}\) => \{/, "socket.on('chat_message', (msg: {id: string, name?: string, message: string}) => {");
code = code.replace(/onChatMessage\(\{ sender: msg\.id, text: msg\.message \}\);/, "onChatMessage({ sender: msg.name || msg.id, text: msg.message });");

fs.writeFileSync('src/components/GameCanvas.tsx', code);
