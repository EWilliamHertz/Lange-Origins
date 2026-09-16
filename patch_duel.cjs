const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const duelButton = `              <button 
                onClick={() => {
                  if (socketRef.current) socketRef.current.emit('send_duel_request', { targetId: interactPlayerId });
                  setNotifications(prev => [...prev, { id: Math.random().toString(), type: 'duel', senderId: interactPlayerId, senderName: "System", timestamp: Date.now(), msg: 'Duel request sent.' } as any]);
                  setInteractPlayerId(null);
                }}
                className="w-full bg-red-600/20 hover:bg-red-600/40 text-red-400 py-3 rounded-xl font-bold border border-red-500/30 transition-colors flex items-center justify-center gap-2"
              >
                <Sword size={18} /> Duel
              </button>
              <button`;

code = code.replace('              <button \n                onClick={() => {\n                  if (socketRef.current) socketRef.current.emit(\'send_friend_request\'', duelButton + ' \n                onClick={() => {\n                  if (socketRef.current) socketRef.current.emit(\'send_friend_request\'');

// Also import Sword from lucide-react if not present
if (!code.includes('Sword')) {
  code = code.replace('import { Play, Search, AlertCircle, LogOut', 'import { Play, Search, AlertCircle, LogOut, Sword');
}

fs.writeFileSync('src/App.tsx', code);
console.log("Duel button patched in App.tsx.");
