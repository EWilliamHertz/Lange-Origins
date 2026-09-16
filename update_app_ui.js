import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const stateVars = `
  const [activeTrade, setActiveTrade] = useState<any>(null);
  const [currentGang, setCurrentGang] = useState<any>(null);
`;
code = code.replace(/const \[interactPlayerName, setInteractPlayerName\] = useState<string \| null>\(null\);/, 
  `const [interactPlayerName, setInteractPlayerName] = useState<string | null>(null);\n${stateVars}`);

const socketEvents = `
      socket.on('trade_started', (data: any) => {
          setActiveTrade({ ...data, p1Items: Array(9).fill(null), p2Items: Array(9).fill(null), p1Confirm: false, p2Confirm: false });
      });
      socket.on('trade_updated', (data: any) => {
          setActiveTrade((prev: any) => ({ ...prev, ...data }));
      });
      socket.on('trade_completed', (data: { itemsReceived: InventorySlot[] }) => {
          setBackpack(prev => {
              let newBp = [...prev];
              data.itemsReceived.forEach(item => {
                  if (item) {
                      // find empty slot
                      const emptyIndex = newBp.findIndex(s => s === null);
                      if (emptyIndex !== -1) newBp[emptyIndex] = item;
                  }
              });
              return newBp;
          });
          setActiveTrade(null);
          setNotifications(prev => [...prev, { id: Math.random().toString(), type: 'trade', senderId: 'sys', senderName: 'System', timestamp: Date.now(), msg: 'Trade Successful!' } as any]);
      });
      socket.on('trade_cancelled', (data: { returnedItems: InventorySlot[] }) => {
          setBackpack(prev => {
              let newBp = [...prev];
              data.returnedItems.forEach(item => {
                  if (item) {
                      const emptyIndex = newBp.findIndex(s => s === null);
                      if (emptyIndex !== -1) newBp[emptyIndex] = item;
                  }
              });
              return newBp;
          });
          setActiveTrade(null);
          setNotifications(prev => [...prev, { id: Math.random().toString(), type: 'trade', senderId: 'sys', senderName: 'System', timestamp: Date.now(), msg: 'Trade Cancelled' } as any]);
      });
      socket.on('gang_update', (data: any) => {
          setCurrentGang(data);
          setNotifications(prev => [...prev, { id: Math.random().toString(), type: 'gang', senderId: 'sys', senderName: 'System', timestamp: Date.now(), msg: 'Gang Updated' } as any]);
      });
`;

code = code.replace(/socket\.on\('chat_message', \(msg: \{id: string, message: string\}\) => \{[\s\S]*?\}\);/, socketEvents + "\n        $&");

const notifRender = `
      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
        {notifications.map(n => (
          <div key={n.id} className="bg-black/80 backdrop-blur-md border border-neutral-700 p-4 rounded-xl shadow-2xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="flex items-center gap-3">
               {n.type === 'trade' ? <Star className="text-amber-500 w-5 h-5" /> : <Shield className="text-blue-500 w-5 h-5" />}
               <div>
                 <p className="text-sm font-bold text-white">{n.msg ? n.msg : (n.type === 'trade' ? 'Trade Request' : 'Gang Invite')}</p>
                 <p className="text-xs text-neutral-400">{n.msg ? '' : \`From \${n.senderName}\`}</p>
               </div>
             </div>
             <div className="flex gap-2">
               {!n.msg && (
                 <button onClick={() => {
                   if (n.type === 'trade') socketRef.current?.emit('accept_trade_request', { senderId: n.senderId });
                   else socketRef.current?.emit('accept_gang_invite', { senderId: n.senderId });
                   setNotifications(prev => prev.filter(x => x.id !== n.id));
                 }} className="bg-emerald-600/30 hover:bg-emerald-500/50 text-emerald-400 px-3 py-1 rounded text-xs font-bold transition-colors">
                   Accept
                 </button>
               )}
               <button onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} className="text-neutral-500 hover:text-white p-1">
                 ✕
               </button>
             </div>
          </div>
        ))}
      </div>
`;
code = code.replace(/<div className="absolute top-4 right-4 z-50 flex flex-col gap-2">[\s\S]*?<\/div>\n      \)\}\n      <\/div>/, notifRender);

