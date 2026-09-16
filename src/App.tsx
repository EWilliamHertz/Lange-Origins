import React, { useState, useEffect, useRef } from 'react';
import { BlockType, BlockColors, BlockNames } from './lib/constants';
import { getBlockIcon } from './lib/icons';
import GameCanvas from './components/GameCanvas';
import LandingPage from './components/LandingPage';
import { Heart, MessageSquare, ArrowRight, Hand, LogOut, User, Star, Clock, Globe, Scroll, X, Book, Shield, Plus, Layers, ShoppingBag, Volume2, VolumeX, Sword } from 'lucide-react';
import { checkRecipe, RECIPES } from './lib/crafting';
import { Sounds } from './lib/audio';
import { auth, logout, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, deleteDoc, updateDoc, increment, orderBy, query, limit } from 'firebase/firestore';
import { Socket } from 'socket.io-client';


const checkEquipable = (type: number) => (type >= 100 && type <= 109) || type === 302 || type === 400 || type === 401;

export default function App() {
  const [appState, setAppState] = useState<'landing' | 'serverBrowser' | 'playing'>('landing');
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  
  useEffect(() => {
     if (isMuted) {
       Sounds.setVolume(0);
     } else {
       Sounds.setVolume(volume);
     }
  }, [volume, isMuted]);
  
  useEffect(() => {
     if (appState !== 'landing') {
        Sounds.startLofiMusic();
     } else {
        Sounds.stopLofiMusic();
     }
  }, [appState]);

  const [lobbyTab, setLobbyTab] = useState<'play' | 'marketplace' | 'friends'>('play');
  const [marketBlueprints, setMarketBlueprints] = useState<any[]>([]);
  const [friendsList, setFriendsList] = useState<{name: string, serverId: string, isOnline: boolean}[]>([
      { name: "Zudran", serverId: "Public-1", isOnline: true },
      { name: "Alice", serverId: "MyBase", isOnline: true },
      { name: "Bob", serverId: "", isOnline: false },
  ]);
  const [interactPlayerId, setInteractPlayerId] = useState<string | null>(null);
  const [interactPlayerName, setInteractPlayerName] = useState<string | null>(null);

  const [activeTrade, setActiveTrade] = useState<any>(null);
  const [currentGang, setCurrentGang] = useState<any>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hasLoadedSave, setHasLoadedSave] = useState(false);
  
  // Game states we want to save
  type InventorySlot = { type: BlockType; count: number; durability?: number } | null;
  const [equipment, setEquipment] = useState<InventorySlot[]>([null, null]); // [helmet, chestplate]
