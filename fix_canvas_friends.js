import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const canvasDefOld = `  onGangInvite?: (senderId: string, senderName: string) => void;
  onTradeRequest?: (senderId: string, senderName: string) => void;`;
  
const canvasDefNew = `  onGangInvite?: (senderId: string, senderName: string) => void;
  onTradeRequest?: (senderId: string, senderName: string) => void;
  onFriendRequest?: (senderId: string, senderName: string) => void;`;
  
code = code.replace(canvasDefOld, canvasDefNew);

const socketOld = `      state.socket.on('gang_invite', (data: any) => {
          if (propsRef.current.onGangInvite) propsRef.current.onGangInvite(data.senderId, data.senderName);
      });`;

const socketNew = `      state.socket.on('gang_invite', (data: any) => {
          if (propsRef.current.onGangInvite) propsRef.current.onGangInvite(data.senderId, data.senderName);
      });
      state.socket.on('friend_request', (data: any) => {
          if (propsRef.current.onFriendRequest) propsRef.current.onFriendRequest(data.senderId, data.senderName);
      });`;

code = code.replace(socketOld, socketNew);
fs.writeFileSync('src/components/GameCanvas.tsx', code);