const tradeUI = `
      {/* Active Trade Window */}
      {activeTrade && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
            <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-700 shadow-2xl w-full max-w-3xl flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-white">Secure Trade</h3>
                <button onClick={() => socketRef.current?.emit('cancel_trade', { tradeId: activeTrade.tradeId })} className="text-red-400 hover:text-red-300 font-bold px-4 py-2 bg-red-900/20 rounded-lg">Cancel Trade</button>
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                {/* My Side */}
                <div className={"p-4 rounded-xl border " + ((activeTrade.role === 'p1' ? activeTrade.p1Confirm : activeTrade.p2Confirm) ? 'border-emerald-500 bg-emerald-900/10' : 'border-neutral-700 bg-neutral-800')}>
                   <h4 className="text-white font-bold mb-4">You</h4>
                   <div className="grid grid-cols-3 gap-2 mb-4">
                      {(activeTrade.role === 'p1' ? activeTrade.p1Items : activeTrade.p2Items).map((slot: InventorySlot, i: number) => (
                        <div key={i} 
                          onClick={() => {
                             if (cursorItem) {
                                 const myItems = [...(activeTrade.role === 'p1' ? activeTrade.p1Items : activeTrade.p2Items)];
                                 myItems[i] = cursorItem;
                                 setCursorItem(null);
                                 socketRef.current?.emit('update_trade_item', { tradeId: activeTrade.tradeId, role: activeTrade.role, index: i, item: cursorItem });
                             }
                          }}
                          className="w-16 h-16 bg-black/40 rounded border border-neutral-600 flex items-center justify-center hover:bg-white/5 relative">
                          {slot && renderBlockIcon(slot)}
                          {slot && slot.count > 1 && <span className="absolute bottom-1 right-1 text-[10px] font-bold text-white bg-black/50 px-1 rounded">{slot.count}</span>}
                        </div>
                      ))}
                   </div>
                   <button 
                     onClick={() => socketRef.current?.emit('toggle_trade_confirm', { tradeId: activeTrade.tradeId, role: activeTrade.role })}
                     className={"w-full py-3 rounded-lg font-bold transition-colors " + ((activeTrade.role === 'p1' ? activeTrade.p1Confirm : activeTrade.p2Confirm) ? 'bg-emerald-600 text-white' : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600')}>
                     {(activeTrade.role === 'p1' ? activeTrade.p1Confirm : activeTrade.p2Confirm) ? 'Ready' : 'Click to Confirm'}
                   </button>
                </div>
                
                {/* Their Side */}
                <div className={"p-4 rounded-xl border " + ((activeTrade.role === 'p1' ? activeTrade.p2Confirm : activeTrade.p1Confirm) ? 'border-emerald-500 bg-emerald-900/10' : 'border-neutral-700 bg-neutral-800')}>
                   <h4 className="text-white font-bold mb-4">{activeTrade.peerName}</h4>
                   <div className="grid grid-cols-3 gap-2 mb-4">
                      {(activeTrade.role === 'p1' ? activeTrade.p2Items : activeTrade.p1Items).map((slot: InventorySlot, i: number) => (
                        <div key={i} className="w-16 h-16 bg-black/40 rounded border border-neutral-600 flex items-center justify-center relative">
                          {slot && renderBlockIcon(slot)}
                          {slot && slot.count > 1 && <span className="absolute bottom-1 right-1 text-[10px] font-bold text-white bg-black/50 px-1 rounded">{slot.count}</span>}
                        </div>
                      ))}
                   </div>
                   <div className={"w-full py-3 rounded-lg font-bold text-center " + ((activeTrade.role === 'p1' ? activeTrade.p2Confirm : activeTrade.p1Confirm) ? 'bg-emerald-900/50 text-emerald-400' : 'bg-neutral-900 text-neutral-500')}>
                     {(activeTrade.role === 'p1' ? activeTrade.p2Confirm : activeTrade.p1Confirm) ? 'Ready' : 'Waiting...'}
                   </div>
                </div>
              </div>
              
              {/* My Inventory to drag from */}
              <div className="mt-8 border-t border-neutral-700 pt-6">
                 <h4 className="text-neutral-400 font-bold mb-4 text-sm">Your Inventory</h4>
                 <div className="grid grid-cols-9 gap-1">
                    {backpack.map((slot, i) => (
                      <div key={'tbp'+i} 
                         onClick={() => handleSlotClick('backpack', i)}
                         className="w-12 h-12 bg-black/40 rounded border border-neutral-700 flex items-center justify-center relative hover:bg-white/5">
                        {slot && renderBlockIcon(slot)}
                        {slot && slot.count > 1 && <span className="absolute bottom-0.5 right-0.5 text-[9px] font-bold text-white bg-black/50 px-1 rounded">{slot.count}</span>}
                      </div>
                    ))}
                 </div>
              </div>
            </div>
            
            {/* Custom Cursor Item for Trade Window */}
            {cursorItem && (
               <div className="fixed pointer-events-none z-[70] w-12 h-12" style={{ left: mousePos.x - 24, top: mousePos.y - 24 }}>
                  {renderBlockIcon(cursorItem)}
                  {cursorItem.count > 1 && <span className="absolute bottom-0 right-0 text-xs font-bold text-white bg-black/60 px-1 rounded">{cursorItem.count}</span>}
               </div>
            )}
          </div>
      )}
`;

code = code.replace(/\{merchantOpen && \(/, tradeUI + "\n      {merchantOpen && (");

fs.writeFileSync('src/App.tsx', code);
