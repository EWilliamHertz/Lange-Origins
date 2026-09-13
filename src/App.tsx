import React, { useState, useEffect, useRef } from 'react';
import { BlockType, BlockColors, BlockNames } from './lib/constants';
import { getBlockIcon } from './lib/icons';
import GameCanvas from './components/GameCanvas';
import LandingPage from './components/LandingPage';
import { Heart, MessageSquare, ArrowRight, Hand, LogOut, User, Star, Clock, Globe, Scroll, X, Book, Shield } from 'lucide-react';
import { checkRecipe, RECIPES } from './lib/crafting';
import { Sounds } from './lib/audio';
import { auth, logout } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Socket } from 'socket.io-client';

export default function App() {
  const [appState, setAppState] = useState<'landing' | 'serverBrowser' | 'playing'>('landing');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        if (appState === 'landing') {
          setAppState('serverBrowser');
        }
      } else {
        setCurrentUser(null);
        setAppState('landing');
      }
    });
    return () => unsubscribe();
  }, [appState]);

  const [serverName, setServerName] = useState<string>('');
  const [joinInput, setJoinInput] = useState<string>('public-lobby');
  const [showInstructions, setShowInstructions] = useState<boolean>(true);

  // New Inventory Slot Type
  type InventorySlot = { type: BlockType; count: number } | null;

  const [hotbar, setHotbar] = useState<InventorySlot[]>([
    { type: BlockType.Fists, count: 1 }, 
    { type: BlockType.WoodPickaxe, count: 1 }, 
    { type: BlockType.Platform, count: 10 }, 
    { type: BlockType.Chest, count: 1 }, 
    null, null, null, null, null
  ]);
  const [backpack, setBackpack] = useState<InventorySlot[]>(() => {
    return Array(27).fill(null);
  });
  
  const [craftingGrid, setCraftingGrid] = useState<InventorySlot[]>(Array(9).fill(null));
  const [craftingResult, setCraftingResult] = useState<{result: BlockType, count: number} | null>(null);

  useEffect(() => {
    // We map to BlockType | null for the crafting system
    const mappedGrid = craftingGrid.map(slot => slot ? slot.type : null);
    setCraftingResult(checkRecipe(mappedGrid));
  }, [craftingGrid]);
  
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [inventoryTab, setInventoryTab] = useState<'crafting' | 'guide'>('crafting');
  const [furnaceOpen, setFurnaceOpen] = useState(false);
  const [chestOpen, setChestOpen] = useState(false);
  const [activeChestCoords, setActiveChestCoords] = useState<{tx: number, ty: number} | null>(null);
  const [chestInventory, setChestInventory] = useState<InventorySlot[]>(() => Array(27).fill(null));
  const socketRef = useRef<Socket | null>(null);
  const [furnaceInput, setFurnaceInput] = useState<InventorySlot>(null);
  const [furnaceFuel, setFurnaceFuel] = useState<InventorySlot>(null);
  const [furnaceOutput, setFurnaceOutput] = useState<InventorySlot>(null);
  const [cursorItem, setCursorItem] = useState<InventorySlot>(null);
  
  const [health, setHealth] = useState(10);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{sender: string, text: string}[]>([]);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const [sendChatMsg, setSendChatMsg] = useState<{text: string, timestamp: number} | null>(null);
  
  const selectedBlock = hotbar[selectedSlotIndex] ? hotbar[selectedSlotIndex]!.type : BlockType.Air;

  // Mouse tracking for cursor item
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredTitle, setHoveredTitle] = useState<string | null>(null);

  useEffect(() => {
    const updateMouse = (e: PointerEvent) => {
       setMousePos({ x: e.clientX, y: e.clientY });
       const target = e.target as HTMLElement;
       const titleAttr = target.closest('[data-tooltip]')?.getAttribute('data-tooltip');
       setHoveredTitle(titleAttr || null);
    };
    window.addEventListener('pointermove', updateMouse);
    return () => window.removeEventListener('pointermove', updateMouse);
  }, []);

  // Fetch public servers when browser is open
  const [publicServers, setPublicServers] = useState<{id: string, players: number}[]>([]);
  const [recentServers, setRecentServers] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('recentServers') || '[]'); } catch { return []; }
  });
  const [favoriteServers, setFavoriteServers] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('favoriteServers') || '[]'); } catch { return []; }
  });

  type Quest = {
    id: string;
    title: string;
    description: string;
    goal: number;
    current: number;
    completed: boolean;
    rewardText: string;
    prerequisiteId?: string;
  };

  const [quests, setQuests] = useState<Quest[]>([
    { id: 'q1', title: 'Getting Started', description: 'Mine 5 blocks of Dirt.', goal: 5, current: 0, completed: false, rewardText: 'Knowledge of the world.' },
    { id: 'q2', title: 'Wood Gatherer', description: 'Mine 5 blocks of Wood.', goal: 5, current: 0, completed: false, rewardText: 'Resourcefulness.', prerequisiteId: 'q1' },
    { id: 'q3', title: 'First Tools', description: 'Craft a Wood Pickaxe.', goal: 1, current: 0, completed: false, rewardText: 'Efficiency.', prerequisiteId: 'q2' },
    { id: 'q4', title: 'Upgrade Time', description: 'Craft an Iron Pickaxe.', goal: 1, current: 0, completed: false, rewardText: 'A sturdy tool.', prerequisiteId: 'q3' },
    { id: 'q5', title: 'Deep Delver', description: 'Reach a depth of 30 blocks.', goal: 1, current: 0, completed: false, rewardText: 'Bravery.', prerequisiteId: 'q4' }
  ]);
  const [questLogOpen, setQuestLogOpen] = useState(false);
  const [showNPCMessage, setShowNPCMessage] = useState(false);

  useEffect(() => {
    if (appState === 'serverBrowser') {
      fetch('/api/servers').then(r => r.json()).then(data => {
        if (data && data.servers) setPublicServers(data.servers);
      }).catch(console.error);
    }
  }, [appState]);

  const joinServer = (name: string) => {
    if (!name.trim()) return;
    const srv = name.trim();
    
    setRecentServers(prev => {
      const next = [srv, ...prev.filter(s => s !== srv)].slice(0, 5);
      localStorage.setItem('recentServers', JSON.stringify(next));
      return next;
    });

    setServerName(srv);
    setAppState('playing');
  };

  const toggleFavorite = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteServers(prev => {
      const next = prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name];
      localStorage.setItem('favoriteServers', JSON.stringify(next));
      return next;
    });
  };

  const handleSmelt = () => {
    if (furnaceFuel === BlockType.Coal) {
      let output: BlockType | null = null;
      if (furnaceInput === BlockType.IronOre) output = BlockType.IronIngot;
      if (furnaceInput === BlockType.GoldOre) output = BlockType.GoldIngot;
      if (furnaceInput === BlockType.DiamondOre) output = BlockType.Diamond;
      
      if (output) {
        setFurnaceInput(null);
        setFurnaceFuel(null);
        setFurnaceOutput(output);
      }
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on('chest_data', (data: {tx: number, ty: number, inventory: InventorySlot[]}) => {
        setChestInventory(data.inventory || Array(27).fill(null));
        setActiveChestCoords({tx: data.tx, ty: data.ty});
        setChestOpen(true);
      });
      socketRef.current.on('chest_updated', (data: {tx: number, ty: number, inventory: InventorySlot[]}) => {
        if (activeChestCoords?.tx === data.tx && activeChestCoords?.ty === data.ty) {
          setChestInventory(data.inventory);
        }
      });
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('chest_data');
        socketRef.current.off('chest_updated');
      }
    };
  }, [activeChestCoords]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (appState !== 'playing') return;
      
      if (isChatOpen) {
        if (e.key === 'Escape') {
          setIsChatOpen(false);
        }
        return; // Disable other game keys while chatting
      }

      if (e.key === 'Enter') {
        setIsChatOpen(true);
        setTimeout(() => chatInputRef.current?.focus(), 50);
        return;
      }
      
      if (e.key.toLowerCase() === 'e') {
        if (furnaceOpen) {
          setFurnaceOpen(false);
          setCursorItem(null);
          return;
        }
        if (chestOpen) {
          setChestOpen(false);
          setActiveChestCoords(null);
          setCursorItem(null);
          return;
        }
        setInventoryOpen(prev => {
          if (prev) setCursorItem(null); 
          return !prev;
        });
        return;
      }
      
      if (e.key === 'Escape') {
        if (furnaceOpen) {
          setFurnaceOpen(false);
          setCursorItem(null);
          return;
        }
        if (chestOpen) {
          setChestOpen(false);
          setActiveChestCoords(null);
          setCursorItem(null);
          return;
        }
        if (inventoryOpen) {
          setInventoryOpen(false);
          setCursorItem(null);
          return;
        }
        if (questLogOpen) {
          setQuestLogOpen(false);
          return;
        }
        if (showNPCMessage) {
          setShowNPCMessage(false);
          return;
        }
      }

      if (e.key.toLowerCase() === 'q') {
        if (!inventoryOpen && !furnaceOpen && !isChatOpen) {
          setQuestLogOpen(prev => !prev);
        }
        return;
      }

      if (!inventoryOpen && !furnaceOpen && !questLogOpen && !showNPCMessage) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9) {
          setSelectedSlotIndex(num - 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appState, inventoryOpen, furnaceOpen, isChatOpen]);

  const handleChatSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (chatInputRef.current && chatInputRef.current.value.trim()) {
      const text = chatInputRef.current.value.trim();
      setSendChatMsg({ text, timestamp: Date.now() });
      chatInputRef.current.value = '';
    }
    setIsChatOpen(false);
  };

  const handleSlotClick = (type: 'hotbar' | 'backpack' | 'crafting' | 'craftingResult' | 'furnaceInput' | 'furnaceFuel' | 'furnaceOutput' | 'chest', index: number) => {
    
    // Helper to merge stacks
    const tryMerge = (target: InventorySlot, source: InventorySlot): { remainingTarget: InventorySlot, remainingSource: InventorySlot } => {
      if (!source && !target) return { remainingTarget: null, remainingSource: null };
      if (!source) return { remainingTarget: null, remainingSource: target };
      if (!target) return { remainingTarget: source, remainingSource: null };
      
      const isEquipable = target.type >= 100;
      if (target.type === source.type && !isEquipable) {
        const spaceLeft = 64 - target.count;
        if (spaceLeft > 0) {
          const amountToMove = Math.min(spaceLeft, source.count);
          const newTarget = { ...target, count: target.count + amountToMove };
          const newSourceCount = source.count - amountToMove;
          return {
            remainingTarget: newTarget,
            remainingSource: newSourceCount > 0 ? { ...source, count: newSourceCount } : null
          };
        }
      }
      
      // Swap if unable to merge
      return { remainingTarget: source, remainingSource: target };
    };

    if (type === 'craftingResult') {
      if (craftingResult && (!cursorItem || (cursorItem.type === craftingResult.result && cursorItem.type < 100 && cursorItem.count + craftingResult.count <= 64))) {
        
        if (!cursorItem) {
          setCursorItem({ type: craftingResult.result, count: craftingResult.count });
        } else {
          setCursorItem({ type: cursorItem.type, count: cursorItem.count + craftingResult.count });
        }
        
        if (craftingResult.result === BlockType.IronPickaxe) {
           setQuests(prev => prev.map(q => {
             if (q.id === 'q4' && !q.completed && q.prerequisiteId && prev.find(p => p.id === q.prerequisiteId)?.completed) {
               return { ...q, current: 1, completed: true };
             }
             return q;
           }));
        }
        if (craftingResult.result === BlockType.WoodPickaxe) {
           setQuests(prev => prev.map(q => {
             if (q.id === 'q3' && !q.completed && q.prerequisiteId && prev.find(p => p.id === q.prerequisiteId)?.completed) {
               return { ...q, current: 1, completed: true };
             }
             return q;
           }));
        }

        const newCraftingGrid = [...craftingGrid];
        for (let i = 0; i < 9; i++) {
          if (newCraftingGrid[i]) {
            const count = newCraftingGrid[i]!.count - 1;
            if (count > 0) {
              newCraftingGrid[i] = { ...newCraftingGrid[i]!, count };
            } else {
              newCraftingGrid[i] = null;
            }
          }
        }
        setCraftingGrid(newCraftingGrid);
      }
      return;
    }
    
    if (type === 'furnaceOutput') {
      if (furnaceOutput) {
         const { remainingTarget, remainingSource } = tryMerge(cursorItem, furnaceOutput);
         setCursorItem(remainingTarget);
         setFurnaceOutput(remainingSource);
      }
      return;
    }

    if (type === 'furnaceInput') {
       const { remainingTarget, remainingSource } = tryMerge(furnaceInput, cursorItem);
       setFurnaceInput(remainingTarget);
       setCursorItem(remainingSource);
       return;
    }

    if (type === 'furnaceFuel') {
       const { remainingTarget, remainingSource } = tryMerge(furnaceFuel, cursorItem);
       setFurnaceFuel(remainingTarget);
       setCursorItem(remainingSource);
       return;
    }

    if (type === 'chest') {
      const targetArray = [...chestInventory];
      const { remainingTarget, remainingSource } = tryMerge(targetArray[index], cursorItem);
      targetArray[index] = remainingTarget;
      setCursorItem(remainingSource);
      setChestInventory(targetArray);
      
      if (socketRef.current && activeChestCoords) {
        socketRef.current.emit('update_chest', { tx: activeChestCoords.tx, ty: activeChestCoords.ty, inventory: targetArray });
      }
      return;
    }

    let targetArray = type === 'hotbar' ? [...hotbar] : type === 'backpack' ? [...backpack] : [...craftingGrid];

    const { remainingTarget, remainingSource } = tryMerge(targetArray[index], cursorItem);
    targetArray[index] = remainingTarget;
    setCursorItem(remainingSource);

    if (type === 'hotbar') setHotbar(targetArray);
    else if (type === 'backpack') setBackpack(targetArray);
    else setCraftingGrid(targetArray);
  };

  const renderBlockIcon = (slot: InventorySlot | BlockType | null) => {
    if (slot === null) return null;
    
    // Normalize to handle both raw BlockType (from crafting recipes) and InventorySlot (from state)
    let type: BlockType;
    let count: number = 1;
    
    if (typeof slot === 'number') {
       type = slot;
    } else {
       if (slot.type === 0) return null; // Air
       type = slot.type;
       count = slot.count;
    }
    
    if (type === 0) return null; // Empty slot
    
    const title = BlockNames[type] || 'Item';
    if (type === BlockType.Fists) return <Hand data-tooltip={title} className="w-full h-full text-amber-200 p-1 drop-shadow-md" fill="currentColor" />;
    
    const isEquipable = type >= 100;
    
    const icon = getBlockIcon(type, "w-full h-full p-1 drop-shadow-md");
    
    return (
      <div 
        data-tooltip={title}
        className="w-full h-full rounded-sm shadow-sm relative group pointer-events-auto flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: icon ? 'transparent' : BlockColors[type] }}
      >
         {icon ? icon : (
           <>
             {type === BlockType.Grass && (
               <div className="w-full h-1/4 bg-[#4CAF50] pointer-events-none" />
             )}
             {type === BlockType.Chest && (
               <div className="absolute inset-1 border border-[#3E2723] rounded-[1px] pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-2 bg-[#9E9E9E]" />
               </div>
             )}
             {type !== BlockType.Leaves && type !== BlockType.Glass && type !== BlockType.Lava && (
               <div className="w-full h-full border border-black/20 pointer-events-none" />
             )}
           </>
         )}
         
         {/* Item Stack Count */}
         {!isEquipable && count > 1 && (
           <span className="absolute -bottom-1 -right-1 text-[10px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)] pointer-events-none bg-black/40 px-1 rounded-sm">
             {count}
           </span>
         )}
      </div>
    );
  };

  if (appState === 'landing') {
    return (
      <LandingPage 
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setAppState('serverBrowser');
        }}
      />
    );
  }

  if (appState === 'serverBrowser') {
    const isAdmin = currentUser && (currentUser.email === 'ewilliamhe@gmail.com' || currentUser.email === 'zudran@gmail.com');

    const handleAdminClick = async (action: string) => {
      if (!currentUser) return;
      
      try {
        if (action === 'Wipe World Data') {
          if (!window.confirm('Are you sure you want to wipe the public lobby world? This cannot be undone.')) return;
          
          const res = await fetch('/api/admin/wipe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUser.email, roomId: 'public-lobby' })
          });
          const data = await res.json();
          if (data.success) {
            alert('World wiped successfully!');
          } else {
            alert('Failed to wipe world: ' + data.error);
          }
        } else if (action === 'Manage Players') {
          const res = await fetch('/api/admin/players', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUser.email })
          });
          const data = await res.json();
          if (data.players && data.players.length > 0) {
            const playerList = data.players.map((p: any) => `Room: ${p.roomId} | ID: ${p.id}`).join('\\n');
            const toKick = window.prompt(`Connected Players:\\n${playerList}\\n\\nEnter ID to kick:`);
            if (toKick) {
              const kickRes = await fetch('/api/admin/kick', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ email: currentUser.email, playerId: toKick })
              });
              const kickData = await kickRes.json();
              if (kickData.success) alert('Player kicked.');
              else alert('Failed to kick: ' + kickData.error);
            }
          } else {
            alert('No players currently connected.');
          }
        } else {
          alert(`Admin action: [${action}] is not implemented in the preview yet.`);
        }
      } catch (err) {
        console.error(err);
        alert('Admin action failed. Check console.');
      }
    };

    return (
      <div className="w-full h-screen bg-[#0A0A0B] flex flex-col items-center justify-center font-sans relative overflow-hidden">
        {/* Deep immersive background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0B] via-[#111115] to-[#0A0A0B]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.05),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(16,185,129,0.03),transparent_50%)]"></div>
        <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        
        {/* Top Right Profile */}
        {currentUser && (
          <div className="absolute top-6 right-6 z-20 flex items-center gap-4 bg-[#141417]/80 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/5 shadow-2xl">
             <img src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.displayName}`} alt="avatar" className="w-9 h-9 rounded-full ring-2 ring-neutral-800" />
             <span className="text-neutral-300 font-medium text-sm hidden md:block">{currentUser.displayName}</span>
             <div className="w-px h-4 bg-neutral-800 mx-1 hidden md:block"></div>
             <button 
               onClick={() => logout()}
               className="text-neutral-500 hover:text-white transition-colors flex items-center gap-2"
               title="Log out"
             >
               <span className="text-xs uppercase tracking-wider font-bold hidden md:block">Sign out</span>
               <LogOut size={16} />
             </button>
          </div>
        )}

        <div className="bg-[#141417]/60 backdrop-blur-3xl p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-white/5 flex flex-col w-full max-w-5xl z-10 max-h-[85vh] overflow-hidden">
          <div className="flex items-center gap-5 mb-2">
             <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-inner">
                <Globe className="w-7 h-7 text-blue-400" />
             </div>
             <div>
               <h1 className="text-4xl font-black text-white tracking-tight">World Browser</h1>
               <p className="text-neutral-400 text-sm mt-1.5 font-medium">Connect to public realms or dive into your private universe.</p>
             </div>
          </div>
          
          <div className="flex gap-4 mt-10 mb-10">
            <div className="relative flex-1">
              <input 
                type="text" 
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value)}
                className="w-full bg-[#0A0A0B]/80 border border-neutral-800 text-neutral-200 rounded-2xl pl-12 pr-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-neutral-700 transition-all shadow-inner text-lg placeholder-neutral-600"
                placeholder="Enter Private Server ID..."
                onKeyDown={(e) => e.key === 'Enter' && joinServer(joinInput)}
              />
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 w-5 h-5" />
            </div>
            <button 
              onClick={() => { Sounds.click(); joinServer(joinInput); }}
              className="bg-neutral-100 hover:bg-white text-neutral-900 font-bold py-4 px-8 rounded-2xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] active:scale-[0.98] flex items-center gap-3"
            >
              Join Private <ArrowRight size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-4 space-y-10 custom-scrollbar">
            
            {favoriteServers.length > 0 && (
              <section>
                <h3 className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                   <Star className="w-3.5 h-3.5 text-amber-500"/> Favourites
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favoriteServers.map(srv => (
                    <div key={'fav_'+srv} onClick={() => joinServer(srv)} className="group cursor-pointer bg-[#1A1A1F]/50 hover:bg-[#202026] border border-neutral-800 hover:border-neutral-600 rounded-2xl p-5 transition-all relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/0 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex justify-between items-start mb-4 relative">
                        <h4 className="text-neutral-200 font-bold text-lg truncate pr-6">{srv === 'public-lobby' ? 'Public Realm Alpha' : srv}</h4>
                        <button onClick={(e) => toggleFavorite(srv, e)} className="absolute top-0 right-0 text-amber-500 hover:text-amber-400 transition-colors p-1"><Star size={18} fill="currentColor" /></button>
                      </div>
                      <div className="flex items-center justify-between text-neutral-500 text-sm font-medium relative">
                        <span className="flex items-center gap-1.5"><Globe size={14}/> Active</span>
                        <span className="text-amber-500/80 text-xs font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform">Connect →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {recentServers.length > 0 && (
              <section>
                <h3 className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                   <Clock className="w-3.5 h-3.5 text-blue-400"/> Recently Played
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentServers.map(srv => (
                    <div key={'rec_'+srv} onClick={() => joinServer(srv)} className="group cursor-pointer bg-[#1A1A1F]/50 hover:bg-[#202026] border border-neutral-800 hover:border-neutral-600 rounded-2xl p-5 transition-all relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex justify-between items-start mb-4 relative">
                        <h4 className="text-neutral-200 font-bold text-lg truncate pr-6">{srv === 'public-lobby' ? 'Public Realm Alpha' : srv}</h4>
                        <button onClick={(e) => toggleFavorite(srv, e)} className="absolute top-0 right-0 text-neutral-600 hover:text-amber-500 transition-colors p-1"><Star size={18} /></button>
                      </div>
                      <div className="flex items-center justify-between text-neutral-500 text-sm font-medium relative">
                        <span className="flex items-center gap-1.5"><Globe size={14}/> Active</span>
                        <span className="text-blue-400/80 text-xs font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform">Connect →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h3 className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                 <Globe className="w-3.5 h-3.5 text-emerald-500"/> Active Public Servers
              </h3>
              {publicServers.length === 0 ? (
                <div className="text-neutral-500 text-sm p-8 bg-[#1A1A1F]/30 rounded-2xl border border-neutral-800 text-center font-medium">
                  Scanning for active public realms...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {publicServers.map(srv => (
                    <div key={'pub_'+srv.id} onClick={() => joinServer(srv.id)} className="group cursor-pointer bg-[#1A1A1F]/50 hover:bg-[#202026] border border-neutral-800 hover:border-emerald-600/50 rounded-2xl p-5 transition-all relative overflow-hidden shadow-sm hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex justify-between items-start mb-4 relative">
                        <h4 className="text-neutral-200 font-bold text-lg truncate pr-6">{srv.id === 'public-lobby' ? 'Public Realm Alpha' : srv.id}</h4>
                        <button onClick={(e) => toggleFavorite(srv.id, e)} className="absolute top-0 right-0 text-neutral-600 hover:text-amber-500 transition-colors p-1">
                          <Star size={18} fill={favoriteServers.includes(srv.id) ? "currentColor" : "none"} className={favoriteServers.includes(srv.id) ? "text-amber-500" : ""} />
                        </button>
                      </div>
                      <div className="flex justify-between items-center relative">
                        <span className="flex items-center gap-2 text-emerald-400 text-sm font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                           {srv.players} Players
                        </span>
                        <span className="text-emerald-500/80 text-xs font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform">Connect →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {isAdmin && (
              <section className="border border-red-500/20 bg-[#1A1111]/80 rounded-2xl p-6 mt-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50"></div>
                <h3 className="text-red-400 text-[10px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                   <Shield className="w-4 h-4 text-red-500"/> Admin Terminal
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button onClick={() => handleAdminClick('Manage Players')} className="bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-red-200 font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                    Manage Players
                  </button>
                  <button onClick={() => handleAdminClick('Server Configuration')} className="bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-red-200 font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                    Server Config
                  </button>
                  <button onClick={() => handleAdminClick('Wipe World Data')} className="bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-red-200 font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                    Wipe World Data
                  </button>
                </div>
              </section>
            )}

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-neutral-900 flex flex-col overflow-hidden font-sans select-none touch-none" style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}>
      
      {/* Main Game Area */}
      <div className="flex-1 relative">
        <GameCanvas 
          selectedBlock={selectedBlock} 
          roomId={serverName} 
          isInventoryOpen={inventoryOpen || showInstructions || furnaceOpen || chestOpen}
          onHealthChange={setHealth}
          sendChatMsg={sendChatMsg}
          onChatMessage={(msg) => setChatMessages(prev => [...prev.slice(-9), msg])}
          socketRef={socketRef}
          onBlockPlaced={(blockType) => {
            Sounds.placeBlock();
            // Deduct the placed block from hotbar at selectedSlotIndex
            setHotbar(prev => {
              const next = [...prev];
              const slot = next[selectedSlotIndex];
              if (slot && slot.type === blockType) {
                const count = slot.count - 1;
                next[selectedSlotIndex] = count > 0 ? { ...slot, count } : null;
              }
              return next;
            });
          }}
          onBlockMined={(blockType) => {
            Sounds.mineBlock();
            // Update quests
            if (blockType === BlockType.Dirt) {
               setQuests(prev => prev.map(q => {
                 if (q.id === 'q1' && !q.completed) {
                   const newCount = q.current + 1;
                   return { ...q, current: newCount, completed: newCount >= q.goal };
                 }
                 return q;
               }));
            }
            if (blockType === BlockType.Wood) {
               setQuests(prev => prev.map(q => {
                 if (q.id === 'q2' && !q.completed && q.prerequisiteId && prev.find(p => p.id === q.prerequisiteId)?.completed) {
                   const newCount = q.current + 1;
                   return { ...q, current: newCount, completed: newCount >= q.goal };
                 }
                 return q;
               }));
            }

            const isEquipable = blockType >= 100;
            let added = false;
            
            // 1. Try to stack in hotbar
            setHotbar(prev => {
               const newHotbar = [...prev];
               if (!isEquipable) {
                 for (let i = 0; i < newHotbar.length; i++) {
                   if (newHotbar[i] && newHotbar[i]!.type === blockType && newHotbar[i]!.count < 64) {
                     newHotbar[i] = { ...newHotbar[i]!, count: newHotbar[i]!.count + 1 };
                     added = true;
                     return newHotbar;
                   }
                 }
               }
               // Try empty hotbar slot
               const emptyIdx = newHotbar.indexOf(null);
               if (emptyIdx !== -1) {
                 newHotbar[emptyIdx] = { type: blockType, count: 1 };
                 added = true;
               }
               return newHotbar;
            });

            if (added) return;

            // 2. Try to stack in backpack
            setBackpack(prev => {
               const newBp = [...prev];
               if (!isEquipable) {
                 for (let i = 0; i < newBp.length; i++) {
                   if (newBp[i] && newBp[i]!.type === blockType && newBp[i]!.count < 64) {
                     newBp[i] = { ...newBp[i]!, count: newBp[i]!.count + 1 };
                     added = true;
                     return newBp;
                   }
                 }
               }
               // Try empty backpack slot
               const emptyIdx = newBp.indexOf(null);
               if (emptyIdx !== -1) {
                 newBp[emptyIdx] = { type: blockType, count: 1 };
                 added = true;
               }
               return newBp;
            });
          }}
          onInteract={(blockType, tx, ty) => {
            if (blockType === BlockType.Furnace) {
              setFurnaceOpen(true);
            }
            if (blockType === BlockType.Chest) {
              if (socketRef.current) {
                socketRef.current.emit('open_chest', { tx, ty });
              }
            }
            if (blockType === BlockType.QuestNPC) {
              setShowNPCMessage(true);
            }
            if (blockType === BlockType.CarrotSeed) {
              // Consume seed
              // Helper to decrement a seed stack
              const consumeSeed = (inv: InventorySlot[]) => {
                 for (let i = 0; i < inv.length; i++) {
                   if (inv[i] && inv[i]!.type === BlockType.CarrotSeed) {
                     const newCount = inv[i]!.count - 1;
                     inv[i] = newCount > 0 ? { ...inv[i]!, count: newCount } : null;
                     return true; // Successfully consumed
                   }
                 }
                 return false;
              };

              let consumed = false;
              setHotbar(prev => {
                const next = [...prev];
                if (consumeSeed(next)) consumed = true;
                return next;
              });
              
              if (!consumed) {
                setBackpack(prev => {
                  const next = [...prev];
                  consumeSeed(next);
                  return next;
                });
              }
            }
          }}
          onDepthChange={(depth) => {
            setQuests(prev => prev.map(q => {
              if (q.id === 'q5' && !q.completed && depth >= 30 && q.prerequisiteId && prev.find(p => p.id === q.prerequisiteId)?.completed) {
                return { ...q, current: 1, completed: true };
              }
              return q;
            }));
          }}
        />
        
        {/* UI Overlay - Top Left */}
        <div className="absolute top-4 left-4 bg-black/50 text-white px-4 py-2 rounded-lg pointer-events-none text-sm border border-white/10">
          Playing on server: <span className="font-bold text-blue-400">{serverName}</span>
        </div>

        {/* Health Bar */}
        <div className="absolute top-4 right-4 flex gap-0.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Heart 
              key={i} 
              className={`w-6 h-6 ${i < health ? 'fill-red-500 text-red-500' : 'fill-transparent text-neutral-500 stroke-neutral-500 stroke-2'}`} 
            />
          ))}
        </div>

        {/* Chat System */}
        <div className="absolute bottom-24 left-4 w-72 z-10 flex flex-col justify-end pointer-events-none">
           <div className="flex flex-col gap-1 mb-2 max-h-48 overflow-y-auto">
             {chatMessages.map((msg, idx) => (
               <div key={idx} className="bg-black/40 text-white text-sm px-2 py-1 rounded w-fit break-all">
                 <span className="opacity-50 text-xs mr-2">{msg.sender.substring(0,4)}:</span>
                 {msg.text}
               </div>
             ))}
           </div>
           
           {isChatOpen && (
             <form onSubmit={handleChatSubmit} className="pointer-events-auto bg-black/60 p-2 rounded flex items-center shadow-lg">
               <MessageSquare size={16} className="text-white/50 mr-2 shrink-0" />
               <input 
                 ref={chatInputRef}
                 type="text" 
                 className="bg-transparent text-white outline-none w-full text-sm"
                 placeholder="Say something... (Enter)"
                 onBlur={() => setIsChatOpen(false)}
                 maxLength={100}
               />
             </form>
           )}
           {!isChatOpen && (
             <div className="text-white/30 text-xs ml-1 flex items-center drop-shadow-md">
               <MessageSquare size={12} className="mr-1" /> Press Enter to chat
             </div>
           )}
        </div>
        
        {/* UI Overlay - Hotbar */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-1 p-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl">
          {hotbar.map((slot, index) => {
            const isSelected = selectedSlotIndex === index && !inventoryOpen;
            return (
              <button
                key={index}
                onClick={() => {
                  if (inventoryOpen) handleSlotClick('hotbar', index);
                  else setSelectedSlotIndex(index);
                }}
                className={`w-12 h-12 p-1.5 rounded-lg relative transition-all duration-200 ${
                  isSelected 
                    ? 'ring-2 ring-white scale-110 bg-white/20 z-10' 
                    : 'hover:bg-white/10 opacity-70 hover:opacity-100 bg-black/50'
                }`}
              >
                {renderBlockIcon(slot)}
                
                {/* Number Key Indicator */}
                {!inventoryOpen && (
                  <span className="absolute top-1 left-1.5 text-[10px] font-bold text-white/80 drop-shadow-md">
                    {index + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Inventory Modal Overlay */}
        {inventoryOpen && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40">
            <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-hidden">
              
              <div className="flex gap-4 border-b border-neutral-700 pb-2">
                <button 
                  onClick={() => setInventoryTab('crafting')}
                  className={`text-lg font-bold px-4 py-2 rounded-t-lg transition-colors ${inventoryTab === 'crafting' ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-white'}`}
                >
                  Inventory & Crafting
                </button>
                <button 
                  onClick={() => setInventoryTab('guide')}
                  className={`text-lg font-bold px-4 py-2 rounded-t-lg transition-colors flex items-center gap-2 ${inventoryTab === 'guide' ? 'bg-blue-900/50 text-blue-400' : 'text-neutral-500 hover:text-white'}`}
                >
                  <Book size={20} /> Recipe Guide
                </button>
              </div>

              {inventoryTab === 'crafting' ? (
                <>
                  <div className="flex gap-8">
                    {/* Crafting Grid */}
                    <div>
                      <h3 className="text-white font-bold mb-3">Crafting</h3>
                      <div className="flex items-center gap-4 bg-neutral-900 p-4 rounded-lg border border-neutral-700">
                        <div className="grid grid-cols-3 gap-1">
                          {craftingGrid.map((slot, i) => (
                            <button
                              key={i}
                              onPointerDown={() => { if (!cursorItem) handleSlotClick('crafting', i); }} onPointerUp={() => { if (cursorItem) handleSlotClick('crafting', i); }}
                              className="w-12 h-12 p-1.5 bg-black/50 rounded-md hover:bg-white/10 transition-colors"
                            >
                              {renderBlockIcon(slot)}
                            </button>
                          ))}
                        </div>
                        <ArrowRight className="text-neutral-500 w-8 h-8" />
                        <button
                          onPointerDown={() => { if (!cursorItem) handleSlotClick('craftingResult', 0); }} onPointerUp={() => { if (cursorItem) handleSlotClick('craftingResult', 0); }}
                          className="w-16 h-16 p-2 bg-black/50 rounded-lg border border-neutral-600 hover:bg-white/10 transition-colors"
                        >
                          {craftingResult ? renderBlockIcon(craftingResult.result) : null}
                        </button>
                      </div>
                    </div>

                    {/* Backpack Grid */}
                    <div>
                      <h3 className="text-white font-bold mb-3">Inventory</h3>
                      <div className="grid grid-cols-9 gap-1 bg-neutral-900 p-2 rounded-lg border border-neutral-700 h-fit">
                        {backpack.map((slot, i) => (
                          <button
                            key={i}
                            onPointerDown={() => { if (!cursorItem) handleSlotClick('backpack', i); }} onPointerUp={() => { if (cursorItem) handleSlotClick('backpack', i); }}
                            className="w-12 h-12 p-1.5 bg-black/50 rounded-md hover:bg-white/10 transition-colors"
                          >
                            {renderBlockIcon(slot)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Hotbar Grid (in Modal) */}
                  <div>
                    <h3 className="text-white font-bold mb-3">Hotbar</h3>
                    <div className="grid grid-cols-9 gap-1 bg-neutral-900 p-2 rounded-lg border border-neutral-700">
                      {hotbar.map((slot, i) => (
                        <button
                          key={i}
                          onPointerDown={() => { if (!cursorItem) handleSlotClick('hotbar', i); }} onPointerUp={() => { if (cursorItem) handleSlotClick('hotbar', i); }}
                          className="w-12 h-12 p-1.5 bg-black/50 rounded-md hover:bg-white/10 transition-colors relative"
                        >
                          {renderBlockIcon(slot)}
                          <span className="absolute top-1 left-1.5 text-[10px] font-bold text-white/80 drop-shadow-md">
                            {i + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="overflow-y-auto custom-scrollbar pr-2 flex-1 min-h-[300px]">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {RECIPES.map((recipe, index) => (
                       <div key={index} className="bg-neutral-900 border border-neutral-700 p-4 rounded-xl flex items-center gap-6">
                         <div className="grid grid-cols-3 gap-1">
                           {recipe.pattern.map((bt, i) => (
                             <div key={i} className="w-8 h-8 p-1 bg-black/50 rounded flex items-center justify-center">
                               {renderBlockIcon(bt)}
                             </div>
                           ))}
                         </div>
                         <ArrowRight className="text-neutral-500 w-6 h-6" />
                         <div className="w-12 h-12 p-1.5 bg-black/50 rounded-lg border border-neutral-600 flex items-center justify-center">
                           {renderBlockIcon(recipe.result)}
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* NPC Dialogue Overlay */}
        {showNPCMessage && (
          <div className="absolute inset-x-0 bottom-24 flex justify-center z-40 pointer-events-none">
            <div className="bg-black/80 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-2xl flex items-start gap-4 w-full max-w-2xl pointer-events-auto">
               <div className="w-16 h-16 bg-neutral-800 rounded-xl border border-neutral-700 flex items-center justify-center shrink-0">
                 <div className="w-8 h-8 rounded-full bg-pink-500"></div>
               </div>
               <div className="flex-1">
                 <h3 className="text-pink-400 font-black text-xl mb-1 uppercase tracking-wider">Guide</h3>
                 <p className="text-white text-lg font-medium leading-relaxed">
                   Hello traveler! The world is dangerous, but full of riches. Check your <span className="text-amber-400 font-bold">Quest Log (Press Q)</span> to see what you should do next!
                 </p>
                 <button onClick={() => setShowNPCMessage(false)} className="mt-4 text-xs font-bold text-neutral-400 hover:text-white uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full transition-colors">Close</button>
               </div>
            </div>
          </div>
        )}

        {/* Quest Log Modal Overlay */}
        {questLogOpen && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40">
            <div className="bg-neutral-900 p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col gap-6 w-full max-w-xl relative max-h-[80vh] overflow-hidden">
              <button 
                onClick={() => setQuestLogOpen(false)}
                className="absolute top-6 right-6 text-neutral-500 hover:text-white transition-colors"
              ><X size={24} /></button>
              
              <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                 <Scroll className="text-amber-400" size={32} />
                 Quest Log
              </h2>
              
              <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                 {quests.map(q => {
                   const isLocked = q.prerequisiteId && !quests.find(p => p.id === q.prerequisiteId)?.completed;
                   if (isLocked) {
                     return (
                       <div key={q.id} className="p-5 rounded-2xl border bg-black/40 border-white/5 opacity-50 relative overflow-hidden flex items-center justify-center">
                         <div className="text-center">
                           <Shield className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
                           <p className="text-neutral-500 font-bold text-sm">Quest Locked</p>
                           <p className="text-neutral-600 font-medium text-xs">Complete previous quests to unlock.</p>
                         </div>
                       </div>
                     )
                   }
                   return (
                   <div key={q.id} className={`p-5 rounded-2xl border ${q.completed ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-white/5 border-white/10'} relative overflow-hidden transition-colors`}>
                      {q.completed && <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/20 rotate-45 translate-x-8 -translate-y-8"></div>}
                      <div className="flex justify-between items-start mb-2">
                        <h3 className={`text-xl font-bold ${q.completed ? 'text-emerald-400' : 'text-white'}`}>{q.title}</h3>
                        <span className={`text-sm font-black ${q.completed ? 'text-emerald-400' : 'text-blue-400'}`}>
                           {q.current} / {q.goal}
                        </span>
                      </div>
                      <p className="text-neutral-400 text-sm font-medium mb-4">{q.description}</p>
                      
                      {/* Progress bar */}
                      <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden mb-3">
                         <div 
                           className={`h-full ${q.completed ? 'bg-emerald-500' : 'bg-blue-500'} transition-all duration-500`} 
                           style={{ width: `${Math.min(100, (q.current / q.goal) * 100)}%` }}
                         />
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg w-fit">
                        Reward: {q.rewardText}
                      </div>
                   </div>
                 )})}
              </div>
            </div>
          </div>
        )}

        {/* Chest Modal Overlay */}
        {chestOpen && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40">
            <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-2xl flex flex-col gap-6">
              <button 
                onClick={() => {
                  setChestOpen(false);
                  setActiveChestCoords(null);
                  if (cursorItem) {
                    setCursorItem(null); // Simple cursor clear to avoid item loss issues right now
                  }
                }}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white font-bold"
              >✕</button>
              
              <h3 className="text-white font-bold text-xl text-center">Chest</h3>
              
              {/* Chest Grid */}
              <div className="grid grid-cols-9 gap-1 bg-neutral-900 p-2 rounded-lg border border-neutral-700">
                {chestInventory.map((slot, i) => (
                  <button
                    key={i}
                    onPointerDown={() => { if (!cursorItem) handleSlotClick('chest', i); }} onPointerUp={() => { if (cursorItem) handleSlotClick('chest', i); }}
                    className="w-12 h-12 p-1.5 bg-black/50 rounded-md hover:bg-white/10 transition-colors"
                  >
                    {renderBlockIcon(slot)}
                  </button>
                ))}
              </div>

              {/* Backpack Grid (to let player move items to/from chest) */}
              <div>
                <h3 className="text-white font-bold mb-3">Inventory</h3>
                <div className="grid grid-cols-9 gap-1 bg-neutral-900 p-2 rounded-lg border border-neutral-700">
                  {backpack.map((slot, i) => (
                    <button
                      key={i}
                      onPointerDown={() => { if (!cursorItem) handleSlotClick('backpack', i); }} onPointerUp={() => { if (cursorItem) handleSlotClick('backpack', i); }}
                      className="w-12 h-12 p-1.5 bg-black/50 rounded-md hover:bg-white/10 transition-colors"
                    >
                      {renderBlockIcon(slot)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hotbar Grid */}
              <div>
                <h3 className="text-white font-bold mb-3">Hotbar</h3>
                <div className="grid grid-cols-9 gap-1 bg-neutral-900 p-2 rounded-lg border border-neutral-700">
                  {hotbar.map((slot, i) => (
                    <button
                      key={i}
                      onPointerDown={() => { if (!cursorItem) handleSlotClick('hotbar', i); }} onPointerUp={() => { if (cursorItem) handleSlotClick('hotbar', i); }}
                      className="w-12 h-12 p-1.5 bg-black/50 rounded-md hover:bg-white/10 transition-colors relative"
                    >
                      {renderBlockIcon(slot)}
                      <span className="absolute top-1 left-1.5 text-[10px] font-bold text-white/80 drop-shadow-md">
                        {i + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Furnace Modal Overlay */}
        {furnaceOpen && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40">
            <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-2xl flex flex-col gap-6 w-96 relative">
              <button 
                onClick={() => setFurnaceOpen(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white font-bold"
              >✕</button>
              
              <h3 className="text-white font-bold text-xl mb-2 text-center">Furnace Smelting</h3>
              
              <div className="flex items-center justify-center gap-6 bg-neutral-900 p-6 rounded-lg border border-neutral-700">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-neutral-500 mb-1 font-semibold uppercase">Ore</span>
                    <button
                      onPointerDown={() => { if (!cursorItem) handleSlotClick('furnaceInput', 0); }} onPointerUp={() => { if (cursorItem) handleSlotClick('furnaceInput', 0); }}
                      className="w-16 h-16 p-2 bg-black/50 rounded-lg border border-neutral-600 hover:bg-white/10 transition-colors"
                    >
                      {furnaceInput ? renderBlockIcon(furnaceInput) : null}
                    </button>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-neutral-500 mb-1 font-semibold uppercase">Fuel (Coal)</span>
                    <button
                      onPointerDown={() => { if (!cursorItem) handleSlotClick('furnaceFuel', 0); }} onPointerUp={() => { if (cursorItem) handleSlotClick('furnaceFuel', 0); }}
                      className="w-16 h-16 p-2 bg-black/50 rounded-lg border border-neutral-600 hover:bg-white/10 transition-colors"
                    >
                      {furnaceFuel ? renderBlockIcon(furnaceFuel) : null}
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col items-center justify-center">
                   <button 
                     onClick={handleSmelt}
                     disabled={furnaceFuel !== BlockType.Coal || !furnaceInput}
                     className="px-4 py-2 bg-amber-600 disabled:bg-neutral-700 text-white font-bold rounded shadow mb-2"
                   >
                     SMELT
                   </button>
                   <ArrowRight className="text-neutral-500 w-8 h-8" />
                </div>
                
                <div className="flex flex-col items-center">
                  <span className="text-xs text-neutral-500 mb-1 font-semibold uppercase">Output</span>
                  <button
                    onPointerDown={() => { if (!cursorItem) handleSlotClick('furnaceOutput', 0); }} onPointerUp={() => { if (cursorItem) handleSlotClick('furnaceOutput', 0); }}
                    className="w-16 h-16 p-2 bg-black/50 rounded-lg border border-neutral-600 hover:bg-white/10 transition-colors"
                  >
                    {furnaceOutput ? renderBlockIcon(furnaceOutput) : null}
                  </button>
                </div>
              </div>

              {/* Backpack Grid (to let player move items to/from furnace) */}
              <div>
                <h3 className="text-white font-bold mb-3">Inventory</h3>
                <div className="grid grid-cols-9 gap-1 bg-neutral-900 p-2 rounded-lg border border-neutral-700">
                  {backpack.map((slot, i) => (
                    <button
                      key={i}
                      onPointerDown={() => { if (!cursorItem) handleSlotClick('backpack', i); }} onPointerUp={() => { if (cursorItem) handleSlotClick('backpack', i); }}
                      className="w-12 h-12 p-1.5 bg-black/50 rounded-md hover:bg-white/10 transition-colors"
                    >
                      {renderBlockIcon(slot)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hotbar Grid */}
              <div>
                <h3 className="text-white font-bold mb-3">Hotbar</h3>
                <div className="grid grid-cols-9 gap-1 bg-neutral-900 p-2 rounded-lg border border-neutral-700">
                  {hotbar.map((slot, i) => (
                    <button
                      key={i}
                      onPointerDown={() => { if (!cursorItem) handleSlotClick('hotbar', i); }} onPointerUp={() => { if (cursorItem) handleSlotClick('hotbar', i); }}
                      className="w-12 h-12 p-1.5 bg-black/50 rounded-md hover:bg-white/10 transition-colors relative"
                    >
                      {renderBlockIcon(slot)}
                      <span className="absolute top-1 left-1.5 text-[10px] font-bold text-white/80 drop-shadow-md">
                        {i + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Floating Cursor Item */}
        {(inventoryOpen || furnaceOpen || chestOpen) && cursorItem && cursorItem.type !== BlockType.Air && (
          <div 
            className="fixed pointer-events-none z-50 w-8 h-8 opacity-90 scale-110"
            style={{ 
              left: mousePos.x - 16, 
              top: mousePos.y - 16 
            }}
          >
            {renderBlockIcon(cursorItem)}
          </div>
        )}

        {/* Custom Item Tooltip */}
        {hoveredTitle && (!cursorItem || cursorItem.type === BlockType.Air) && (
          <div 
            className="fixed pointer-events-none z-[60] bg-black/90 text-white text-xs px-2 py-1 rounded border border-white/20 whitespace-nowrap drop-shadow-xl"
            style={{
              left: mousePos.x + 12,
              top: mousePos.y + 12
            }}
          >
            {hoveredTitle}
          </div>
        )}

        {/* Instructions Modal */}
        {showInstructions && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="bg-neutral-800 p-8 rounded-xl border border-neutral-700 shadow-2xl max-w-md text-white">
              <h2 className="text-2xl font-bold mb-4">Instructions</h2>
              <ul className="list-disc pl-5 space-y-2 text-neutral-300 mb-6">
                <li><strong>W, A, S, D</strong> or Arrows to Move & Jump</li>
                <li><strong>Click</strong> to Mine Blocks or Attack Mobs</li>
                <li><strong>Select Fists (Slot 1)</strong> to punch mobs without placing blocks</li>
                <li><strong>E</strong> to open Inventory & Crafting</li>
                <li><strong>1-9</strong> to select items in your hotbar (hotkeys shown in inventory)</li>
                <li><strong>Enter</strong> to Chat</li>
              </ul>
              <button 
                onClick={() => setShowInstructions(false)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded transition-colors"
              >
                Start Playing
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
