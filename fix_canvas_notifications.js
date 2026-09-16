import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

code = code.replace(/onPlayerInteract\?: \(playerId: string, playerName: string\) => void;/, 
`onPlayerInteract?: (playerId: string, playerName: string) => void;
  onTradeRequest?: (senderId: string, senderName: string) => void;
  onGangInvite?: (senderId: string, senderName: string) => void;`);

code = code.replace(/socketRef \}: GameProps\) \{/, "onTradeRequest, onGangInvite, socketRef }: GameProps) {");

code = code.replace(/const propsRef = useRef\(\{ selectedBlock, isInventoryOpen, onHealthChange, onBlockMined, onInteract, onPlayerInteract, onDepthChange, onBlockPlaced \}\);/, 
"const propsRef = useRef({ selectedBlock, isInventoryOpen, onHealthChange, onBlockMined, onInteract, onPlayerInteract, onTradeRequest, onGangInvite, onDepthChange, onBlockPlaced });");

code = code.replace(/propsRef\.current = \{ selectedBlock, isInventoryOpen, onHealthChange, onBlockMined, onInteract, onPlayerInteract, onDepthChange, onBlockPlaced \};/, 
"propsRef.current = { selectedBlock, isInventoryOpen, onHealthChange, onBlockMined, onInteract, onPlayerInteract, onTradeRequest, onGangInvite, onDepthChange, onBlockPlaced };");

code = code.replace(/\[selectedBlock, isInventoryOpen, onHealthChange, onBlockMined, onInteract, onPlayerInteract, onDepthChange, onBlockPlaced\]\)/, 
"[selectedBlock, isInventoryOpen, onHealthChange, onBlockMined, onInteract, onPlayerInteract, onTradeRequest, onGangInvite, onDepthChange, onBlockPlaced])");

const socketEvents = `
    socket.on('trade_request', (data: { senderId: string, senderName: string }) => {
      if (propsRef.current.onTradeRequest) {
        propsRef.current.onTradeRequest(data.senderId, data.senderName);
      }
    });
    
    socket.on('gang_invite', (data: { senderId: string, senderName: string }) => {
      if (propsRef.current.onGangInvite) {
        propsRef.current.onGangInvite(data.senderId, data.senderName);
      }
    });
`;

code = code.replace(/socket\.on\('chat_message', \(msg: \{id: string, message: string\}\) => \{/, socketEvents + "\n    socket.on('chat_message', (msg: {id: string, message: string}) => {");

fs.writeFileSync('src/components/GameCanvas.tsx', code);