const [hotbar, setHotbar] = useState<InventorySlot[]>([
    { type: BlockType.Fists, count: 1 },
    { type: BlockType.WoodPickaxe, count: 1 },
    { type: BlockType.Gun, count: 1 },
    { type: BlockType.Bow, count: 1 },
    { type: BlockType.Grenade, count: 64 },
    { type: BlockType.Bullet, count: 64 },
    { type: BlockType.Arrow, count: 64 },
    { type: BlockType.TNT, count: 64 },
    { type: BlockType.Platform, count: 64 }
  ]);
  const [backpack, setBackpack] = useState<InventorySlot[]>(() => {
    return Array(27).fill(null);
  });
  const [health, setHealth] = useState(10);
  const [kills, setKills] = useState(0);
  const [mana, setMana] = useState(100);
  
  interface Quest {
    id: string; title: string; description: string; goal: number; current: number; completed: boolean; rewardText: string; prerequisiteId?: string;
  }

  const defaultQuests: Quest[] = [
    { id: 'q1', title: 'Getting Started', description: 'Mine 5 blocks of Dirt.', goal: 5, current: 0, completed: false, rewardText: 'Knowledge of the world.' },
    { id: 'q2', title: 'Wood Gatherer', description: 'Chop down 3 Wood Logs.', goal: 3, current: 0, completed: false, rewardText: 'Access to Tools', prerequisiteId: 'q1' },
    { id: 'q3', title: 'First Tool', description: 'Craft a Wooden Pickaxe.', goal: 1, current: 0, completed: false, rewardText: 'Mining Capability', prerequisiteId: 'q2' },
    { id: 'q4', title: 'Upgrades', description: 'Craft an Iron Pickaxe.', goal: 1, current: 0, completed: false, rewardText: 'Mining Efficiency', prerequisiteId: 'q3' },
    { id: 'q5', title: 'Magician\'s Journey', description: 'Mine 5 Blue Crystals to unlock the secrets of magic.', goal: 5, current: 0, completed: false, rewardText: 'Unlock Magic & Mana', prerequisiteId: 'q4' }
  ];

  const [quests, setQuests] = useState<Quest[]>(defaultQuests);
  /*
    { id: 'q1', title: 'Getting Started', description: 'Mine 5 blocks of Dirt.', goal: 5, current: 0, completed: false, rewardText: 'Knowledge of the world.' },
    { id: 'q2', title: 'Wood Gatherer', description: 'Chop down 3 Wood Logs.', goal: 3, current: 0, completed: false, rewardText: 'Access to Tools', prerequisiteId: 'q1' },
    { id: 'q3', title: 'First Tool', description: 'Craft a Wooden Pickaxe.', goal: 1, current: 0, completed: false, rewardText: 'Mining Capability', prerequisiteId: 'q2' },
  */

  

  // Mana Regeneration
  useEffect(() => {
    if (appState !== 'playing') return;
    const isMagicUnlocked = quests.find(q => q.id === 'q5')?.completed;
    if (!isMagicUnlocked) return;
    
    const interval = setInterval(() => {
       setMana(prev => Math.min(100, prev + 2));
    }, 1000);
    return () => clearInterval(interval);
  }, [appState, quests]);
  
  useEffect(() => {
    if (appState === 'playing' && hotbar.length > 0) {
      // Check if they have grappling hook
      const hasHook = hotbar.some(item => item && item.type === 111) || backpack.some(item => item && item.type === 111);
      if (!hasHook) {
        setHotbar(prev => {
          const next = [...prev];
          // Try to find empty slot
          let emptyIdx = next.findIndex(item => !item);
          if (emptyIdx === -1) {
            // Replace a fist or something less important
            emptyIdx = next.findIndex(item => item && item.type === 103);
          }
          if (emptyIdx === -1) emptyIdx = 2; // just overwrite slot 3
          
          next[emptyIdx] = { type: 111, count: 1 };
          return next;
        });
      }
    }
  }, [appState]);

  useEffect(() => {
    if (appState === 'playing') {
      Sounds.startWind();
    } else {
      Sounds.stopWind();
      Sounds.stopBattleMusic();
    }
  }, [appState]);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        
        // Load data from Firestore
        try {
          const profilesRef = collection(db, 'users', user.uid, 'profiles');
          const profilesSnap = await getDocs(profilesRef);
          const loadedProfiles = profilesSnap.docs.map(d => d.data());
          if (loadedProfiles.length > 0) {
              setProfiles(loadedProfiles);
              const active = loadedProfiles.sort((a,b) => b.updatedAt - a.updatedAt)[0];
              setActiveProfileId(active.id);
              setNickname(active.name || 'Player');
              setCharacterSkin(active.skin || 'orange');
              if (active.equipment) setEquipment(JSON.parse(active.equipment));
              if (active.hotbar) setHotbar(JSON.parse(active.hotbar));
              if (active.backpack) setBackpack(JSON.parse(active.backpack));
              if (active.quests) setQuests(JSON.parse(active.quests));
              if (active.health !== undefined) setHealth(active.health);
              if (active.kills !== undefined) setKills(active.kills);
          } else {
             // Create initial profile
             const newId = 'prof_' + Date.now();
             const defaultHotbar = [
                         { type: 103, count: 1 },
                         { type: 302, count: 1 },
                         { type: 111, count: 1 },
                         { type: 304, count: 64 },
                         { type: 34, count: 64 },
                         { type: 31, count: 64 },
                         { type: 32, count: 64 },
                         { type: 100, count: 1 },
                         { type: 28, count: 64 },
                         null
             ];
             const newProfile = {
                         id: newId,
                         name: 'Player',
                         skin: 'orange',
                         health: 100,
                         equipment: JSON.stringify([null, null]),
                         hotbar: JSON.stringify(defaultHotbar),
                         backpack: JSON.stringify(Array(27).fill(null)),
                         quests: JSON.stringify(defaultQuests),
                         kills: 0,
                         updatedAt: Date.now()
             };
             await setDoc(doc(db, 'users', user.uid, 'profiles', newId), newProfile);
             setProfiles([newProfile]);
             setActiveProfileId(newId);
             setEquipment([null, null]);
             setHotbar(defaultHotbar);
          }
        } catch (e) {
          console.error("Error loading progress", e);
        }
        setHasLoadedSave(true);

        
        if (appState === 'landing') {
          setAppState('serverBrowser');
        }
      } else {
        setCurrentUser(null);
        setHasLoadedSave(false);
        setAppState('landing');
      }
    });
    
  

  
  

  return () => unsubscribe();
  }, [appState]);


  const [serverName, setServerName] = useState<string>('');
  const [joinInput, setJoinInput] = useState<string>('new-world');
  const [nickname, setNickname] = useState<string>(() => `Player${Math.floor(Math.random() * 10000)}`);

  const [characterSkin, setCharacterSkin] = useState<string>('orange');

  const [profiles, setProfiles] = useState<any[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  const availableSkins = [
    { id: 'orange', color: '#FF9800', name: 'Orange' },
    { id: 'blue', color: '#2196F3', name: 'Blue' },
    { id: 'green', color: '#4CAF50', name: 'Green' },
    { id: 'red', color: '#F44336', name: 'Red' },
    { id: 'purple', color: '#9C27B0', name: 'Purple' },
    { id: 'pink', color: '#E91E63', name: 'Pink' },
    { id: 'gray', color: '#9E9E9E', name: 'Gray' }
  ];

  const [showInstructions, setShowInstructions] = useState<boolean>(true);


  // Detect Quest completions
  const prevQuestsRef = useRef<Quest[]>([]);
  useEffect(() => {
    if (prevQuestsRef.current.length > 0) {
       for (let i = 0; i < quests.length; i++) {
         if (quests[i].completed && !prevQuestsRef.current[i]?.completed) {
            Sounds.click?.();
            setNotifications(prev => [...prev, { id: Math.random().toString(), type: 'system', senderId: 'System', senderName: 'System', timestamp: Date.now(), msg: 'Quest Completed: ' + quests[i].title } as any]);
         }
       }
    }
    prevQuestsRef.current = quests;
  }, [quests]);

  const saveStateRef = useRef({ equipment, hotbar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin, kills });
  useEffect(() => {
    saveStateRef.current = { equipment, hotbar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin, kills };
  }, [equipment, hotbar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin, kills]);

    const handleSignOut = async () => {
    try {
        await logout();
        setAppState('landing');
        setCurrentUser(null);
    } catch (e) {
        console.error(e);
    }
  };


  const saveProgress = async () => {
    const latest = saveStateRef.current;
    if (!latest.currentUser || !latest.activeProfileId) return;
    try {
      const docRef = doc(db, 'users', latest.currentUser.uid, 'profiles', latest.activeProfileId);
      await setDoc(docRef, {
        equipment: JSON.stringify(latest.equipment),
        hotbar: JSON.stringify(latest.hotbar),
        backpack: JSON.stringify(latest.backpack),
        health: latest.health,
        quests: JSON.stringify(latest.quests),
        kills: latest.kills,
        name: latest.nickname,
        skin: latest.characterSkin,
        lastRoom: latest.serverName || 'public-lobby',
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log("Progress auto-saved.");

    } catch (e) {
      console.error("Failed to auto-save progress", e);
    }
  };

  useEffect(() => {
    if (!currentUser || !hasLoadedSave || appState !== 'playing') return;
    const timeout = setTimeout(saveProgress, 2000);
    return () => clearTimeout(timeout);
  }, [currentUser, hasLoadedSave, appState, equipment, hotbar, backpack, quests, health]);

  const [craftingGrid, setCraftingGrid] = useState<InventorySlot[]>(Array(9).fill(null));
  const [craftingResult, setCraftingResult] = useState<{result: BlockType, count: number} | null>(null);

  useEffect(() => {
    // We map to BlockType | null for the crafting system
    const mappedGrid = craftingGrid.map(slot => slot ? slot.type : null);
    setCraftingResult(checkRecipe(mappedGrid));
  }, [craftingGrid]);
  
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [showEquipment, setShowEquipment] = useState(false);
  const [duelingOpponents, setDuelingOpponents] = useState<string[]>([]);
  const [inventoryTab, setInventoryTab] = useState<'crafting' | 'guide'>('crafting');

  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');

  const [furnaceOpen, setFurnaceOpen] = useState(false);
  const [merchantOpen, setMerchantOpen] = useState(false);
  const [merchantPayment, setMerchantPayment] = useState<InventorySlot>(null);
  const [merchantOutput, setMerchantOutput] = useState<InventorySlot>(null);
  const [chestOpen, setChestOpen] = useState(false);
  const [activeChestCoords, setActiveChestCoords] = useState<{tx: number, ty: number} | null>(null);
  const [chestInventory, setChestInventory] = useState<InventorySlot[]>(() => Array(27).fill(null));

  const [leftActionBar, setLeftActionBar] = useState<InventorySlot[]>(Array(10).fill(null));
  const [rightActionBar, setRightActionBar] = useState<InventorySlot[]>(Array(10).fill(null));
  const [showLeftActionBar, setShowLeftActionBar] = useState(false);
  const [showRightActionBar, setShowRightActionBar] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const [furnaceInput, setFurnaceInput] = useState<InventorySlot>(null);
  const [furnaceFuel, setFurnaceFuel] = useState<InventorySlot>(null);
  const [furnaceOutput, setFurnaceOutput] = useState<InventorySlot>(null);
  const [cursorItem, setCursorItem] = useState<InventorySlot>(null);

  const returnCursorItemToInventory = (item) => {
     if (!item || item.type === 0) return;
     setBackpack(prev => {
        const next = [...prev];
        let remaining = item.count;
        for (let i = 0; i < next.length; i++) {
           if (next[i] && next[i].type === item.type && next[i].count < 64) {
              const space = 64 - next[i].count;
              const add = Math.min(remaining, space);
              next[i] = { ...next[i], count: next[i].count + add };
              remaining -= add;
              if (remaining <= 0) return next;
           }
        }
        for (let i = 0; i < next.length; i++) {
           if (!next[i]) {
              next[i] = { type: item.type, count: remaining, durability: item.durability };
              return next;
           }
        }
        return next;
     });
     setCursorItem(null);
  };

  
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [notifications, setNotifications] = useState<{id: string, type: 'trade'|'gang'|'friend', senderId: string, senderName: string, timestamp: number}[]>([]);
  
  const addNotification = (type: 'trade'|'gang'|'friend', senderId: string, senderName: string) => {
     setNotifications(prev => [...prev, { id: Math.random().toString(), type, senderId, senderName, timestamp: Date.now() }]);
  };

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

  const [questLogOpen, setQuestLogOpen] = useState(false);
  const [showNPCMessage, setShowNPCMessage] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  
  useEffect(() => {
    if (appState === 'serverBrowser') {
      fetch('/api/servers').then(r => r.json()).then(data => {
        if (data && data.servers) setPublicServers(data.servers);
      }).catch(console.error);
      
      // Fetch blueprints
      (async () => {

         try {
             const bpsSnap = await getDocs(query(collection(db, 'market_blueprints'), orderBy('likes', 'desc'), limit(50)));
             setMarketBlueprints(bpsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
         } catch (err) {
             console.error("Failed to load blueprints:", err);
         }
      });
    }
  }, [appState]);


  
  
  const handleUpvote = async (bpId: string) => {
     if (!currentUser) return;
     try {

         await updateDoc(doc(db, 'market_blueprints', bpId), {
             likes: increment(1)
         });
         setMarketBlueprints(prev => prev.map(bp => bp.id === bpId ? { ...bp, likes: (bp.likes || 0) + 1 } : bp));
     } catch (err) {
         console.error("Failed to upvote:", err);
     }
  };

  const publishBlueprint = async () => {
     if (!currentUser) return;
     const roomId = window.prompt("Enter the exact ID of the Private Server you want to publish:");
     if (!roomId) return;
     const bpName = window.prompt("Give your Blueprint a catchy title:");
     if (!bpName) return;
     const desc = window.prompt("Write a short description (e.g. Parkour map, 1v1 Arena, Chill Hub):");
     if (!desc) return;
     
     try {

        const newBp = {
           roomId,
           name: bpName,
           description: desc,
           creatorId: currentUser.uid,
           creatorName: currentUser.displayName || 'Unknown Builder',
           likes: 0,
           createdAt: serverTimestamp()
        };
        await setDoc(doc(db, 'market_blueprints', roomId + '_' + currentUser.uid), newBp);
        alert("Successfully published your Blueprint to the Community Marketplace!");
        setMarketBlueprints(prev => [{ id: roomId + '_' + currentUser.uid, ...newBp }, ...prev]);
     } catch (err) {
        console.error("Failed to publish blueprint:", err);
        alert("Failed to publish. Check console.");
     }
  };

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

  
  const handleMerchantTrade = () => {
    if (merchantPayment) {
      let outputType: BlockType | null = null;
      let cost = 1;
      let outputAmount = 1;
      
      // Recipe 1: 5 Gold Ingots -> 1 Diamond
      if (merchantPayment.type === BlockType.GoldIngot && merchantPayment.count >= 5) {
         outputType = BlockType.Diamond;
         cost = 5;
      }
      // Recipe 2: 3 Iron Ingots -> 1 Iron Sword
      else if (merchantPayment.type === BlockType.IronIngot && merchantPayment.count >= 3) {
         outputType = BlockType.IronSword;
         cost = 3;
      }
      // Recipe 3: 10 Coal -> 1 Apple
      else if (merchantPayment.type === BlockType.Coal && merchantPayment.count >= 10) {
         outputType = BlockType.Apple;
         cost = 10;
      }
      
      if (outputType) {
        if (merchantOutput && (merchantOutput.type !== outputType || merchantOutput.count + outputAmount > 64)) {
            return;
        }

        if (merchantPayment.count > cost) {
            setMerchantPayment({ ...merchantPayment, count: merchantPayment.count - cost });
        } else {
            setMerchantPayment(null);
        }

        if (merchantOutput) {
            setMerchantOutput({ ...merchantOutput, count: merchantOutput.count + outputAmount });
        } else {
            setMerchantOutput({ type: outputType, count: outputAmount });
        }
      }
    }
  };

  
  const [smeltProgress, setSmeltProgress] = useState(0);

  useEffect(() => {
     let interval;
     if (furnaceFuel?.type === BlockType.Coal && furnaceInput) {
        let isValid = false;
        if (furnaceInput.type === BlockType.IronOre) isValid = true;
        if (furnaceInput.type === BlockType.GoldOre) isValid = true;
        if (furnaceInput.type === BlockType.DiamondOre) isValid = true;
        if (furnaceInput.type === BlockType.Sand) isValid = true;
        if (furnaceInput.type === BlockType.CoalOre) isValid = true;
        
        if (isValid) {
            interval = setInterval(() => {
                setSmeltProgress(prev => {
                    if (prev >= 100) {
                        handleSmelt();
                        return 0;
                    }
                    return prev + 10; // 10% per tick (e.g. 100ms)
                });
            }, 200); // 2 seconds to smelt
        } else {
            setSmeltProgress(0);
        }
     } else {
         setSmeltProgress(0);
     }
     return () => clearInterval(interval);
  }, [furnaceFuel, furnaceInput, furnaceOutput]);

  const handleSmelt = () => {
    if (furnaceFuel?.type === BlockType.Coal && furnaceInput) {
      let outputType: BlockType | null = null;
      if (furnaceInput.type === BlockType.IronOre) outputType = BlockType.IronIngot;
      if (furnaceInput.type === BlockType.GoldOre) outputType = BlockType.GoldIngot;
      if (furnaceInput.type === BlockType.DiamondOre) outputType = BlockType.Diamond;
      if (furnaceInput.type === BlockType.Sand) outputType = BlockType.Glass;
      if (furnaceInput.type === BlockType.CoalOre) outputType = BlockType.Coal;
      
      if (outputType) {
        if (furnaceOutput && (furnaceOutput.type !== outputType || furnaceOutput.count >= 64)) {
            return;
        }

        if (furnaceFuel.count > 1) {
            setFurnaceFuel({ ...furnaceFuel, count: furnaceFuel.count - 1 });
        } else {
            setFurnaceFuel(null);
        }

        if (furnaceInput.count > 1) {
            setFurnaceInput({ ...furnaceInput, count: furnaceInput.count - 1 });
        } else {
            setFurnaceInput(null);
        }

        if (furnaceOutput) {
            setFurnaceOutput({ ...furnaceOutput, count: furnaceOutput.count + 1 });
        } else {
            setFurnaceOutput({ type: outputType, count: 1 });
        }
      }
    }
  };

  // Keyboard shortcuts

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (appState !== 'playing') return;
      
      if (isChatOpen) {
        if (e.key === 'Escape') {
          setIsChatOpen(false);
        }
        if (e.key !== 'Escape') {
          return; // Disable other game keys while chatting unless it's escape
        }
      }

      if (e.key === 'Enter') {
        setIsChatOpen(true);
        setTimeout(() => chatInputRef.current?.focus(), 50);
        return;
      }
      
      if (e.key.toLowerCase() === 'e') {
        if (merchantOpen) {
          setMerchantOpen(false);
          setCursorItem(null);
          return;
        }
        if (furnaceOpen) {
          setFurnaceOpen(false);
          returnCursorItemToInventory(cursorItem);
          return;
        }
        if (chestOpen) {
          setChestOpen(false);
          setActiveChestCoords(null);
          returnCursorItemToInventory(cursorItem);
          return;
        }
        setInventoryOpen(prev => {
          if (prev) returnCursorItemToInventory(cursorItem); 
          return !prev;
        });
        return;
      }
      
      if (e.key === 'Escape') {
        if (merchantOpen) {
          setMerchantOpen(false);
          returnCursorItemToInventory(cursorItem);
          return;
        }
        if (furnaceOpen) {
          setFurnaceOpen(false);
          returnCursorItemToInventory(cursorItem);
          return;
        }
        if (chestOpen) {
          setChestOpen(false);
          setActiveChestCoords(null);
          returnCursorItemToInventory(cursorItem);
          return;
        }
        if (inventoryOpen) {
          setInventoryOpen(false);
          returnCursorItemToInventory(cursorItem);
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

  
  const handleFireWeapon = (weaponType: number) => {
    const isGun = weaponType === BlockType.Gun;
    const isBow = weaponType === BlockType.Bow;
    const isGrenade = weaponType === BlockType.Grenade;
    const isStaff = weaponType === BlockType.WizardStaff;
    
    if (isStaff) {
       setMana(prev => Math.max(0, prev - 10));
       return;
    }
    
    let ammoType = isGun ? 303 : (isBow ? 110 : 304);
    
    if (isGrenade) {
       setHotbar(prev => {
          const newHb = [...prev];
          const currentSlot = newHb[selectedSlotIndex];
          if (currentSlot && currentSlot.type === 304) {
             newHb[selectedSlotIndex] = { ...currentSlot, count: currentSlot.count - 1 };
             if (newHb[selectedSlotIndex]?.count <= 0) newHb[selectedSlotIndex] = null;
          }
          return newHb;
       });
       return;
    }
    
    setHotbar(prevHotbar => {
       const newHb = [...prevHotbar];
       let consumed = false;
       for (let i = 0; i < newHb.length; i++) {
           if (newHb[i] && newHb[i].type === ammoType) {
               newHb[i] = { ...newHb[i]!, count: newHb[i]!.count - 1 };
               if (newHb[i]!.count <= 0) newHb[i] = null;
               consumed = true;
               return newHb;
           }
       }
       
       if (!consumed) {
           setBackpack(prevBp => {
               const newBp = [...prevBp];
               for (let j = 0; j < newBp.length; j++) {
                   if (newBp[j] && newBp[j].type === ammoType) {
                       newBp[j] = { ...newBp[j]!, count: newBp[j]!.count - 1 };
                       if (newBp[j]!.count <= 0) newBp[j] = null;
                       return newBp;
                   }
               }
               return prevBp;
           });
       }
       return prevHotbar;
    });
  };

  
  const handleSortInventory = () => {
     // Combine hotbar and backpack
     const allItems: { type: number, count: number }[] = [];
     
     const processSlot = (slot: InventorySlot) => {
         if (!slot) return;
         const existing = allItems.find(i => i.type === slot.type);
         if (existing) {
             existing.count += slot.count;
         } else {
             allItems.push({ type: slot.type, count: slot.count });
         }
     };
     
     hotbar.forEach(processSlot);
     backpack.forEach(processSlot);
     
     // Sort by type (optional, but grouping is the main goal)
     allItems.sort((a, b) => a.type - b.type);
     
     // Re-distribute
     const newHotbar: InventorySlot[] = Array(10).fill(null);
     const newBackpack: InventorySlot[] = Array(27).fill(null);
     
     let itemIndex = 0;
     
     // Fill hotbar first (or we could just fill backpack and let them move things, but let's keep some in hotbar)
     // Actually, it's safer to fill hotbar then backpack, splitting stacks > 64
     
     const distributeStack = (type: number, count: number) => {
         let remaining = count;
         while (remaining > 0) {
             const chunk = Math.min(remaining, 64);
             remaining -= chunk;
             
             // Try hotbar
             let placed = false;
             for (let i = 0; i < 10; i++) {
                 if (newHotbar[i] === null) {
                     newHotbar[i] = { type, count: chunk };
                     placed = true;
                     break;
                 }
             }
             
             if (!placed) {
                 for (let i = 0; i < 27; i++) {
                     if (newBackpack[i] === null) {
                         newBackpack[i] = { type, count: chunk };
                         break;
                     }
                 }
             }
         }
     };
     
     allItems.forEach(item => distributeStack(item.type, item.count));
     
     setHotbar(newHotbar);
     setBackpack(newBackpack);
  };

  const handleSlotClick = (type: 'hotbar' | 'leftActionBar' | 'rightActionBar' | 'backpack' | 'equipment' | 'crafting' | 'craftingResult' | 'furnaceInput' | 'furnaceFuel' | 'furnaceOutput' | 'chest' | 'merchantPayment' | 'merchantOutput', index: number, isRightClick: boolean = false) => {
    
    // Helper to merge stacks
    const tryMerge = (target: InventorySlot, source: InventorySlot, isRightClick: boolean): { remainingTarget: InventorySlot, remainingSource: InventorySlot } => {
      if (!source && !target) return { remainingTarget: null, remainingSource: null };
      
      // Right click with empty cursor on a full target slot: pick up half
      if (!source && target) {
        if (isRightClick && target.count > 1) {
          const amountToPickUp = Math.ceil(target.count / 2);
          const remainingTargetCount = target.count - amountToPickUp;
          return {
            remainingTarget: remainingTargetCount > 0 ? { ...target, count: remainingTargetCount } : null,
            remainingSource: { ...target, count: amountToPickUp }
          };
        }
        return { remainingTarget: null, remainingSource: target };
      }
      
      // If target is empty, and right clicking with source: place 1
      if (!target && source) {
        if (isRightClick) {
          const newSourceCount = source.count - 1;
          return {
            remainingTarget: { ...source, count: 1 },
            remainingSource: newSourceCount > 0 ? { ...source, count: newSourceCount } : null
          };
        }
        return { remainingTarget: source, remainingSource: null };
      }
      
      // Both source and target exist
      const isEquipable = checkEquipable(target!.type);
      if (target!.type === source!.type && !isEquipable) {
        const spaceLeft = 64 - target!.count;
        if (spaceLeft > 0) {
          const amountToMove = isRightClick ? 1 : Math.min(spaceLeft, source!.count);
          const newTarget = { ...target!, count: target!.count + amountToMove };
          const newSourceCount = source!.count - amountToMove;
          return {
            remainingTarget: newTarget,
            remainingSource: newSourceCount > 0 ? { ...source!, count: newSourceCount } : null
          };
        }
      }
      
      // Swap if unable to merge, but don't swap if right clicking and types differ
      if (isRightClick && target!.type !== source!.type) {
         return { remainingTarget: target, remainingSource: source };
      }

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
    
    if (type === 'merchantPayment') {
       const { remainingTarget, remainingSource } = tryMerge(merchantPayment, cursorItem, isRightClick);
       setMerchantPayment(remainingTarget);
       setCursorItem(remainingSource);
       return;
    }
    if (type === 'merchantOutput') {
      if (merchantOutput) {
         const { remainingTarget, remainingSource } = tryMerge(cursorItem, merchantOutput, isRightClick);
         setCursorItem(remainingTarget);
         setMerchantOutput(remainingSource);
      }
      return;
    }
    if (type === 'furnaceOutput') {
      if (furnaceOutput) {
         const { remainingTarget, remainingSource } = tryMerge(cursorItem, furnaceOutput, isRightClick);
         setCursorItem(remainingTarget);
         setFurnaceOutput(remainingSource);
      }
      return;
    }

    if (type === 'furnaceInput') {
       const { remainingTarget, remainingSource } = tryMerge(furnaceInput, cursorItem, isRightClick);
       setFurnaceInput(remainingTarget);
       setCursorItem(remainingSource);
       return;
    }

    if (type === 'furnaceFuel') {
       const { remainingTarget, remainingSource } = tryMerge(furnaceFuel, cursorItem, isRightClick);
       setFurnaceFuel(remainingTarget);
       setCursorItem(remainingSource);
       return;
    }

    if (type === 'chest') {
      const targetArray = [...chestInventory];
      const { remainingTarget, remainingSource } = tryMerge(targetArray[index], cursorItem, isRightClick);
      targetArray[index] = remainingTarget;
      setCursorItem(remainingSource);
      setChestInventory(targetArray);
      
      if (socketRef.current && activeChestCoords) {
        socketRef.current.emit('update_chest', { tx: activeChestCoords.tx, ty: activeChestCoords.ty, inventory: targetArray });
      }
      return;
    }

    
    if (type === 'equipment') {
      if (cursorItem) {
        if (index === 0 && cursorItem.type !== BlockType.IronHelmet && cursorItem.type !== BlockType.GoldHelmet && cursorItem.type !== BlockType.DiamondHelmet) {
          return; // invalid helmet
        }
        if (index === 1 && cursorItem.type !== BlockType.IronChestplate && cursorItem.type !== BlockType.GoldChestplate && cursorItem.type !== BlockType.DiamondChestplate) {
          return; // invalid chestplate
        }
      }
    }

let targetArray = type === 'hotbar' ? [...hotbar] 
                    : type === 'backpack' ? [...backpack] 
                    : type === 'leftActionBar' ? [...leftActionBar]
                    : type === 'rightActionBar' ? [...rightActionBar]
                    : type === 'equipment' ? [...equipment] : [...craftingGrid];
    const { remainingTarget, remainingSource } = tryMerge(targetArray[index], cursorItem, isRightClick);
    targetArray[index] = remainingTarget;
    setCursorItem(remainingSource);
    if (type === 'hotbar') setHotbar(targetArray);
    else if (type === 'leftActionBar') setLeftActionBar(targetArray);
    else if (type === 'rightActionBar') setRightActionBar(targetArray);
    else if (type === 'backpack') setBackpack(targetArray);
    else if (type === 'equipment') setEquipment(targetArray);
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
    
    const isEquipable = checkEquipable(type);
    
    const icon = getBlockIcon(type, "w-full h-full p-1 drop-shadow-md");

    return (
      <div 
        data-tooltip={title}
        className="w-full h-full rounded-sm shadow-sm relative group flex items-center justify-center overflow-hidden"
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
        {(typeof slot !== 'number' && slot.durability !== undefined) && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50 overflow-hidden z-20">
             <div className="h-full" style={{ 
                 width: `${Math.max(0, slot.durability / ((type === 409 || type === 410) ? 150 : (type === 407 || type === 408) ? 40 : 50)) * 100}%`, 
                 backgroundColor: slot.durability / 50 > 0.5 ? '#4CAF50' : slot.durability / 50 > 0.2 ? '#FFC107' : '#F44336' 
             }} />
          </div>
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
          const roomToWipe = window.prompt('Enter the name of the server/room to wipe (leave blank for public-lobby):') || 'public-lobby';
          if (!window.confirm(`Are you sure you want to wipe "${roomToWipe}"? This cannot be undone.`)) return;
          
          const res = await fetch('/api/admin/wipe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUser.email, roomId: roomToWipe })
          });
          const data = await res.json();
          if (data.success) {
            alert(`World "${roomToWipe}" wiped successfully!`);
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

    
  

  
      
  const countAmmo = (type: number) => {
      let count = 0;
      hotbar.forEach(s => { if(s && s.type === type) count += s.count; });
      backpack.forEach(s => { if(s && s.type === type) count += s.count; });
      return count;
  };
  
  const currentAmmoCount = 
      selectedBlock === 302 ? countAmmo(303) :
      selectedBlock === 109 ? countAmmo(110) :
      selectedBlock === 304 ? countAmmo(304) : 1;

    

    const equippedHelmet = backpack.find(s => s && [BlockType.IronHelmet, BlockType.GoldHelmet, BlockType.DiamondHelmet].includes(s.type)) || 
                           hotbar.find(s => s && [BlockType.IronHelmet, BlockType.GoldHelmet, BlockType.DiamondHelmet].includes(s.type));
    const equippedChestplate = backpack.find(s => s && [BlockType.IronChestplate, BlockType.GoldChestplate, BlockType.DiamondChestplate].includes(s.type)) || 
                               hotbar.find(s => s && [BlockType.IronChestplate, BlockType.GoldChestplate, BlockType.DiamondChestplate].includes(s.type));
                               
    const helmetType = equippedHelmet ? equippedHelmet.type : null;
    const chestplateType = equippedChestplate ? equippedChestplate.type : null;

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
             <button onClick={handleSignOut} className="px-4 py-2 rounded-xl text-sm font-bold bg-[#1A1A1F] text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all">Sign Out</button>
          </div>
        )}

        <div className="w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8 h-full z-10 pt-24 lg:pt-8">
          
          <div className="flex-1 bg-[#141417]/80 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-10 border border-white/5 flex flex-col shadow-2xl overflow-hidden min-h-[500px]">
             
             <div className="flex items-center gap-4 mb-10 shrink-0">
               <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/30">
                 <Globe size={28} className="text-white" />
               </div>
               <div>
                 <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-500 tracking-tight">World Browser</h1>
                 <p className="text-neutral-400 font-medium">Join an existing realm or start your own.</p>
               </div>
             </div>

             <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col">
               <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4 shrink-0">
                 <button
                     onClick={() => setLobbyTab('play')}
                     className={`text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all ${lobbyTab === 'play' ? 'bg-blue-600/20 text-blue-400' : 'text-neutral-500 hover:text-white'}`}
                 >Live Servers</button>
                 <button
                     onClick={() => setLobbyTab('marketplace')}
                     className={`text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${lobbyTab === 'marketplace' ? 'bg-emerald-600/20 text-emerald-400' : 'text-neutral-500 hover:text-white'}`}
                 ><ShoppingBag size={14}/> Marketplace</button>
               </div>
                          
               {lobbyTab === 'play' ? (
                 <div className="flex flex-col">
                   <div className="mb-8">
                     <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-500 mb-4 flex items-center gap-2">
                       <Star size={14} className="text-amber-500" /> Favorites
                     </h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {favoriteServers.length > 0 ? favoriteServers.map(srv => (
                         <div key={srv} onClick={() => joinServer(srv)} className="bg-[#0A0A0B]/60 hover:bg-[#1A1A1E]/80 border border-neutral-800/50 hover:border-neutral-700 p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between group">
                           <span className="font-bold text-neutral-200 group-hover:text-white transition-colors">{srv}</span>
                           <button onClick={(e) => toggleFavorite(srv, e)} className="text-amber-500 hover:text-amber-400 p-1">
                             <Star size={18} fill="currentColor" />
                           </button>
                         </div>
                       )) : <p className="text-neutral-600 text-sm italic py-2">No favorites yet.</p>}
                     </div>
                   </div>
                   <div className="mb-8">
                     <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-500 mb-4 flex items-center gap-2">
                       <Globe size={14} className="text-blue-500" /> Public Realms
                     </h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {publicServers.map(srv => (
                         <div key={srv.id} onClick={() => joinServer(srv.id)} className="bg-[#0A0A0B]/60 hover:bg-[#1A1A1E]/80 border border-neutral-800/50 hover:border-neutral-700 p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between group">
                           <div>
                             <div className="font-bold text-neutral-200 group-hover:text-white transition-colors">{srv.id}</div>
                             <div className="text-xs text-neutral-500 mt-1 flex items-center gap-1.5"><User size={12} /> {srv.players} online</div>
                           </div>
                           <button onClick={(e) => toggleFavorite(srv.id, e)} className="text-neutral-600 hover:text-amber-500 p-1 transition-colors">
                             <Star size={18} fill={favoriteServers.includes(srv.id) ? "currentColor" : "none"} />
                           </button>
                         </div>
                       ))}
                     </div>
                   </div>
                   <div className="mb-8">
                     <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-500 mb-4 flex items-center gap-2">
                       <Clock size={14} className="text-neutral-500" /> Recent
                     </h3>
                     <div className="flex flex-wrap gap-2">
                       {recentServers.length > 0 ? recentServers.map(srv => (
                         <button key={srv} onClick={() => joinServer(srv)} className="bg-[#0A0A0B]/60 hover:bg-[#1A1A1E]/80 border border-neutral-800/50 hover:border-neutral-700 px-4 py-2 rounded-xl text-sm font-medium text-neutral-300 hover:text-white transition-colors">
                           {srv}
                         </button>
                       )) : <p className="text-neutral-600 text-sm italic py-1">No recent servers.</p>}
                     </div>
                   </div>
                 </div>
               ) : (
                 <div className="flex flex-col gap-4">
                    <div className="bg-[#1A1A1E] rounded-2xl p-5 border border-emerald-500/30 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                       <div>
                         <h4 className="text-emerald-400 font-bold mb-1">Publish Your World</h4>
                         <p className="text-sm text-neutral-400">Share your custom realm or minigame blueprint with the community.</p>
                       </div>
                       <button onClick={() => publishBlueprint()} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap active:scale-95 shadow-lg shadow-emerald-900/50">Publish World</button>
                    </div>
                                     
                    <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-500 mb-2 mt-4 flex items-center gap-2">
                      <Globe size={14} className="text-emerald-500" /> Community Blueprints
                    </h3>
                    <div className="grid grid-cols-1 gap-4 pb-4">
                      {marketBlueprints.length > 0 ? marketBlueprints.map(bp => (
                         <div key={bp.id} className="bg-[#0A0A0B]/60 hover:bg-[#1A1A1E]/80 border border-neutral-800/50 hover:border-emerald-500/30 p-4 rounded-2xl transition-all flex flex-col gap-3 group">
                            <div className="flex items-center justify-between">
                               <div className="font-bold text-neutral-200 group-hover:text-emerald-400 transition-colors text-lg">{bp.name}</div>
                               <button onClick={() => handleUpvote(bp.id)} className="flex items-center gap-2 text-xs text-neutral-500 hover:text-red-400 bg-black/40 hover:bg-black/60 px-3 py-1.5 rounded-full border border-white/5 hover:border-red-500/30 transition-all active:scale-95 cursor-pointer">
                                  <Heart size={14} className="text-red-500/70" /> {bp.likes || 0}
                               </button>
                            </div>
                            <p className="text-sm text-neutral-400 leading-relaxed italic">{bp.description}</p>
                            <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
                               <span className="text-xs text-neutral-500 flex items-center gap-1.5"><User size={12}/> By {bp.creatorName || 'Unknown'}</span>
                               <button onClick={() => { Sounds.click(); joinServer(bp.roomId); }} className="bg-emerald-600/20 hover:bg-emerald-500 hover:text-white text-emerald-400 px-4 py-1.5 rounded-lg text-xs font-bold transition-all border border-emerald-500/20 hover:border-emerald-500">
                                  Join Instance
                               </button>
                            </div>
                         </div>
                      )) : <p className="text-neutral-600 text-sm italic">Loading blueprints...</p>}
                    </div>
                 </div>
               )}
             </div>
             
             <div className="mt-8 flex gap-3 shrink-0">
               <input
                 type="text"
                 value={joinInput}
                 onChange={(e) => setJoinInput(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && joinServer(joinInput)}
                 className="flex-1 bg-[#0A0A0B]/80 border border-neutral-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-neutral-700 transition-all shadow-inner text-lg placeholder-neutral-600"
                 placeholder="Enter server address..."
               />
               <button
                 onClick={() => joinServer(joinInput)}
                 className="bg-white hover:bg-neutral-200 text-black px-8 py-4 rounded-2xl font-black transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95 flex items-center gap-2 text-lg"
               >
                 Join <ArrowRight size={20}/>
               </button>
             </div>
          </div>
          
          {/* Player Profile Manager */}
          <div className="w-full lg:w-80 flex-shrink-0 flex flex-col text-neutral-300 overflow-y-auto">
            <h2 className="text-2xl font-black text-white tracking-tight mb-8">My Profile</h2>
            
            <div className="bg-[#0A0A0B]/80 rounded-2xl p-6 border border-neutral-800 mb-6">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-500 flex items-center gap-2">
                   <User size={14} className="text-blue-500" /> Active Profile
                 </h3>
              </div>
              <div className="flex flex-col gap-3 mb-6">
                 {profiles.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                          setActiveProfileId(p.id);
                          setNickname(p.name || 'Player');
                          setCharacterSkin(p.skin || 'orange');
                          if (p.hotbar) setHotbar(JSON.parse(p.hotbar));
                          if (p.backpack) setBackpack(JSON.parse(p.backpack));
                          if (p.health !== undefined) setHealth(p.health);
                          if (p.quests) setQuests(JSON.parse(p.quests));
                      }}
                      className={`px-4 py-3 rounded-xl text-left text-sm font-bold border transition-all ${activeProfileId === p.id ? 'border-blue-500/50 bg-blue-900/20 text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200 bg-neutral-900/50'}`}
                    >
                      {p.name || 'Unnamed'} {p.health <= 0 && <span className="text-red-500 font-normal text-xs ml-2">(Dead)</span>}
                    </button>
                 ))}
              </div>
              <div className="flex gap-2">
                 <button
                   onClick={async () => {
                      if (!currentUser) return;
                      const newId = 'prof_' + Date.now();
                      const newName = nickname || 'New Profile';
                      const newSkin = characterSkin || 'orange';
                      
                      const defaultHotbar = [
                         { type: 103 /* BlockType.Fists */, count: 1 },
                         { type: 302 /* BlockType.Gun */, count: 1 },
                         { type: 111 /* BlockType.GrapplingHook */, count: 1 },
                         { type: 304 /* BlockType.Grenade */, count: 64 },
                         { type: 303 /* BlockType.Bullet */, count: 64 },
                         { type: 110 /* BlockType.Arrow */, count: 64 },
                         { type: 34 /* BlockType.TNT */, count: 64 },
                         { type: 31 /* BlockType.Wire */, count: 64 },
                         { type: 32 /* BlockType.PressurePlate */, count: 64 },
                         { type: 100 /* BlockType.WoodPickaxe */, count: 1 },
                         { type: 28 /* BlockType.Platform */, count: 64 },
                         null
                      ];
                      
                      const newProfile = {
                         id: newId,
                         name: newName,
                         skin: newSkin,
                         health: 100,
                         hotbar: JSON.stringify(defaultHotbar),
                         backpack: JSON.stringify(Array(27).fill(null)),
                         quests: JSON.stringify([]),
                         updatedAt: Date.now()
                      };
                      
                          setDoc(doc(db, 'users', currentUser.uid, 'profiles', newId), { ...newProfile, updatedAt: serverTimestamp() });
                      
                      setProfiles([...profiles, newProfile]);
                      setActiveProfileId(newId);
                      setNickname(newName);
                      setCharacterSkin(newSkin);
                      setHotbar(defaultHotbar);
                      setBackpack(Array(27).fill(null));
                      setHealth(20);
                      setQuests(defaultQuests);
                   }}
                   className="px-4 py-2 rounded-xl text-sm font-bold border border-emerald-500/30 bg-emerald-900/20 text-emerald-400 hover:bg-emerald-800/40 transition-all flex items-center justify-center gap-1 w-full"
                 >
                   <Plus size={14} /> New Profile
                 </button>
                 
                 <button
                   onClick={async () => {
                      if (!currentUser || !activeProfileId) return;
                      if (profiles.length <= 1) {
                          alert("You cannot delete your only profile.");
                          return;
                      }
                      if (!window.confirm("Are you sure you want to delete this profile? This action cannot be undone.")) return;
                      
                      const newProfiles = profiles.filter(p => p.id !== activeProfileId);
                      setProfiles(newProfiles);
                      
                      const newActive = newProfiles[0];
                      setActiveProfileId(newActive.id);
                      setNickname(newActive.name || 'Player');
                      setCharacterSkin(newActive.skin || 'orange');
                      if (newActive.hotbar) setHotbar(JSON.parse(newActive.hotbar));
                      if (newActive.backpack) setBackpack(JSON.parse(newActive.backpack));
                      if (newActive.health !== undefined) setHealth(newActive.health);
                      if (newActive.quests) setQuests(JSON.parse(newActive.quests));
                      
                          deleteDoc(doc(db, 'users', currentUser.uid, 'profiles', activeProfileId));
                   }}
                   className="px-4 py-2 rounded-xl text-sm font-bold border border-red-500/30 bg-red-900/20 text-red-400 hover:bg-red-800/40 transition-all flex items-center justify-center gap-1"
                 >
                   <X size={14} /> Delete
                 </button>
              </div>

              <div className="grid grid-cols-1 gap-6 mt-6">
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1 mb-2 block">Display Name</label>
                  <div className="flex gap-2">
                     <input 
                        type="text" 
                        value={nickname}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNickname(val);
                          if (activeProfileId) {
                             setProfiles(profiles.map(p => p.id === activeProfileId ? { ...p, name: val } : p));
                          }
                        }}
                        className="flex-1 bg-[#0A0A0B]/80 border border-neutral-800 text-neutral-200 rounded-2xl pl-5 pr-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-neutral-700 transition-all shadow-inner text-lg placeholder-neutral-600"
                        placeholder="Enter Nickname..."
                        maxLength={16}
                     />
                     {activeProfileId && (
                         <button
                           onClick={saveProgress}
                           className="bg-blue-600/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-2xl px-6 font-bold transition-all"
                         >
                           Save
                         </button>
                     )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1 mb-2 block">Character Skin</label>
                  <div className="flex flex-wrap gap-2 pt-2">
                     {availableSkins.map(skin => (
                        <button 
                          key={skin.id}
                          onClick={() => {
                            setCharacterSkin(skin.id);
                            if (activeProfileId) {
                               setProfiles(profiles.map(p => p.id === activeProfileId ? { ...p, skin: skin.id } : p));
                            }
                          }}
                          className={`w-10 h-10 rounded-full border-2 transition-all ${characterSkin === skin.id ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-transparent hover:scale-105'}`}
                          style={{ backgroundColor: skin.color }}
                          title={skin.name}
                        />
                     ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#0A0A0B]/80 rounded-2xl p-6 border border-neutral-800 mb-6">
              <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-500 mb-4 flex items-center gap-2">
                <Heart size={14} className="text-red-500" /> Vitals
              </h3>
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }).map((_, i) => {
                  const val = i * 2;
                  if (health >= val + 2) {
                     return <Heart key={i} size={20} className="text-red-500 fill-red-500" />;
                  } else if (health === val + 1) {
                     return (
                       <div key={i} className="relative w-5 h-5">
                         <Heart size={20} className="absolute text-neutral-800 fill-neutral-800" />
                         <div className="absolute w-1/2 h-full overflow-hidden">
                            <Heart size={20} className="text-red-500 fill-red-500" />
                         </div>
                       </div>
                     );
                  } else {
                     return <Heart key={i} size={20} className="text-neutral-800 fill-neutral-800" />;
                  }
                })}
              </div>
              <div className="text-xs text-neutral-500 mt-2">{health} / 20 HP</div>
            </div>

            <div className="bg-[#0A0A0B]/80 rounded-2xl p-6 border border-neutral-800 mb-6">
              <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-500 mb-4 flex items-center gap-2">
                <Scroll size={14} className="text-amber-500" /> Quests Progress
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium text-neutral-300">Completed</span>
                  <span className="text-lg font-black text-white">{quests.filter(q => q.completed).length} <span className="text-neutral-600 text-sm font-medium">/ {quests.length}</span></span>
                </div>
                <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${quests.length > 0 ? (quests.filter(q => q.completed).length / quests.length) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
            
            <div className="bg-[#0A0A0B]/80 rounded-2xl p-6 border border-neutral-800">
              <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-500 mb-4 flex items-center gap-2">
                <Book size={14} className="text-blue-500" /> Latest Log
              </h3>
              <div className="text-sm text-neutral-400">
                You are currently placed in <span className="text-blue-400 font-bold">{saveStateRef.current.serverName || 'public-lobby'}</span>.
              </div>
            </div>
            
            {isAdmin && (
              <button onClick={() => setShowAdminPanel(true)} className="bg-red-600/20 hover:bg-red-600/40 text-red-400 py-3 rounded-2xl text-sm font-bold border border-red-500/30 transition-colors mt-6 w-full flex justify-center items-center gap-2">
                <Shield size={18} /> Open Admin Panel
              </button>
            )}

            {isAdmin && showAdminPanel && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                 <div className="bg-[#141417] p-8 rounded-[2.5rem] border border-red-900/50 shadow-2xl max-w-md w-full relative">
                    <button onClick={() => setShowAdminPanel(false)} className="absolute top-6 right-6 text-neutral-500 hover:text-white">
                       <X size={24} />
                    </button>
                    <h2 className="text-2xl font-black text-red-500 mb-6 flex items-center gap-2">
                      <Shield size={28} /> Admin Dashboard
                    </h2>
                    <div className="flex flex-col gap-4">
                      <button onClick={() => handleAdminClick('Wipe World Data')} className="bg-red-600/20 hover:bg-red-600/40 text-red-400 py-3 rounded-xl text-sm font-bold border border-red-500/30 transition-colors">Wipe Targeted World</button>
                      <button onClick={() => handleAdminClick('Manage Players')} className="bg-red-600/20 hover:bg-red-600/40 text-red-400 py-3 rounded-xl text-sm font-bold border border-red-500/30 transition-colors">Manage Players</button>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

      
  const countAmmo = (type: number) => {
      let count = 0;
      hotbar.forEach(s => { if(s && s.type === type) count += s.count; });
      backpack.forEach(s => { if(s && s.type === type) count += s.count; });
      return count;
  };
  const currentAmmoCount = 
      selectedBlock === 302 ? countAmmo(303) :
      selectedBlock === 109 ? countAmmo(110) :
      selectedBlock === 304 ? countAmmo(304) : 1;

  
  const filteredRecipes = RECIPES.filter(recipe => {
     const name = BlockNames[recipe.result].toLowerCase();
     return name.includes(recipeSearchQuery.toLowerCase());
  });

  
  const getHelmet = () => equipment[0] ? equipment[0].type : null;
  const getChestplate = () => equipment[1] ? equipment[1].type : null;


  
  const handleArmorDamage = () => {
    // Decrease durability of currently active armor
    const hType = getHelmet();
    const cType = getChestplate();
    
    let damaged = false;
    
    const applyDamageToArr = (arr) => {
      let updated = false;
      const newArr = arr.map(slot => {
         if (!slot) return null;
         if (slot.type === hType || slot.type === cType) {
            // Apply durability damage
            const maxDurability = slot.type === BlockType.DiamondHelmet || slot.type === BlockType.DiamondChestplate ? 150 :
                                  slot.type === BlockType.GoldHelmet || slot.type === BlockType.GoldChestplate ? 40 : 50;
            const currentDurability = slot.durability !== undefined ? slot.durability : maxDurability;
            
            if (currentDurability <= 1) {
               updated = true;
               damaged = true;
               return null; // Armor broke
            } else {
               updated = true;
               damaged = true;
               return { ...slot, durability: currentDurability - 1 };
            }
         }
         return slot;
      });
      return { arr: newArr, updated };
    };
    
    const { arr: newEquipment, updated: eUpdated } = applyDamageToArr(equipment);
    if (eUpdated) setEquipment(newEquipment);
  };

  const helmetType = getHelmet();
  const chestplateType = getChestplate();

  return (
    <div className="w-full h-screen bg-neutral-900 flex flex-col overflow-hidden font-sans select-none touch-none" style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}>
      
      {/* Main Game Area */}
      <div className="flex-1 relative">

        <GameCanvas
          helmet={helmetType}
          chestplate={chestplateType}
          onArmorDamage={handleArmorDamage}
          currentAmmoCount={currentAmmoCount} 
          nickname={nickname} 
          selectedBlock={selectedBlock} 
          roomId={serverName} 
          isInventoryOpen={inventoryOpen || showInstructions || furnaceOpen || chestOpen || merchantOpen}
          onHealthChange={setHealth}

          onTradeRequest={(senderId, senderName) => addNotification('trade', senderId, senderName)}
          onGangInvite={(senderId, senderName) => addNotification('gang', senderId, senderName)}
          onFriendRequest={(senderId, senderName) => addNotification('friend', senderId, senderName)}

          onDuelRequest={(senderId, senderName) => addNotification('duel', senderId, senderName)}
          onDuelStarted={(opponentId, opponentName) => {
             setChatMessages(prev => [...prev, { id: Math.random().toString(), sender: 'System', text: 'Duel started against ' + opponentName + '!', timestamp: Date.now() }]);
             setDuelingOpponents(prev => [...prev, opponentId]);
          }}
          onChestData={(tx, ty, inventory) => {
             setChestInventory(inventory || Array(27).fill(null));
             setActiveChestCoords({tx, ty});
             setChestOpen(true);
             Sounds.openChest();
          }}
          onMobKilled={(type) => {
             setKills(prev => prev + 1);
          }}
          onChestUpdated={(tx, ty, inventory) => {
             if (activeChestCoords?.tx === tx && activeChestCoords?.ty === ty) {
                setChestInventory(inventory);
             }
          }}

          onFireWeapon={handleFireWeapon}

          sendChatMsg={sendChatMsg}
          onChatMessage={(msg) => setChatMessages(prev => [...prev.slice(-9), msg])}
          socketRef={socketRef}
          
          
          onBlockPlaced={(blockType) => {
            Sounds.placeBlock();
            setHotbar(prev => {
               const newHotbar = [...prev];
               const slot = newHotbar[selectedSlotIndex];
               if (slot && slot.type === blockType) {
                   if (slot.count > 1) {
                       newHotbar[selectedSlotIndex] = { ...slot, count: slot.count - 1 };
                   } else {
                       newHotbar[selectedSlotIndex] = null;
                       // Change selected block if empty? We probably don't need to, but it will be handled by selectedBlock computation
                   }
               }
               return newHotbar;
            });
          }}

          onPlayerInteract={(playerId, playerName) => {
            setInteractPlayerId(playerId);
            setInteractPlayerName(playerName);
          }}
          onBlockMined={(minedBlockType) => {
            let blockType = minedBlockType;
            if (minedBlockType === BlockType.CoalOre) blockType = BlockType.Coal;
            if (minedBlockType === BlockType.DiamondOre) blockType = BlockType.Diamond;
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
            if (blockType === BlockType.BlueCrystal) {
               setQuests(prev => prev.map(q => {
                 if (q.id === 'q5' && !q.completed && q.prerequisiteId && prev.find(p => p.id === q.prerequisiteId)?.completed) {
                   const newCount = q.current + 1;
                   if (newCount >= q.goal && !q.completed) {
                     setNotifications(n => [...n, { id: Math.random().toString(), type: 'system', senderName: 'System', timestamp: Date.now(), msg: 'Magic Unlocked!' }]);
                   }
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

            
            
            
            const isEquipable = checkEquipable(blockType);
            
            // 1. Try to stack in hotbar
            setHotbar(prevHotbar => {
               const newHotbar = [...prevHotbar];
               let added = false;
               if (!isEquipable) {
                 for (let i = 0; i < newHotbar.length; i++) {
                   if (newHotbar[i] && newHotbar[i].type === blockType && newHotbar[i].count < 64) {
                     newHotbar[i] = { ...newHotbar[i], count: newHotbar[i].count + 1 };
                     added = true;
                     break;
                   }
                 }
               }
               if (!added) {
                 const emptyIdx = newHotbar.indexOf(null);
                 if (emptyIdx !== -1) {
                   newHotbar[emptyIdx] = { type: blockType, count: 1 };
                   added = true;
                 }
               }
               
               if (!added) {
                  // Fallback to backpack
                  setBackpack(prevBp => {
                     const newBp = [...prevBp];
                     let bpAdded = false;
                     if (!isEquipable) {
                       for (let i = 0; i < newBp.length; i++) {
                         if (newBp[i] && newBp[i].type === blockType && newBp[i].count < 64) {
                           newBp[i] = { ...newBp[i], count: newBp[i].count + 1 };
                           bpAdded = true;
                           break;
                         }
                       }
                     }
                     if (!bpAdded) {
                       const emptyIdx = newBp.indexOf(null);
                       if (emptyIdx !== -1) {
                         newBp[emptyIdx] = { type: blockType, count: 1 };
                         bpAdded = true;
                       }
                     }
                     return bpAdded ? newBp : prevBp;
                  });
               }
               
               return added ? newHotbar : prevHotbar;
            });


            
            

          }}
          onInteract={(blockType, tx, ty) => {
            if (blockType === BlockType.Merchant) {
              setMerchantOpen(true);
            }
            if (blockType === BlockType.Furnace) {
              setFurnaceOpen(true);
            }
            if (blockType === BlockType.Chest) {
              if (socketRef.current) {
                socketRef.current.emit('open_chest', { tx, ty });
              }
            }
            if (blockType === BlockType.QuestNPC || blockType === BlockType.GuideNPC || blockType === BlockType.GoblinNPC || blockType === BlockType.WizardNPC) {
              setShowNPCMessage(true);
            }
            if (blockType === BlockType.DurelNPC) {
              alert("DUREL: YOU HAVE SLAIN " + (kills || 0) + " CREATURES SO FAR!");
            }
            if (blockType === BlockType.TreeSeed || blockType === BlockType.CarrotSeed) {
              // Consume seed
              const seedType = blockType;
              const consumeSeed = (inv) => {
                 for (let i = 0; i < inv.length; i++) {
                   if (inv[i] && inv[i].type === seedType) {
                     const newCount = inv[i].count - 1;
                     inv[i] = newCount > 0 ? { ...inv[i], count: newCount } : null;
                     return true;
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
            } else if (false) {
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

                {/* Left Action Bar */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-xl border border-white/10 flex flex-col gap-1 z-10">
           <div className="text-[9px] text-white/50 text-center uppercase tracking-tighter w-12 pb-1 border-b border-white/10 mb-1 leading-tight">Ctrl+T<br/>Bind</div>
           {leftActionBar.map((slot, index) => (
             <button
               key={'l'+index}
               onClick={() => { if (inventoryOpen) handleSlotClick('leftActionBar', index); }}
               onContextMenu={(e) => { e.preventDefault(); if (inventoryOpen) handleSlotClick('leftActionBar', index, true); }}
               className="w-12 h-12 p-1.5 rounded-lg relative bg-black/50 hover:bg-white/10 transition-colors"
             >
               {renderBlockIcon(slot)}
             </button>
           ))}
        </div>

        {/* Right Action Bar */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-xl border border-white/10 flex flex-col gap-1 z-10">
           <div className="text-[9px] text-white/50 text-center uppercase tracking-tighter w-12 pb-1 border-b border-white/10 mb-1 leading-tight">Ctrl+Y<br/>Bind</div>
           {rightActionBar.map((slot, index) => (
             <button
               key={'r'+index}
               onClick={() => { if (inventoryOpen) handleSlotClick('rightActionBar', index); }}
               onContextMenu={(e) => { e.preventDefault(); if (inventoryOpen) handleSlotClick('rightActionBar', index, true); }}
               className="w-12 h-12 p-1.5 rounded-lg relative bg-black/50 hover:bg-white/10 transition-colors"
             >
               {renderBlockIcon(slot)}
             </button>
           ))}
        </div>

        {/* Health Bar */}
        <div className="absolute top-4 right-4 flex gap-0.5">
          {Array.from({ length: 10 }).map((_, i) => {
             const val = i * 2;
             if (health >= val + 2) {
                return <Heart key={i} className="w-6 h-6 fill-red-500 text-red-500 stroke-red-500 stroke-2" />;
             } else if (health === val + 1) {
                return (
                  <div key={i} className="relative w-6 h-6">
                    <Heart className="absolute w-6 h-6 fill-transparent text-neutral-500 stroke-neutral-500 stroke-2" />
                    <div className="absolute w-1/2 h-full overflow-hidden">
                       <Heart className="w-6 h-6 fill-red-500 text-red-500 stroke-red-500 stroke-2" />
                    </div>
                  </div>
                );
             } else {
                return <Heart key={i} className="w-6 h-6 fill-transparent text-neutral-500 stroke-neutral-500 stroke-2" />;
             }
          })}
        </div>

        {/* Mana Bar */}
        {quests.find(q => q.id === 'q5')?.completed && (
          <div className="absolute top-12 right-4 flex gap-2 items-center bg-black/40 px-3 py-1.5 rounded-full border border-blue-500/30">
             <span className="text-[10px] uppercase font-black text-blue-400 tracking-wider">Mana</span>
             <div className="w-32 h-2.5 bg-neutral-800/80 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300" style={{ width: `${mana}%` }}></div>
             </div>
          </div>
        )}

        {/* Chat System */}
        <div className="absolute bottom-24 left-4 w-72 z-10 flex flex-col justify-end pointer-events-none">
           <div className="flex flex-col gap-1 mb-2 max-h-48 overflow-y-auto">
             {chatMessages.map((msg, idx) => (
               <div key={idx} className="bg-black/40 text-white text-sm px-2 py-1 rounded w-fit break-all">
                 <span className="opacity-50 text-xs mr-2">{msg.sender}:</span>
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
                onContextMenu={(e) => { e.preventDefault(); if (inventoryOpen) handleSlotClick('hotbar', index, true); }}
                className={`w-12 h-12 p-1.5 rounded-lg relative transition-all duration-200 ${
                  isSelected 
                    ? 'ring-2 ring-white scale-110 bg-white/20 z-10' 
                    : 'hover:bg-white/10 opacity-70 hover:opacity-100 bg-black/50'
                }`}
              >
                <div className="absolute -top-1 -left-1 text-[9px] font-black bg-black/60 text-white w-4 h-4 flex items-center justify-center rounded border border-white/20 shadow-sm">{index + 1}</div>
                {renderBlockIcon(slot)}
              </button>
            );
          })}
        </div>
        {/* Inventory Modal Overlay */}
        {inventoryOpen && (
          <div 
             className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40"
             onMouseDown={(e) => {
               if (e.target === e.currentTarget) {
                 setInventoryOpen(false);
                 returnCursorItemToInventory(cursorItem);
               }
             }}
          >
            <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
              
              <div className="flex gap-4 border-b border-neutral-700 pb-2 justify-between items-center w-full">
                <div className="flex gap-4">
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
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-neutral-700">
                    <button onClick={() => setIsMuted(!isMuted)} className="text-neutral-400 hover:text-white transition-colors">
                      {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <input 
                      type="range" 
                      min="0" max="1" step="0.01" 
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                         setVolume(parseFloat(e.target.value));
                         if (parseFloat(e.target.value) > 0) setIsMuted(false);
                      }}
                      className="w-24 accent-emerald-500 h-1.5 bg-neutral-600 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <button 
                    onClick={() => { saveProgress(); setAppState('serverBrowser'); }}
                    className="bg-red-600/80 hover:bg-red-500 text-white text-sm font-bold py-1.5 px-4 rounded shadow-lg backdrop-blur transition-opacity flex items-center gap-2"
                  >
                    <LogOut size={16} /> Leave World
                  </button>
                </div>
              </div>

              {inventoryTab === 'crafting' ? (
                <>

                  <div className="flex gap-8">
                    {/* Equipment Expand Button */}
                    <div className="flex flex-col gap-2 justify-center">
                       <button onClick={() => setShowEquipment(!showEquipment)} className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 p-2 rounded-lg text-neutral-400 hover:text-white transition-colors" title="Toggle Equipment">
                          <User size={20} />
                       </button>
                    </div>
                    {showEquipment && (
                      <div className="flex flex-col items-center gap-4 bg-neutral-900 p-4 rounded-lg border border-neutral-700 min-w-[140px]">
                         <h3 className="text-white font-bold w-full text-center">Equipment</h3>
                         <div className="flex flex-col gap-4 mt-2">
                           <div className="flex flex-col items-center gap-1 relative">
                             <span className="text-[10px] text-neutral-500 uppercase tracking-wider absolute -top-4">Helmet</span>
                             <button
                               onClick={() => handleSlotClick('equipment', 0)}
                               onContextMenu={(e) => { e.preventDefault(); handleSlotClick('equipment', 0, true); }}
                               className="w-14 h-14 p-1.5 bg-black/60 rounded-lg border border-neutral-700 hover:bg-white/10 transition-colors flex items-center justify-center shadow-inner"
                             >
                               {renderBlockIcon(equipment[0])}
                             </button>
                           </div>
                           <div className="flex flex-col items-center gap-1 relative mt-2">
                             <span className="text-[10px] text-neutral-500 uppercase tracking-wider absolute -top-4">Chestplate</span>
                             <button
                               onClick={() => handleSlotClick('equipment', 1)}
                               onContextMenu={(e) => { e.preventDefault(); handleSlotClick('equipment', 1, true); }}
                               className="w-14 h-14 p-1.5 bg-black/60 rounded-lg border border-neutral-700 hover:bg-white/10 transition-colors flex items-center justify-center shadow-inner"
                             >
                               {renderBlockIcon(equipment[1])}
                             </button>
                           </div>
                         </div>
                      </div>
                    )}
                    {/* Crafting Grid */}

                    <div>
                      <h3 className="text-white font-bold mb-3">Crafting</h3>
                      <div className="flex items-center gap-4 bg-neutral-900 p-4 rounded-lg border border-neutral-700">
                        <div className="grid grid-cols-3 gap-1">
                          {craftingGrid.map((slot, i) => (
                            <button
                              key={i}
                              onClick={() => handleSlotClick('crafting', i)}
                            onContextMenu={(e) => { e.preventDefault(); handleSlotClick('crafting', i, true); }}
                              className="w-12 h-12 p-1.5 bg-black/50 rounded-md hover:bg-white/10 transition-colors"
                            >
                              {renderBlockIcon(slot)}
                            </button>
                          ))}
                        </div>
                        <ArrowRight className="text-neutral-500 w-8 h-8" />
                        <button
                          onClick={() => handleSlotClick('craftingResult', 0)}
                      onContextMenu={(e) => { e.preventDefault(); handleSlotClick('craftingResult', 0, true); }}
                          className="w-16 h-16 p-2 bg-black/50 rounded-lg border border-neutral-600 hover:bg-white/10 transition-colors"
                        >
                          {craftingResult ? renderBlockIcon(craftingResult.result) : null}
                        </button>
                      </div>
                    </div>

                    {/* Backpack Grid */}
                    <div>
                      
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-white font-bold">Inventory</h3>
                        <button 
                          onClick={handleSortInventory}
                          className="bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 px-3 py-1.5 rounded flex items-center gap-2 border border-neutral-700 transition-colors"
                        >
                          <Layers size={14} /> Sort Items
                        </button>
                      </div>

                      <div className="grid grid-cols-9 gap-1 bg-neutral-900 p-2 rounded-lg border border-neutral-700 h-fit">
                        {backpack.map((slot, i) => (
                          <button
                            key={i}
                            onClick={() => handleSlotClick('backpack', i)}
                            onContextMenu={(e) => { e.preventDefault(); handleSlotClick('backpack', i, true); }}
                            className="w-12 h-12 p-1.5 bg-black/50 rounded-md hover:bg-white/10 transition-colors"
                          >
                            {renderBlockIcon(slot)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Hotbars (in Modal) */}
                  <div className="flex gap-4">
                    <div>
                      <h3 className="text-white font-bold mb-3">Hotbar</h3>
                      <div className="grid grid-cols-9 gap-1 bg-neutral-900 p-2 rounded-lg border border-neutral-700">
                        {hotbar.map((slot, i) => (
                          <button
                            key={i}
                            onClick={() => handleSlotClick('hotbar', i)}
                            onContextMenu={(e) => { e.preventDefault(); handleSlotClick('hotbar', i, true); }}
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
                    
                    <div>
                      <h3 className="text-white font-bold mb-3">Left Bar</h3>
                      <div className="grid grid-cols-5 gap-1 bg-neutral-900 p-2 rounded-lg border border-neutral-700">
                        {leftActionBar.map((slot, i) => (
                          <button
                            key={'lm'+i}
                            onClick={() => handleSlotClick('leftActionBar', i)}
                            onContextMenu={(e) => { e.preventDefault(); handleSlotClick('leftActionBar', i, true); }}
                            className="w-12 h-12 p-1.5 bg-black/50 rounded-md hover:bg-white/10 transition-colors relative"
                          >
                            {renderBlockIcon(slot)}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-white font-bold mb-3">Right Bar</h3>
                      <div className="grid grid-cols-5 gap-1 bg-neutral-900 p-2 rounded-lg border border-neutral-700">
                        {rightActionBar.map((slot, i) => (
                          <button
                            key={'rm'+i}
                            onClick={() => handleSlotClick('rightActionBar', i)}
                            onContextMenu={(e) => { e.preventDefault(); handleSlotClick('rightActionBar', i, true); }}
                            className="w-12 h-12 p-1.5 bg-black/50 rounded-md hover:bg-white/10 transition-colors relative"
                          >
                            {renderBlockIcon(slot)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              
              ) : (
                <div className="flex flex-col h-full">
                  <div className="mb-4">
                     <input 
                       type="text" 
                       placeholder="Search recipes..." 
                       value={recipeSearchQuery}
                       onChange={(e) => setRecipeSearchQuery(e.target.value)}
                       className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-neutral-500"
                     />
                  </div>
                  <div className="overflow-y-auto custom-scrollbar pr-2 flex-1 min-h-[300px]">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {filteredRecipes.map((recipe, index) => (
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
          <div 
             className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40"
             onMouseDown={(e) => {
               if (e.target === e.currentTarget) {
                 setChestOpen(false);
                 setActiveChestCoords(null);
                 if (cursorItem) returnCursorItemToInventory(cursorItem);
               }
             }}
          >
            <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <button 
                onClick={() => {
                  setChestOpen(false);
                  setActiveChestCoords(null);
                  if (cursorItem) {
                    returnCursorItemToInventory(cursorItem);
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
                    onClick={() => handleSlotClick('chest', i)}
                            onContextMenu={(e) => { e.preventDefault(); handleSlotClick('chest', i, true); }}
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
                      onClick={() => handleSlotClick('backpack', i)}
                            onContextMenu={(e) => { e.preventDefault(); handleSlotClick('backpack', i, true); }}
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
                      onClick={() => handleSlotClick('hotbar', i)}
                            onContextMenu={(e) => { e.preventDefault(); handleSlotClick('hotbar', i, true); }}
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
        
      {/* Player Interaction Modal */}
      {interactPlayerId && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-neutral-800">
               <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center border-2 border-emerald-500/30">
                  <User size={32} className="text-emerald-500/50" />
               </div>
               <div>
                  <h3 className="text-2xl font-bold text-white">{interactPlayerName}</h3>
                  <div className="flex gap-3 mt-2">
                     <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">Online</span>
                  </div>
               </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  if (socketRef.current) socketRef.current.emit('send_trade_request', { targetId: interactPlayerId });
                  setNotifications(prev => [...prev, { id: Math.random().toString(), type: 'trade', senderId: interactPlayerId, senderName: "System", timestamp: Date.now(), msg: 'Trade request sent.' } as any]);
                  setInteractPlayerId(null);
                }}
                className="w-full bg-amber-600/20 hover:bg-amber-600/40 text-amber-500 py-3 rounded-xl font-bold border border-amber-500/30 transition-colors"
              >
                Request Trade
              </button>
              <button 
                onClick={() => {
                  if (socketRef.current) socketRef.current.emit('send_gang_invite', { targetId: interactPlayerId });
                  setNotifications(prev => [...prev, { id: Math.random().toString(), type: 'gang', senderId: interactPlayerId, senderName: "System", timestamp: Date.now(), msg: 'Gang invite sent.' } as any]);
                  setInteractPlayerId(null);
                }}
                className="w-full bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 py-3 rounded-xl font-bold border border-blue-500/30 transition-colors"
              >
                Invite to Gang
              </button>
              <button 
                onClick={() => {
                  setIsChatOpen(true);
                  if (chatInputRef.current) {
                     chatInputRef.current.value = '/whisper ' + interactPlayerName + ' ';
                     chatInputRef.current.focus();
                  }
                  setInteractPlayerId(null);
                }}
                className="w-full bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 py-3 rounded-xl font-bold border border-purple-500/30 transition-colors"
              >
                Whisper
              </button>
              <button 
                onClick={() => {
                  if (socketRef.current) socketRef.current.emit('send_duel_request', { targetId: interactPlayerId });
                  setNotifications(prev => [...prev, { id: Math.random().toString(), type: 'duel', senderId: interactPlayerId, senderName: "System", timestamp: Date.now(), msg: 'Duel request sent.' } as any]);
                  setInteractPlayerId(null);
                }}
                className="w-full bg-red-600/20 hover:bg-red-600/40 text-red-400 py-3 rounded-xl font-bold border border-red-500/30 transition-colors flex items-center justify-center gap-2"
              >
                <Sword size={18} /> Duel
              </button>
              <button 
                onClick={() => {
                  if (socketRef.current) socketRef.current.emit('send_friend_request', { targetId: interactPlayerId });
                  setNotifications(prev => [...prev, { id: Math.random().toString(), type: 'friend', senderId: interactPlayerId, senderName: "System", timestamp: Date.now(), msg: 'Friend request sent.' } as any]);
                  setInteractPlayerId(null);
                }}
                className="w-full bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 py-3 rounded-xl font-bold border border-emerald-500/30 transition-colors"
              >
                Add Friend
              </button>
              <button 
                onClick={() => setInteractPlayerId(null)}
                className="w-full bg-neutral-800 hover:bg-neutral-700 text-white py-3 rounded-xl font-bold transition-colors mt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      
      
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

      {merchantOpen && (
          <div 
             className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40"
             onMouseDown={(e) => {
               if (e.target === e.currentTarget) {
                 setMerchantOpen(false);
                 returnCursorItemToInventory(cursorItem);
               }
             }}
          >
            <div className="bg-indigo-900/90 p-6 rounded-xl border border-indigo-500/50 shadow-2xl flex flex-col gap-6 w-[450px] relative">
              <button 
                onClick={() => setMerchantOpen(false)}
                className="absolute top-4 right-4 text-indigo-300 hover:text-white font-bold"
              >✕</button>
              
              <h3 className="text-white font-bold text-xl mb-2 text-center flex justify-center items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" /> Wandering Merchant
              </h3>
              
              <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-indigo-500/30">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-indigo-300 mb-1 font-semibold uppercase">Payment</span>
                  <button
                    onClick={() => handleSlotClick('merchantPayment', 0)}
                    onContextMenu={(e) => { e.preventDefault(); handleSlotClick('merchantPayment', 0, true); }}
                    className="w-16 h-16 p-2 bg-black/50 rounded-lg border border-indigo-500/50 hover:bg-white/10 transition-colors"
                  >
                    {merchantPayment ? renderBlockIcon(merchantPayment) : null}
                  </button>
                </div>
                
                <div className="flex flex-col items-center gap-2">
                   <ArrowRight className="text-indigo-400 w-8 h-8" />
                   <button 
                     onClick={() => { Sounds.click(); handleMerchantTrade(); }}
                     className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                     disabled={!merchantPayment}
                   >
                     TRADE
                   </button>
                </div>
                
                <div className="flex flex-col items-center">
                  <span className="text-xs text-indigo-300 mb-1 font-semibold uppercase">Received</span>
                  <button
                    onClick={() => handleSlotClick('merchantOutput', 0)}
                    onContextMenu={(e) => { e.preventDefault(); handleSlotClick('merchantOutput', 0, true); }}
                    className="w-16 h-16 p-2 bg-black/50 rounded-lg border border-indigo-500/50 hover:bg-white/10 transition-colors"
                  >
                    {merchantOutput ? renderBlockIcon(merchantOutput) : null}
                  </button>
                </div>
              </div>

              <div className="bg-black/40 rounded-xl p-4 border border-indigo-500/20">
                <h4 className="text-xs text-indigo-300 font-bold uppercase mb-2">Available Trades</h4>
                <ul className="text-sm text-indigo-100 space-y-2">
                   <li className="flex justify-between"><span>5 Gold Ingots</span> <span>➔ 1 Diamond</span></li>
                   <li className="flex justify-between"><span>3 Iron Ingots</span> <span>➔ 1 Iron Sword</span></li>
                   <li className="flex justify-between"><span>10 Coal</span> <span>➔ 1 Apple</span></li>
                </ul>
              </div>

            </div>
          </div>
      )}

      
      {/* Notifications Overlay */}
      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
        {notifications.map(n => (
          <div key={n.id} className="bg-black/80 backdrop-blur-md border border-neutral-700 p-4 rounded-xl shadow-2xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="flex items-center gap-3">
               {n.type === 'trade' ? <Star className="text-amber-500 w-5 h-5" /> : n.type === 'friend' ? <Heart className="text-emerald-500 w-5 h-5" /> : <Shield className="text-blue-500 w-5 h-5" />}
               <div>
                 <p className="text-sm font-bold text-white">{n.msg ? n.msg : (n.type === 'trade' ? 'Trade Request' : n.type === 'friend' ? 'Friend Request' : 'Gang Invite')}</p>
                 <p className="text-xs text-neutral-400">{n.msg ? '' : `From ${n.senderName}`}</p>
               </div>
             </div>
             <div className="flex flex-col gap-1">
               <button onClick={() => {
                  setNotifications(prev => prev.filter(x => x.id !== n.id));
                  if (n.type === 'trade') {
                      setIsChatOpen(true);
                      if (chatInputRef.current) {
                          chatInputRef.current.value = 'I accept your trade request!';
                          chatInputRef.current.focus();
                      }
                  } else if (n.type === 'gang') {
                      setSendChatMsg({text: 'I joined your gang!', timestamp: Date.now()});
                      if (socketRef.current) socketRef.current.emit('chat_message', { text: 'I joined your gang!', room: serverName });
                  } else if (n.type === 'friend') {
                      setSendChatMsg({text: 'I accepted your friend request!', timestamp: Date.now()});
                      if (socketRef.current) socketRef.current.emit('chat_message', { text: 'I accepted your friend request!', room: serverName });
                  }
               }} className="bg-emerald-600/80 hover:bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded transition-colors">
                 Accept
               </button>
               <button onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} className="bg-neutral-600/80 hover:bg-neutral-500 text-white text-[10px] px-2 py-0.5 rounded transition-colors">
                 Decline
               </button>
             </div>
          </div>
        ))}
      </div>

      {furnaceOpen && (
          <div 
             className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40"
             onMouseDown={(e) => {
               if (e.target === e.currentTarget) {
                 setFurnaceOpen(false);
                 returnCursorItemToInventory(cursorItem);
               }
             }}
          >
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
                      onClick={() => handleSlotClick('furnaceInput', 0)}
                      onContextMenu={(e) => { e.preventDefault(); handleSlotClick('furnaceInput', 0, true); }}
                      className="w-16 h-16 p-2 bg-black/50 rounded-lg border border-neutral-600 hover:bg-white/10 transition-colors"
                    >
                      {furnaceInput ? renderBlockIcon(furnaceInput) : null}
                    </button>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-neutral-500 mb-1 font-semibold uppercase">Fuel (Coal)</span>
                    <button
                      onClick={() => handleSlotClick('furnaceFuel', 0)}
                      onContextMenu={(e) => { e.preventDefault(); handleSlotClick('furnaceFuel', 0, true); }}
                      className="w-16 h-16 p-2 bg-black/50 rounded-lg border border-neutral-600 hover:bg-white/10 transition-colors"
                    >
                      {furnaceFuel ? renderBlockIcon(furnaceFuel) : null}
                    </button>
                  </div>
                </div>
                
                
                <div className="flex flex-col items-center justify-center w-24">
                   <div className="w-full bg-neutral-800 rounded-full h-2.5 mb-2 border border-neutral-700">
                      <div className="bg-amber-500 h-2.5 rounded-full transition-all duration-200" style={{ width: `${smeltProgress}%` }}></div>
                   </div>
                   <ArrowRight className="text-neutral-500 w-8 h-8" />
                </div>

                
                <div className="flex flex-col items-center">
                  <span className="text-xs text-neutral-500 mb-1 font-semibold uppercase">Output</span>
                  <button
                    onClick={() => handleSlotClick('furnaceOutput', 0)}
                      onContextMenu={(e) => { e.preventDefault(); handleSlotClick('furnaceOutput', 0, true); }}
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
                      onClick={() => handleSlotClick('backpack', i)}
                            onContextMenu={(e) => { e.preventDefault(); handleSlotClick('backpack', i, true); }}
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
                      onClick={() => handleSlotClick('hotbar', i)}
                            onContextMenu={(e) => { e.preventDefault(); handleSlotClick('hotbar', i, true); }}
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
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[100]">
            <div className="bg-[#141417] p-8 md:p-12 rounded-[2.5rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-2xl w-full text-white transform transition-all">
              <div className="text-center mb-10">
                 <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-3 tracking-tight">Welcome to AI Sandbox</h2>
                 <p className="text-neutral-400">Master your controls to survive and thrive.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                 <div className="bg-[#0A0A0B]/80 p-6 rounded-3xl border border-white/5">
                    <h3 className="text-sm uppercase tracking-widest text-neutral-500 font-bold mb-4">Movement & Combat</h3>
                    <ul className="space-y-4">
                      <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white border border-white/5">WASD</span> <span className="text-sm text-neutral-300">Move & Jump</span></li>
                      <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white border border-white/5"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg></span> <span className="text-sm text-neutral-300">Left Click to Mine/Attack</span></li>
                      <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white border border-white/5"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg></span> <span className="text-sm text-neutral-300">Right Click to Place/Interact</span></li>
                    </ul>
                 </div>
                 
                 <div className="bg-[#0A0A0B]/80 p-6 rounded-3xl border border-white/5">
                    <h3 className="text-sm uppercase tracking-widest text-neutral-500 font-bold mb-4">Inventory & UI</h3>
                    <ul className="space-y-4">
                      <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white border border-white/5">E</span> <span className="text-sm text-neutral-300">Open Inventory/Crafting</span></li>
                      <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white border border-white/5">Q</span> <span className="text-sm text-neutral-300">Toss Item</span></li>
                      <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white border border-white/5">1-9</span> <span className="text-sm text-neutral-300">Select Hotbar Slot</span></li>
                      <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white border border-white/5">↵</span> <span className="text-sm text-neutral-300">Open Global Chat</span></li>
                    </ul>
                 </div>
              </div>
              
              <button 
                onClick={() => setShowInstructions(false)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Enter the World <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
