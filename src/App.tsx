import { notificationExpiresAt } from './lib/notifications';
import { readSaved, readSlots } from './lib/profile';
import { Sprites } from './lib/sprites';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BlockType, BlockColors, BlockNames } from './lib/constants';
import { getBlockIcon } from './lib/icons';
import GameCanvas from './components/GameCanvas';
import LandingPage from './components/LandingPage';
import { Heart, MessageSquare, ArrowRight, Hand, LogOut, User, Star, Clock, Globe, Scroll, X, Book, Shield, Plus, Layers, ShoppingBag, Volume2, VolumeX, Sword, Flame, Pickaxe, Activity, Compass, LayoutGrid, Zap, Award, Package, Coins } from 'lucide-react';
import { checkRecipe, RECIPES } from './lib/crafting';
import { Sounds } from './lib/audio';
import { auth, logout, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, deleteDoc, updateDoc, increment, orderBy, query, limit } from 'firebase/firestore';
import { createDefaultCharacterDoc, decodeCharacterDoc, encodeCharacterFields } from './lib/characterSchema';
import { type BarKey, type Bars, bindAbilityKey, getAbility, isAbilitySlot, keyForAbility, makeAbilitySlot, placeAbilityOnBars } from './lib/abilities';
import { CharacterMissingError, StaleCharacterError, createCharacterDoc, readCharacterRevision, saveCharacterDoc } from './lib/characterPersistence';
import { Socket } from 'socket.io-client';
import { UnifiedMenu, UnifiedMenuTab } from './components/UnifiedMenu';
import { ItemTooltip } from './components/ItemTooltip';
import { HUDQuestTracker } from './components/HUDQuestTracker';
import { ActionBarPresets } from './components/ActionBarPresets';
import { HUDPartyOverlay, PartyData } from './components/HUDPartyOverlay';
import { ChannelChat, ChatMessage, ChatChannel } from './components/ChannelChat';
import { Eye, Move, RotateCw } from 'lucide-react';
import { LobbyServerSelector } from './components/LobbyServerSelector';
import { loadHUDLayout, saveHUDLayout, DEFAULT_HUD_LAYOUT, HUDLayoutState } from './lib/hudLayout';
import { HUDEditOverlay } from './components/HUDEditOverlay';
import { DraggableHUDBar } from './components/DraggableHUDBar';
import { DynamicRadar } from './components/DynamicRadar';
import { BuffDebuffTray, ActiveEffect } from './components/BuffDebuffTray';
import { PartyLootRollModal, LootRollItem } from './components/PartyLootRollModal';
import { PlayerInspectModal, InspectedPlayer } from './components/PlayerInspectModal';
import { EnchantmentPrefix, GemType } from './lib/enchanting';

// Class abilities live in src/lib/abilities.tsx (shared by the skill tree, the
// action bars and GameCanvas's cast pipeline).

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
  const [currentParty, setCurrentGang] = useState<any>(null);

  // HUD Layout and Edit Mode
  const [hudLayout, setHudLayout] = useState<HUDLayoutState>(() => loadHUDLayout());
  const [isHUDEditMode, setIsHUDEditMode] = useState(false);

  const handleUpdateHUDLayout = (updated: Partial<HUDLayoutState>) => {
    setHudLayout(prev => {
      const next = { ...prev, ...updated };
      saveHUDLayout(next);
      return next;
    });
  };

  const handleRotateHotbar = (bar: 'hotbar' | 'leftActionBar' | 'rightActionBar') => {
    setHudLayout(prev => {
      const currentRot = prev[bar].rotation;
      const newRot = currentRot === 0 ? 90 : 0;
      const next = {
        ...prev,
        [bar]: { ...prev[bar], rotation: newRot }
      };
      saveHUDLayout(next);
      return next;
    });
  };

  const handleToggleElementVisibility = (elementKey: keyof HUDLayoutState) => {
    setHudLayout(prev => {
      const current = prev[elementKey] || { x: 0, y: 0 };
      const nextVisible = current.visible === false;
      const next: HUDLayoutState = {
        ...prev,
        [elementKey]: { ...current, visible: nextVisible }
      };
      saveHUDLayout(next);
      return next;
    });
  };

  const handleResetHUDLayout = () => {
    setHudLayout(DEFAULT_HUD_LAYOUT);
    saveHUDLayout(DEFAULT_HUD_LAYOUT);
  };

  // Real-time Player Coordinates & Depth for Radar/Compass
  const [playerCoords, setPlayerCoords] = useState({ x: 250, y: 100 });
  const [playerDepth, setPlayerDepth] = useState(0);

  // Active Buffs / Debuffs Tray
  const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([
    { id: 'well-fed', name: 'Well Fed', type: 'buff', duration: 180, maxDuration: 180, icon: 'heart', description: '+10% Health Regen' },
    { id: 'fleetfoot', name: 'Fleetfoot Aura', type: 'buff', duration: 240, maxDuration: 240, icon: 'zap', description: '+15% Movement Speed' }
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveEffects(prev =>
        prev
          .map(e => ({ ...e, duration: e.duration - 1 }))
          .filter(e => e.duration > 0)
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Party Loot Roll Modal State
  const [activeLootRoll, setActiveLootRoll] = useState<LootRollItem | null>(null);

  // Player Inspection Modal State
  const [inspectedPlayer, setInspectedPlayer] = useState<InspectedPlayer | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hasLoadedSave, setHasLoadedSave] = useState(false);
  
  // Game states we want to save
  type InventorySlot = { type?: BlockType; count?: number; durability?: number; isAbility?: boolean; abilityId?: string } | null;
  const [equipment, setEquipment] = useState<InventorySlot[]>([null, null]); // [helmet, chestplate]
  const [hotbar, setHotbar] = useState<InventorySlot[]>([
    null,
    null, null, null, null, null, null, null, null, null
  ]);
  const [leftActionBar, setLeftActionBar] = useState<InventorySlot[]>([
    null, null, null, null, null, null, null, null, null, null
  ]);
  const [rightActionBar, setRightActionBar] = useState<InventorySlot[]>([
    null, null, null, null, null, null, null, null, null, null
  ]);
  const [backpack, setBackpack] = useState<InventorySlot[]>(() => {
    return Array(27).fill(null);
  });
  const [health, setHealth] = useState(20);
  const [gold, setGold] = useState(0);
  const [stamina, setStamina] = useState(100);
  const [keybinds, setKeybinds] = useState<Record<string, string>>({'z':'slash'});
  const [kills, setKills] = useState<Record<string, number>>({});
  const [mana, setMana] = useState(100);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [statPoints, setStatPoints] = useState(0);
  const [skillPoints, setSkillPoints] = useState(0);
  const [abilities, setAbilities] = useState({ slash: 0, fireball: 0, heal: 0, double_jump: 0 });
  const [skills, setSkills] = useState({ strength: 0, dexterity: 0, intelligence: 0 });
  const maxStamina = 100 + (skills.dexterity || 0) * 10;
  
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
       setMana(prev => Math.min(100 + ((skills.intelligence || 0) * 20), prev + 2));
    }, 1000);
    return () => clearInterval(interval);
  }, [appState, quests, skills.intelligence]);
  
  useEffect(() => {
    if (appState === 'playing' && hotbar.length > 0) {
      // Check if they have grappling hook
      const hasHook = hotbar.some(item => item && item.type === 111) || backpack.some(item => item && item.type === 111);
      if (!hasHook) {
        setHotbar(prev => {
          const next = [...prev];
          // Try to find empty slot
          let emptyIdx = next.findIndex(item => !item);
          if (emptyIdx === -1) return prev;

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
          const profilesRef = collection(db, 'users', user.uid, 'characters_v2');
          const profilesSnap = await getDocs(profilesRef);
          // Every stored document passes through the versioned schema: legacy
          // docs migrate forward, forged/corrupt fields are rejected.
          const loadedProfiles = profilesSnap.docs.map(d => {
              const { data } = decodeCharacterDoc({ ...d.data(), id: d.id });
              characterRevisions.current[d.id] = data.revision;
              return data;
          });
          if (loadedProfiles.length > 0) {
              setProfiles(loadedProfiles);
              const remembered = localStorage.getItem(`activeCharacter:${user.uid}`);
              const active = loadedProfiles.find(p => p.id === remembered) || loadedProfiles[0];
              selectProfile(active);
          } else {
             // Create initial profile through the schema's default document.
             const newId = 'prof_' + Date.now();
             const newProfile = createDefaultCharacterDoc({ id: newId, questsJson: JSON.stringify(defaultQuests) });
             const initialRevision = await createCharacterDoc(db, user.uid, newProfile);
             characterRevisions.current[newId] = initialRevision;
             setProfiles([newProfile]);
             selectProfile(newProfile);
          }
        } catch (e) {
          console.error("Error loading progress", e);
        }
        setHasLoadedSave(true);

        
        setAppState(state => state === 'landing' ? 'serverBrowser' : state);
      } else {
        setCurrentUser(null);
        setProfiles([]);
        setActiveProfileId(null);
        setHasLoadedSave(false);
        setAppState('landing');
      }
    });
    
  

  
  

  return () => unsubscribe();
  }, []);


  const [serverName, setServerName] = useState<string>('');
  const [joinInput, setJoinInput] = useState<string>('new-world');
  const [nickname, setNickname] = useState<string>(() => `Player${Math.floor(Math.random() * 10000)}`);

  const [characterSkin, setCharacterSkin] = useState<string>('orange');
  const [playerClass, setPlayerClass] = useState<string>('warrior');
  const [creatorRace, setCreatorRace] = useState<string>('human');
  const [showCharacterCreator, setShowCharacterCreator] = useState(false);

  const getSpriteUrl = (race: string, pClass: string, equipment: any[]) => {
     return Sprites.getPlayerSpritePath(race, pClass, equipment?.[1]?.type ?? equipment?.[1] ?? null);
  };


  const [profiles, setProfiles] = useState<any[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  const [profileError, setProfileError] = useState('');
  const [deletingProfile, setDeletingProfile] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deletedProfileIds = useRef(new Set<string>());
  // Per-character write-revision last known to this tab (stale-write guard).
  const characterRevisions = useRef<Record<string, number>>({});

  function selectProfile(p: any) {
    setActiveProfileId(p.id);
    const uid = auth.currentUser?.uid;
    if (uid) localStorage.setItem(`activeCharacter:${uid}`, p.id);
    setNickname(p.name || 'Player');
    setCharacterSkin(p.skin || 'orange');
    setPlayerClass(p.playerClass || 'warrior');
    setCreatorRace(p.race || 'human');
    setEquipment(readSlots(p.equipment, 2));
    setHotbar(readSlots(p.hotbar, 10));
    setLeftActionBar(readSlots(p.leftActionBar, 10));
    setRightActionBar(readSlots(p.rightActionBar, 10));
    setBackpack(readSlots(p.backpack, 27));
    const loadedQuests = readSaved(p.quests, defaultQuests);
    prevQuestsRef.current = loadedQuests;
    setQuests(loadedQuests);
    setKeybinds(readSaved(p.keybinds, { z: 'slash' }));
    setHealth(p.health ?? 20);
    setGold(p.gold ?? 0);
    setKills(readSaved(p.kills, {}));
    setXp(p.xp ?? 0);
    setLevel(p.level ?? 1);
    setStatPoints(p.statPoints ?? 0);
    setSkillPoints(p.skillPoints ?? 0);
    setSkills(readSaved(p.skills, { strength: 0, dexterity: 0, intelligence: 0 }));
    setAbilities(readSaved(p.abilities, { slash: 0, fireball: 0, heal: 0, double_jump: 0 }));
    setSelectedSlotIndex(0);
    setCursorItem(null);
    setCraftingGrid(Array(9).fill(null));
    setFurnaceInput(null);
    setFurnaceFuel(null);
    setFurnaceOutput(null);
    setNotifications([]);
    setMana(100);
    setStamina(100);
    setProfileError('');
    setConfirmDelete(false);
  }

  async function deleteCharacter() {
    if (!currentUser || !activeProfileId || deletingProfile) return;
    const id = activeProfileId;
    setDeletingProfile(true);
    setProfileError('');
    deletedProfileIds.current.add(id);
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'characters_v2', id));
      delete characterRevisions.current[id];
      const remaining = profiles.filter(p => p.id !== id);
      setProfiles(remaining);
      if (remaining.length) selectProfile(remaining[0]);
      else {
        setActiveProfileId(null);
        localStorage.removeItem(`activeCharacter:${currentUser.uid}`);
        setShowCharacterCreator(true);
      }
    } catch (error) {
      deletedProfileIds.current.delete(id);
      setProfileError('Could not delete character. Please try again.');
      console.error('Character deletion failed', error);
    } finally { setDeletingProfile(false); setConfirmDelete(false); }
  }

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


    const handleSignOut = async () => {
    try {
        await logout();
        setAppState('landing');
        setCurrentUser(null);
    } catch (e) {
        console.error(e);
    }
  };



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
  const [inventoryTab, setInventoryTab] = useState<'crafting' | 'guide' | 'skills'>('crafting');

  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');

  const [furnaceOpen, setFurnaceOpen] = useState(false);

  const [instancesOpen, setInstancesOpen] = useState(false);
  const [readyCheck, setReadyCheck] = useState<{ instanceId: string } | null>(null);

  const [merchantOpen, setMerchantOpen] = useState(false);
  const [merchantPayment, setMerchantPayment] = useState<InventorySlot>(null);
  const [merchantOutput, setMerchantOutput] = useState<InventorySlot>(null);
  const [chestOpen, setChestOpen] = useState(false);
  const [activeChestCoords, setActiveChestCoords] = useState<{tx: number, ty: number} | null>(null);
  const [chestInventory, setChestInventory] = useState<InventorySlot[]>(() => Array(27).fill(null));

  const [showLeftActionBar, setShowLeftActionBar] = useState(false);
  const [showRightActionBar, setShowRightActionBar] = useState(false);

  const saveStateRef = useRef({ gold, equipment, hotbar, leftActionBar, rightActionBar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin, kills, xp, level, statPoints, skillPoints, skills, abilities, keybinds });
  useEffect(() => {
    saveStateRef.current = { gold, equipment, hotbar, leftActionBar, rightActionBar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin, kills, xp, level, statPoints, skillPoints, skills, abilities, keybinds };
  }, [gold, equipment, hotbar, leftActionBar, rightActionBar, backpack, quests, health, serverName, currentUser, appState, activeProfileId, nickname, characterSkin, kills, xp, level, statPoints, skillPoints, skills, abilities, keybinds]);

  const saveProgress = async () => {
    const latest = saveStateRef.current;
    if (!latest.currentUser || !latest.activeProfileId || deletedProfileIds.current.has(latest.activeProfileId)) return;
    const profileId = latest.activeProfileId;
    const uid = latest.currentUser.uid;
    try {
      // Validate through the versioned schema before anything reaches Firestore.
      const fields = encodeCharacterFields({
        gold: latest.gold,
        equipment: latest.equipment,
        hotbar: latest.hotbar,
        leftActionBar: latest.leftActionBar,
        rightActionBar: latest.rightActionBar,
        backpack: latest.backpack,
        health: latest.health,
        quests: latest.quests,
        keybinds: latest.keybinds,
        kills: latest.kills,
        xp: latest.xp,
        level: latest.level,
        statPoints: latest.statPoints,
        skillPoints: latest.skillPoints,
        skills: latest.skills,
        abilities: latest.abilities,
        name: latest.nickname,
        skin: latest.characterSkin,
        lastRoom: latest.serverName || 'public-lobby',
        updatedAt: serverTimestamp()
      });
      // Keep the lobby snapshot current, including when leaving before autosave fires.
      setProfiles(items => items.map(p => p.id === profileId ? { ...p, ...fields } : p));

      // Revision-guarded save: a lagging tab cannot clobber a newer write.
      const expected = characterRevisions.current[profileId] ?? 0;
      try {
        characterRevisions.current[profileId] = await saveCharacterDoc(db, uid, profileId, fields, expected);
        setProfileError('');
        console.log("Progress auto-saved.");
        return;
      } catch (e) {
        if (e instanceof CharacterMissingError) {
          setProfileError('This character no longer exists; it may have been deleted in another session.');
          return;
        }
        if (!(e instanceof StaleCharacterError)) throw e;
      }
      // Another session wrote first: adopt its revision, then retry once.
      const remote = await readCharacterRevision(db, uid, profileId);
      if (remote === null) {
        setProfileError('This character no longer exists; it may have been deleted in another session.');
        return;
      }
      characterRevisions.current[profileId] = await saveCharacterDoc(db, uid, profileId, fields, remote);
      setProfileError('');
      console.log("Progress auto-saved after revision sync.");
    } catch (e) {
      if (e instanceof StaleCharacterError) {
        setProfileError('Another session saved this character at the same time; your changes are still in memory and will save on the next change.');
      } else {
        console.error("Failed to auto-save progress", e);
      }
    }
  };

  useEffect(() => {
    if (!currentUser || !hasLoadedSave || appState !== 'playing') return;
    const timeout = setTimeout(saveProgress, 2000);
    return () => clearTimeout(timeout);
  }, [currentUser, hasLoadedSave, appState, gold, equipment, hotbar, leftActionBar, rightActionBar, backpack, quests, health, xp, level, statPoints, skillPoints, skills, abilities, keybinds, kills]);

  const socketRef = useRef<Socket | null>(null);
  // `index` is the slot position for bars/containers, or the ability id for skill-tree cards (type 'ability').
  const hoveredSlotRef = useRef<{type: string, index: number | string} | null>(null);
  const [furnaceInput, setFurnaceInput] = useState<InventorySlot>(null);
  const [furnaceFuel, setFurnaceFuel] = useState<InventorySlot>(null);
  const [furnaceOutput, setFurnaceOutput] = useState<InventorySlot>(null);
  const [cursorItem, setCursorItem] = useState<InventorySlot>(null);
  const [draggedItemInfo, setDraggedItemInfo] = useState<{type: string, index: number | string} | null>(null);

  /**
   * Merge an item stack into a backpack array (stacking onto matching items
   * first, then the first empty slot). Returns the new array plus how much
   * did not fit. Ability slots are never stashed: they are not items and can
   * be re-added from the skill tree at any time.
   */
  const stashInBackpack = (item: InventorySlot, current: InventorySlot[]): { next: InventorySlot[]; remaining: number } => {
     if (!item || item.type === 0 || isAbilitySlot(item)) return { next: current, remaining: 0 };
     const next = [...current];
     let remaining = item.count;
     for (let i = 0; i < next.length && remaining > 0; i++) {
        if (next[i] && !isAbilitySlot(next[i]) && next[i].type === item.type && next[i].count < 64) {
           const add = Math.min(remaining, 64 - next[i].count);
           next[i] = { ...next[i], count: next[i].count + add };
           remaining -= add;
        }
     }
     if (remaining > 0) {
        const empty = next.findIndex(s => !s);
        if (empty !== -1) {
           next[empty] = { type: item.type, count: remaining, durability: item.durability };
           remaining = 0;
        }
     }
     return { next, remaining };
  };

  const returnCursorItemToInventory = (item) => {
     if (!item || item.type === 0) return;
     setBackpack(prev => stashInBackpack(item, prev).next);
     setCursorItem(null);
  };

  // --- Ability placement & keybinds -------------------------------------
  // Abilities live on the three action bars as ability slots (see
  // lib/abilities.tsx). Everything that puts one on a bar goes through
  // makeAbilitySlot / placeAbilityOnBars so slots always have the canonical,
  // persistable shape.
  const bars: Bars = { hotbar, leftActionBar, rightActionBar };
  const setBar = (bar: BarKey, next: InventorySlot[]) => {
    if (bar === 'hotbar') setHotbar(next);
    else if (bar === 'leftActionBar') setLeftActionBar(next);
    else setRightActionBar(next);
  };

  /** Bind a key to an ability; returns false for reserved keys / unknown abilities. */
  const bindKeyToAbility = (key: string, abilityId: string): boolean => {
    // bindAbilityKey is pure and returns its input untouched when it refuses.
    if (bindAbilityKey(keybinds, key, abilityId) === keybinds) return false;
    setKeybinds(prev => bindAbilityKey(prev, key, abilityId));
    Sounds.slotClick();
    return true;
  };

  /** "Add to Bar": first free slot on the hotbar, then the side bars. */
  const handleAddAbilityToBar = (abilityId: string) => {
    const result = placeAbilityOnBars(bars, abilityId);
    if (result.ok === true) {
      setBar(result.bar, result.bars[result.bar]);
      if (result.bar === 'leftActionBar' && !showLeftActionBar) setShowLeftActionBar(true);
      if (result.bar === 'rightActionBar' && !showRightActionBar) setShowRightActionBar(true);
      Sounds.equipGear();
    } else if (result.reason === 'already_placed') {
      const name = getAbility(abilityId)?.name || 'Ability';
      addNotification('system', 'System', 'System', `${name} is already on your ${result.bar === 'hotbar' ? 'hotbar' : 'action bar'} (slot ${(result.index ?? 0) + 1}).`);
    } else if (result.reason === 'no_free_slot') {
      addNotification('system', 'System', 'System', 'No free action bar slot. Clear a slot first.');
    }
  };

  /**
   * Every cast — hotbar number key, bar click, or custom keybind — funnels
   * into GameCanvas's single `cast_ability` listener, which owns cooldowns,
   * targeting, mana and the socket.
   */
  const requestCast = (abilityId: string) => {
    window.dispatchEvent(new CustomEvent('cast_ability', { detail: { abilityId } }));
  };

  /** Skill-tree cards are dragged with the same payload the bars already accept. */
  const handleAbilityDragStart = (e: React.DragEvent, abilityId: string) => {
    e.dataTransfer.setData('text/plain', 'ability,' + abilityId);
    e.dataTransfer.effectAllowed = 'copy';
    setDraggedItemInfo({ type: 'ability', index: abilityId });
  };

  
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [notifications, setNotifications] = useState<{id: string, type: string, senderId: string, senderName: string, msg?: string, timestamp: number}[]>([]);
  
  // One expiry path covers quest events as well as ordinary toasts.
  useEffect(() => {
    if (!notifications.length) return;
    const expiresAt = notificationExpiresAt;
    const timer = window.setTimeout(() => {
      setNotifications(items => items.filter(n => expiresAt(n) > Date.now()));
    }, Math.max(0, Math.min(...notifications.map(expiresAt)) - Date.now()));
    return () => window.clearTimeout(timer);
  }, [notifications]);

  const addNotification = useCallback((type: 'trade'|'party'|'friend'|'duel'|'system'|'level_up', senderId: string, senderName: string, msg?: string) => {
     const id = 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
     setNotifications(prev => [...prev, { id, type, senderId, senderName, msg, timestamp: Date.now() }]);
  }, []);

  const [unifiedMenuTab, setUnifiedMenuTab] = useState<UnifiedMenuTab>('character');
  const [hoveredSlotItem, setHoveredSlotItem] = useState<any | null>(null);

  const getXpForLevel = (lvl: number) => 150 + Math.max(0, lvl - 1) * 75;

  const xpRef = useRef(xp);
  const levelRef = useRef(level);
  useEffect(() => { xpRef.current = xp; }, [xp]);
  useEffect(() => { levelRef.current = level; }, [level]);

  const grantPlayerXp = useCallback((amount: number) => {
     if (amount <= 0) return;
     let currentXp = xpRef.current + amount;
     let currentLevel = levelRef.current;
     let levelsGained = 0;
     let reqXp = getXpForLevel(currentLevel);

     while (currentXp >= reqXp) {
        currentXp -= reqXp;
        currentLevel++;
        levelsGained++;
        reqXp = getXpForLevel(currentLevel);
     }

     xpRef.current = currentXp;
     setXp(currentXp);

     if (levelsGained > 0) {
        levelRef.current = currentLevel;
        setLevel(currentLevel);
        setStatPoints(sp => sp + levelsGained);
        setSkillPoints(sp => sp + levelsGained);
        addNotification('level_up', 'System', 'System', `Level Up! Reached Level ${currentLevel} (+${levelsGained} Stat Point, +${levelsGained} Skill Point)`);
        Sounds.levelUp();
     }
  }, [addNotification]);

  const grantPlayerLevel = useCallback((amount: number) => {
     if (amount <= 0) return;
     const newLevel = levelRef.current + amount;
     levelRef.current = newLevel;
     setLevel(newLevel);
     setSkillPoints(sp => sp + amount);
     addNotification('level_up', 'System', 'System', `Level Up! Reached Level ${newLevel} (+${amount} Stat Point)`);
     Sounds.levelUp();
  }, [addNotification]);

  const handleTossItem = useCallback((item: InventorySlot) => {
    if (!item || item.type === BlockType.Air) return;
    window.dispatchEvent(new CustomEvent('toss_item', { 
      detail: { type: item.type, count: item.count || 1 } 
    }));
    Sounds.dropItem();
    if (cursorItem === item) {
      setCursorItem(null);
    }
  }, [cursorItem]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const [sendChatMsg, setSendChatMsg] = useState<{text: string, timestamp: number} | null>(null);
  
  // Action bar loadout presets (Preset 1, 2, 3)
  const [activeLoadoutPreset, setActiveLoadoutPreset] = useState<number>(1);
  const loadoutPresetsRef = useRef<Record<number, { hotbar: any[]; leftActionBar: any[]; rightActionBar: any[] }>>({});

  // Party system foundation
  const [party, setParty] = useState<PartyData | null>(null);
  const [nearbyPlayers, setNearbyPlayers] = useState<{ id: string; name: string; level?: number; playerClass?: string }[]>([]);
  const [isBlockProtectionActive, setIsBlockProtectionActive] = useState<boolean>(false);

  const selectedBlock = hotbar[selectedSlotIndex] ? hotbar[selectedSlotIndex]!.type : BlockType.Air;

  // Mouse tracking for cursor item and rich tooltips
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
  const [npcDialog, setNpcDialog] = useState<{name: string, text: string, color: string, ringColor: string} | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  


  
  
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
    if (!name.trim() || !hasLoadedSave || !activeProfileId || deletingProfile) return;
    const srv = name.trim();
    
    setRecentServers(prev => {
      const next = [srv, ...prev.filter(s => s !== srv)].slice(0, 5);
      localStorage.setItem('recentServers', JSON.stringify(next));
      return next;
    });

    setServerName(srv);
    window.location.hash = srv;
    saveProgress();
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

  // Preset switching logic
  const handleSelectLoadoutPreset = useCallback((presetId: number) => {
    setActiveLoadoutPreset(prevPreset => {
      // Save current bars into current preset slot
      loadoutPresetsRef.current[prevPreset] = {
        hotbar: [...hotbar],
        leftActionBar: [...leftActionBar],
        rightActionBar: [...rightActionBar],
      };
      // Restore target preset bars if saved
      const target = loadoutPresetsRef.current[presetId];
      if (target) {
        setHotbar(target.hotbar);
        setLeftActionBar(target.leftActionBar);
        setRightActionBar(target.rightActionBar);
      }
      Sounds.slotClick();
      addNotification('system', 'System', 'System', `Switched to Loadout Preset ${presetId}`);
      return presetId;
    });
  }, [hotbar, leftActionBar, rightActionBar, addNotification]);

  const handleSendChatMessage = useCallback((text: string, channel: ChatChannel) => {
    if (!text.trim()) return;
    if (socketRef.current) {
      socketRef.current.emit('chat_message', { text, channel, room: serverName });
    } else {
      setSendChatMsg({ text, timestamp: Date.now() });
    }
  }, [serverName]);

  const handleInvitePartyPlayer = useCallback((targetId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('send_party_invite', { targetId });
    }
    if (!party) {
      setParty({
        id: 'party_' + (socketRef.current?.id || 'me'),
        leaderId: socketRef.current?.id || 'me',
        members: [
          { id: socketRef.current?.id || 'me', name: nickname, isLeader: true, hp: health, maxHp: 20 + (skills.strength || 0) * 10, level, playerClass }
        ]
      });
    }
    addNotification('party', targetId, 'System', 'Party invite sent.');
  }, [party, nickname, health, level, playerClass, addNotification]);

  const handleLeaveParty = useCallback(() => {
    setParty(null);
    setIsBlockProtectionActive(false);
    socketRef.current?.emit('set_party_block_protection', { enabled: false });
    addNotification('system', 'System', 'System', 'You left the party.');
  }, [addNotification]);

  const handleToggleBlockProtection = useCallback(() => {
    const nextState = !isBlockProtectionActive;
    setIsBlockProtectionActive(nextState);
    if (socketRef.current) {
      socketRef.current.emit('set_party_block_protection', { enabled: nextState });
    }
    addNotification(
      'party',
      socketRef.current?.id || 'me',
      'Party Leader',
      nextState 
        ? '🛡️ Indestructible Party Block Protection ENABLED. Placed blocks cannot be broken by non-members.' 
        : 'Party Block Protection DISABLED.'
    );
  }, [isBlockProtectionActive, addNotification]);

  // Synchronize player stats with server tick for server-side damage scaling
  useEffect(() => {
    if (socketRef.current && appState === 'playing') {
      socketRef.current.emit('sync_stats', {
        skills,
        hp: health,
        maxHp: 20 + (skills.strength || 0) * 10,
        mana,
        maxMana: 100 + (skills.intelligence || 0) * 20,
        level
      });
    }
  }, [skills, health, mana, level, appState]);

  // Keyboard shortcuts

  useEffect(() => {
    const handleSwapHotbar = (e: any) => {
        const { hotbarIdx, type, index } = e.detail;
        if (type === 'backpack') {
             setHotbar(prevHotbar => {
                 setBackpack(prevBackpack => {
                     const nextH = [...prevHotbar];
                     const nextB = [...prevBackpack];
                     const temp = nextH[hotbarIdx];
                     nextH[hotbarIdx] = nextB[index];
                     nextB[index] = temp;
                     return nextB;
                 });
                 return prevHotbar; // Will be overwritten by state setter in the callback, but wait. The above sets backpack. We need to set hotbar.
             });
        }
    };
    
    // Better way:
    const handleSwap = (e: any) => {
        const { hotbarIdx, type, index } = e.detail;
        if (type === 'backpack') {
            let nextH, nextB;
            setHotbar(h => { nextH = [...h]; return h; });
            setBackpack(b => { nextB = [...b]; return b; });
            const temp = nextH[hotbarIdx];
            nextH[hotbarIdx] = nextB[index];
            nextB[index] = isAbilitySlot(temp) ? null : temp; // abilities only live on bars
            setHotbar(nextH);
            setBackpack(nextB);
        } else if (type === 'leftActionBar') {
            let nextH, nextL;
            setHotbar(h => { nextH = [...h]; return h; });
            setLeftActionBar(l => { nextL = [...l]; return l; });
            const temp = nextH[hotbarIdx];
            nextH[hotbarIdx] = nextL[index];
            nextL[index] = temp;
            setHotbar(nextH);
            setLeftActionBar(nextL);
        } else if (type === 'rightActionBar') {
            let nextH, nextR;
            setHotbar(h => { nextH = [...h]; return h; });
            setRightActionBar(r => { nextR = [...r]; return r; });
            const temp = nextH[hotbarIdx];
            nextH[hotbarIdx] = nextR[index];
            nextR[index] = temp;
            setHotbar(nextH);
            setRightActionBar(nextR);
        }
    };
    window.addEventListener('swap_hotbar', handleSwap);

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

      // Tab key - Consolidated Menu cycling or opening
      if (e.key === 'Tab') {
        e.preventDefault();
        const tabOrder: UnifiedMenuTab[] = ['character', 'inventory', 'crafting', 'quests', 'skills', 'settings'];
        if (inventoryOpen) {
          const delta = e.shiftKey ? -1 : 1;
          const currentIdx = tabOrder.indexOf(unifiedMenuTab);
          const nextIdx = (currentIdx + delta + tabOrder.length) % tabOrder.length;
          setUnifiedMenuTab(tabOrder[nextIdx]);
          Sounds.slotClick();
        } else {
          setInventoryOpen(true);
          Sounds.slotClick();
        }
        return;
      }

      // Escape key - Hierarchical close or open Settings
      if (e.key === 'Escape') {
        if (showInstructions) {
          setShowInstructions(false);
          return;
        }
        if (activeTrade) {
          socketRef.current?.emit('cancel_trade', { tradeId: activeTrade.tradeId });
          setActiveTrade(null);
          return;
        }
        if (merchantOpen) {
          setMerchantOpen(false);
          if (cursorItem) returnCursorItemToInventory(cursorItem);
          return;
        }
        if (furnaceOpen) {
          setFurnaceOpen(false);
          if (cursorItem) returnCursorItemToInventory(cursorItem);
          return;
        }
        if (chestOpen) {
          setChestOpen(false);
          setActiveChestCoords(null);
          if (cursorItem) returnCursorItemToInventory(cursorItem);
          return;
        }
        if (npcDialog) {
          setNpcDialog(null);
          return;
        }
        if (instancesOpen) {
          setInstancesOpen(false);
          return;
        }
        if (inventoryOpen) {
          setInventoryOpen(false);
          if (cursorItem) returnCursorItemToInventory(cursorItem);
          return;
        }
        // If nothing was open, open settings tab of unified menu
        setUnifiedMenuTab('settings');
        setInventoryOpen(true);
        Sounds.slotClick();
        return;
      }
      
      // E key - Toggle Consolidated Menu
      if (e.key.toLowerCase() === 'e') {
        if (merchantOpen) {
          setMerchantOpen(false);
          setCursorItem(null);
          return;
        }
        if (furnaceOpen) {
          setFurnaceOpen(false);
          setCursorItem(null);
          return;
        }
        if (chestOpen) {
          setChestOpen(false);
          setActiveChestCoords(null);
          if (cursorItem) returnCursorItemToInventory(cursorItem);
          return;
        }
        if (npcDialog) {
          setNpcDialog(null);
          return;
        }
        setInventoryOpen(prev => {
          if (prev && cursorItem) returnCursorItemToInventory(cursorItem);
          return !prev;
        });
        Sounds.slotClick();
        return;
      }

      // I key - Instances Finder
      if (e.key.toLowerCase() === 'i') {
        if (!inventoryOpen && !furnaceOpen && !isChatOpen) {
          setInstancesOpen(prev => !prev);
        }
        return;
      }

      // Q key - Dedicated Drop/Toss item (Quests are checked via E and Tab)
      if (e.key.toLowerCase() === 'q') {
        // 1. If holding cursor item -> drop cursor item
        if (cursorItem && cursorItem.type !== BlockType.Air) {
          const dropCount = e.ctrlKey ? (cursorItem.count || 1) : 1;
          window.dispatchEvent(new CustomEvent('toss_item', { detail: { type: cursorItem.type, count: dropCount } }));
          Sounds.dropItem();
          if ((cursorItem.count || 1) > dropCount) {
            setCursorItem({ ...cursorItem, count: cursorItem.count - dropCount });
          } else {
            setCursorItem(null);
          }
          return;
        }

        // 2. If hovering an inventory or action bar slot -> drop hovered item
        if (hoveredSlotRef.current && typeof hoveredSlotRef.current.index === 'number') {
          const sType = hoveredSlotRef.current.type;
          const sIdx = hoveredSlotRef.current.index;
          let targetItem: InventorySlot = null;
          if (sType === 'hotbar') targetItem = hotbar[sIdx];
          else if (sType === 'backpack') targetItem = backpack[sIdx];
          else if (sType === 'leftActionBar') targetItem = leftActionBar[sIdx];
          else if (sType === 'rightActionBar') targetItem = rightActionBar[sIdx];

          if (targetItem && targetItem.type !== BlockType.Air && (targetItem.count || 1) > 0) {
            const dropCount = e.ctrlKey ? (targetItem.count || 1) : 1;
            window.dispatchEvent(new CustomEvent('toss_item', { detail: { type: targetItem.type, count: dropCount } }));
            Sounds.dropItem();

            const updateArr = (arr: InventorySlot[]) => {
              const copy = [...arr];
              const cur = copy[sIdx];
              if (!cur) return arr;
              if ((cur.count || 1) <= dropCount) {
                copy[sIdx] = null;
              } else {
                copy[sIdx] = { ...cur, count: cur.count - dropCount };
              }
              return copy;
            };

            if (sType === 'hotbar') setHotbar(updateArr);
            else if (sType === 'backpack') setBackpack(updateArr);
            else if (sType === 'leftActionBar') setLeftActionBar(updateArr);
            else if (sType === 'rightActionBar') setRightActionBar(updateArr);
            return;
          }
        }

        // 3. Normal gameplay: drop active selected hotbar item
        if (!inventoryOpen && !furnaceOpen && !chestOpen && !merchantOpen && !isChatOpen) {
          const curSlot = hotbar[selectedSlotIndex];
          if (curSlot && curSlot.type !== BlockType.Air && (curSlot.count || 1) > 0) {
            const dropCount = e.ctrlKey ? (curSlot.count || 1) : 1;
            window.dispatchEvent(new CustomEvent('toss_item', { detail: { type: curSlot.type, count: dropCount } }));
            Sounds.dropItem();
            setHotbar(prev => {
              const copy = [...prev];
              const cur = copy[selectedSlotIndex];
              if (!cur) return prev;
              if ((cur.count || 1) <= dropCount) {
                copy[selectedSlotIndex] = null;
              } else {
                copy[selectedSlotIndex] = { ...cur, count: cur.count - dropCount };
              }
              return copy;
            });
            return;
          }
        }
        return;
      }

      // J or L key - Direct Quest Log shortcut (also accessible in Tab menu)
      if ((e.key.toLowerCase() === 'j' || e.key.toLowerCase() === 'l') && !isChatOpen) {
        if (!furnaceOpen && !chestOpen && !merchantOpen) {
          setUnifiedMenuTab('quests');
          setInventoryOpen(true);
          Sounds.slotClick();
        }
        return;
      }
      
      // Loadout editing happens with the menu open: hover + key binds or places an
      // ability. With the menu closed the same keys *cast* (GameCanvas), so the two
      // never overlap.
      if (hoveredSlotRef.current && inventoryOpen) {
        const pressedKey = e.key.toLowerCase();

        // Hovering a skill-tree card: press a key to bind that ability.
        // (Escape / Tab / E / Q / I / J / L were already handled above.)
        if (hoveredSlotRef.current.type === 'ability') {
           const abilityId = String(hoveredSlotRef.current.index);
           if (!bindKeyToAbility(pressedKey, abilityId) && pressedKey.length === 1) {
              addNotification('system', 'System', 'System', `"${pressedKey.toUpperCase()}" is reserved (movement, menus or hotbar). Choose another key.`);
           }
           return;
        }
        
        const hRef = hoveredSlotRef.current;
        const isActionBar = ['hotbar', 'leftActionBar', 'rightActionBar'].includes(hRef.type);
        if (isActionBar) {
            const barKey = hRef.type as BarKey;
            const slotIndex = Number(hRef.index);
            const targetArr = [...bars[barKey]];
            const slot = targetArr[slotIndex];
            
            // Hovering a placed ability: bind it to the pressed key.
            if (isAbilitySlot(slot)) {
                if (bindKeyToAbility(pressedKey, slot.abilityId)) return;
            }
            
            // Hovering an empty/non-ability slot: a bound key drops its ability in here.
            const boundSlot = !isAbilitySlot(slot) ? makeAbilitySlot(keybinds[pressedKey]) : null;
            if (boundSlot) {
                targetArr[slotIndex] = boundSlot;
                setBar(barKey, targetArr);
                return;
            }
        }
      }

      // Shift+1, Shift+2, Shift+3 switches action bar loadout presets
      if (e.shiftKey && (e.key === '1' || e.key === '2' || e.key === '3')) {
        e.preventDefault();
        handleSelectLoadoutPreset(parseInt(e.key));
        return;
      }

      if (!inventoryOpen && !furnaceOpen && !questLogOpen && !npcDialog) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9) {
          const slot = hotbar[num - 1];
          if (isAbilitySlot(slot)) {
             requestCast(slot.abilityId);
          } else {
             setSelectedSlotIndex(num - 1);
          }
        }
      } else if (inventoryOpen) {
        const num = parseInt(e.key);
        if (hoveredSlotRef.current && typeof hoveredSlotRef.current.index === 'number' && num >= 1 && num <= 9) {
           const hotbarIdx = num - 1;
           const hRef = hoveredSlotRef.current;
           window.dispatchEvent(new CustomEvent('swap_hotbar', { detail: { hotbarIdx, type: hRef.type, index: hRef.index } }));
        } else if (!hoveredSlotRef.current && num >= 1 && num <= 6) {
           const tabOrder: UnifiedMenuTab[] = ['character', 'inventory', 'crafting', 'quests', 'skills', 'settings'];
           setUnifiedMenuTab(tabOrder[num - 1]);
           Sounds.slotClick();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('swap_hotbar', handleSwap); };
  }, [appState, inventoryOpen, furnaceOpen, isChatOpen, unifiedMenuTab, cursorItem, chestOpen, merchantOpen, npcDialog, showInstructions, activeTrade, instancesOpen, hotbar, backpack, selectedSlotIndex, leftActionBar, rightActionBar, keybinds, returnCursorItemToInventory, handleSelectLoadoutPreset]);

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
    
    let foundInHotbar = false;
    let foundInBackpack = false;
    
    for (let i = 0; i < hotbar.length; i++) {
        if (hotbar[i] && hotbar[i].type === ammoType) {
            foundInHotbar = true;
            break;
        }
    }
    
    if (!foundInHotbar) {
        for (let i = 0; i < backpack.length; i++) {
            if (backpack[i] && backpack[i].type === ammoType) {
                foundInBackpack = true;
                break;
            }
        }
    }
    
    if (foundInHotbar || foundInBackpack) {
        setHotbar(prev => {
            const newHb = [...prev];
            if (foundInHotbar) {
                for (let i = 0; i < newHb.length; i++) {
                    if (newHb[i] && newHb[i].type === ammoType) {
                        newHb[i] = { ...newHb[i]!, count: newHb[i]!.count - 1 };
                        if (newHb[i]!.count <= 0) newHb[i] = null;
                        break;
                    }
                }
            }
            
            // Decrease tool durability
            const currentSlot = newHb[selectedSlotIndex];
            if (currentSlot) {
                const maxDurability = 50;
                const currentDurability = currentSlot.durability !== undefined ? currentSlot.durability : maxDurability;
                if (currentDurability <= 1) {
                    newHb[selectedSlotIndex] = null;
                    Sounds.mineBlock();
                } else {
                    newHb[selectedSlotIndex] = { ...currentSlot, durability: currentDurability - 1 };
                }
            }
            
            return newHb;
        });
        
        if (foundInBackpack) {
            setBackpack(prevBp => {
                const newBp = [...prevBp];
                for (let i = 0; i < newBp.length; i++) {
                    if (newBp[i] && newBp[i].type === ammoType) {
                        newBp[i] = { ...newBp[i]!, count: newBp[i]!.count - 1 };
                        if (newBp[i]!.count <= 0) newBp[i] = null;
                        break;
                    }
                }
                return newBp;
            });
        }
    }
  };

  
  const handleSortInventory = () => {
     // Combine hotbar and backpack
     const allItems: { type: number, count: number }[] = [];
     
     const processSlot = (slot: InventorySlot) => {
         if (!slot || isAbilitySlot(slot)) return; // abilities stay where they are
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
     
     // Re-distribute around any abilities placed on the hotbar
     const newHotbar: InventorySlot[] = hotbar.map(s => (isAbilitySlot(s) ? s : null));
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

  const handleClearCraftingGrid = () => {
     craftingGrid.forEach(slot => {
        if (slot && slot.type !== BlockType.Air) {
           returnCursorItemToInventory(slot);
        }
     });
     setCraftingGrid(Array(9).fill(null));
     Sounds.slotClick();
  };

  const handleQuickSort = () => {
     handleSortInventory();
     Sounds.craftSuccess();
  };

  const handleQuickStack = () => {
     setHotbar(prevHb => {
        const newHb = [...prevHb];
        setBackpack(prevBp => {
           const newBp = [...prevBp];
           for (let b = 0; b < newBp.length; b++) {
              const bItem = newBp[b];
              if (!bItem || bItem.type === BlockType.Air) continue;
              for (let h = 0; h < newHb.length; h++) {
                 const hItem = newHb[h];
                 if (hItem && hItem.type === bItem.type && hItem.count < 64) {
                    const space = 64 - hItem.count;
                    const transfer = Math.min(space, bItem.count);
                    newHb[h] = { ...hItem, count: hItem.count + transfer };
                    const rem = bItem.count - transfer;
                    newBp[b] = rem > 0 ? { ...bItem, count: rem } : null;
                    if (newBp[b] === null) break;
                 }
              }
           }
           return newBp;
        });
        return newHb;
     });
     Sounds.slotClick();
  };

  const handleApplyEnchant = (
    slotSource: 'hotbar' | 'backpack',
    slotIndex: number,
    prefix: EnchantmentPrefix,
    newLevel: number,
    cost: { gold: number; materials: { type: BlockType; count: number }[] }
  ) => {
    const setter = slotSource === 'hotbar' ? setHotbar : setBackpack;
    setter(prev => {
      const copy = [...prev];
      const target = copy[slotIndex];
      if (!target) return prev;
      copy[slotIndex] = {
        ...target,
        prefix,
        enchantLevel: newLevel
      };
      return copy;
    });

    // Deduct materials from backpack/hotbar
    for (const mat of cost.materials) {
      let remaining = mat.count;
      setBackpack(bp => {
        return bp.map(s => {
          if (!s || remaining <= 0 || s.type !== mat.type) return s;
          const take = Math.min(s.count || 1, remaining);
          remaining -= take;
          const newCount = (s.count || 1) - take;
          return newCount <= 0 ? null : { ...s, count: newCount };
        });
      });
      if (remaining > 0) {
        setHotbar(hb => {
          return hb.map(s => {
            if (!s || remaining <= 0 || s.type !== mat.type) return s;
            const take = Math.min(s.count || 1, remaining);
            remaining -= take;
            const newCount = (s.count || 1) - take;
            return newCount <= 0 ? null : { ...s, count: newCount };
          });
        });
      }
    }

    Sounds.anvilHit();
    addNotification('system', 'System', 'System', `Successfully enhanced equipment to +${newLevel}!`);
  };

  const handleApplyGem = (
    slotSource: 'hotbar' | 'backpack',
    slotIndex: number,
    socketIndex: 1 | 2,
    gemType: GemType
  ) => {
    const setter = slotSource === 'hotbar' ? setHotbar : setBackpack;
    setter(prev => {
      const copy = [...prev];
      const target = copy[slotIndex];
      if (!target) return prev;
      copy[slotIndex] = {
        ...target,
        [socketIndex === 1 ? 'gem1' : 'gem2']: gemType
      };
      return copy;
    });
    Sounds.craft();
    addNotification('system', 'System', 'System', `Socketed ${gemType.toUpperCase()} gem!`);
  };

  const handleDismantle = (
    slotSource: 'hotbar' | 'backpack',
    slotIndex: number,
    yields: { type: BlockType; count: number }[]
  ) => {
    const setter = slotSource === 'hotbar' ? setHotbar : setBackpack;
    setter(prev => {
      const copy = [...prev];
      copy[slotIndex] = null;
      return copy;
    });

    setBackpack(prev => {
      let copy = [...prev];
      for (const y of yields) {
        let added = false;
        for (let i = 0; i < copy.length; i++) {
          if (copy[i] && copy[i]?.type === y.type) {
            copy[i] = { ...copy[i], count: (copy[i]?.count || 1) + y.count };
            added = true;
            break;
          }
        }
        if (!added) {
          for (let i = 0; i < copy.length; i++) {
            if (!copy[i]) {
              copy[i] = { type: y.type, count: y.count };
              added = true;
              break;
            }
          }
        }
      }
      return copy;
    });
    Sounds.anvilHit();
    addNotification('system', 'System', 'System', 'Gear dismantled into magical crafting essence.');
  };

  const handleSlotClick = (type: 'hotbar' | 'leftActionBar' | 'rightActionBar' | 'backpack' | 'equipment' | 'crafting' | 'craftingResult' | 'furnaceInput' | 'furnaceFuel' | 'furnaceOutput' | 'chest' | 'merchantPayment' | 'merchantOutput', index: number, isRightClick: boolean = false) => {

    if (!inventoryOpen) {
        let arr = [];
        if (type === 'hotbar') arr = hotbar;
        if (type === 'leftActionBar') arr = leftActionBar;
        if (type === 'rightActionBar') arr = rightActionBar;
        const slot = arr[index];
        if (isAbilitySlot(slot)) {
             requestCast(slot.abilityId);
        } else if (type === 'hotbar') {
             setSelectedSlotIndex(index);
             Sounds.slotClick();
        }
        return;
    }

    // An ability picked up on the cursor may only be put down on an action bar;
    // clicking anywhere else discards it (it can be re-added from the skill tree).
    if (isAbilitySlot(cursorItem) && type !== 'hotbar' && type !== 'leftActionBar' && type !== 'rightActionBar') {
        setCursorItem(null);
        Sounds.slotClick();
        return;
    }

    if (type === 'equipment') {
        Sounds.equipGear();
    } else if (type === 'craftingResult') {
        Sounds.craftSuccess();
    } else {
        Sounds.slotClick();
    }
        
    
    // Helper to merge stacks
    const tryMerge = (target: InventorySlot, source: InventorySlot, isRightClick: boolean): { remainingTarget: InventorySlot, remainingSource: InventorySlot } => {
      if (!source && !target) return { remainingTarget: null, remainingSource: null };

      // Ability slots are references, not stacks: never merge or split them, just pick up / swap.
      if (isAbilitySlot(source) || isAbilitySlot(target)) {
        return { remainingTarget: source, remainingSource: target };
      }
      
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

  const handleDragStart = (e: React.DragEvent, type: string, index: number) => {
    e.dataTransfer.setData('text/plain', type + ',' + index);
    setDraggedItemInfo({ type, index });
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent, targetType: string, targetIndex: number) => {

    const dragDataStr = e.dataTransfer.getData('text/plain');
    let srcType, srcIndex;
    if (dragDataStr) {
        const parts = dragDataStr.split(',');
        srcType = parts[0];
        srcIndex = parts[1];
        if (srcType !== 'ability') srcIndex = parseInt(srcIndex);
    } else if (draggedItemInfo) {
        srcType = draggedItemInfo.type;
        srcIndex = draggedItemInfo.index;
    } else {
        return;
    }
        
    e.preventDefault();

    
    // Perform standard slot swap/merge by temporarily tricking handleSlotClick
    // Actually, we can just call handleSlotClick to pick up, then place.
    // Wait, handleSlotClick uses `cursorItem`. If we bypass cursorItem, we need to swap.
    
    // Dragging a skill-tree card: abilities only live on the action bars.
    if (srcType === 'ability') {
        const slot = makeAbilitySlot(srcIndex);
        const isBar = targetType === 'hotbar' || targetType === 'leftActionBar' || targetType === 'rightActionBar';
        if (slot && isBar) {
            const barKey = targetType as BarKey;
            // A displaced item goes back to the backpack instead of being destroyed.
            const displaced = bars[barKey][targetIndex];
            if (displaced && !isAbilitySlot(displaced)) {
                const { next, remaining } = stashInBackpack(displaced, backpack);
                if (remaining > 0) {
                    addNotification('system', 'System', 'System', 'Backpack is full; clear the slot first.');
                    setDraggedItemInfo(null);
                    return;
                }
                setBackpack(next);
            }
            // One ability, one slot: drop any earlier copy across the bars, then place.
            for (const key of Object.keys(bars) as BarKey[]) {
                const arr = bars[key];
                const dupIdx = arr.findIndex(s => isAbilitySlot(s) && s.abilityId === slot.abilityId);
                const isTarget = key === barKey;
                if (dupIdx === -1 && !isTarget) continue;
                const next = [...arr];
                if (dupIdx !== -1) next[dupIdx] = null;
                if (isTarget) next[targetIndex] = slot;
                setBar(key, next);
            }
            Sounds.equipGear();
        }
        setDraggedItemInfo(null);
        return;
    }
    if (srcType === targetType && srcIndex === targetIndex) {
        setDraggedItemInfo(null);
        return;
    }
    
    const getArray = (t: string) => {
        if (t === 'backpack') return [...backpack];
        if (t === 'hotbar') return [...hotbar];
        if (t === 'leftActionBar') return [...leftActionBar];
        if (t === 'rightActionBar') return [...rightActionBar];
        if (t === 'equipment') return [...equipment];
        return [];
    };
    
    const setArray = (t: string, arr: any) => {
        if (t === 'backpack') setBackpack(arr);
        if (t === 'hotbar') setHotbar(arr);
        if (t === 'leftActionBar') setLeftActionBar(arr);
        if (t === 'rightActionBar') setRightActionBar(arr);
        if (t === 'equipment') setEquipment(arr);
    };
    
    const srcArr = getArray(srcType);
    const targetArr = getArray(targetType);
    
    if (!srcArr || !targetArr) return;
    
    const srcItem = srcArr[srcIndex];
    const targetItem = targetArr[targetIndex];

    // Ability slots only belong on the action bars; dragging one elsewhere just removes it.
    if (isAbilitySlot(srcItem) && !['hotbar', 'leftActionBar', 'rightActionBar'].includes(targetType)) {
        srcArr[srcIndex] = null;
        setArray(srcType, srcArr);
        setDraggedItemInfo(null);
        return;
    }
    
    // Stack merge (never for ability slots — they are references, not stacks)
    if (srcItem && targetItem && srcItem.type === targetItem.type && !isAbilitySlot(srcItem) && !isAbilitySlot(targetItem)) {
        targetArr[targetIndex] = { type: srcItem.type, count: targetItem.count + srcItem.count };
        srcArr[srcIndex] = null;
    } else {
        // Swap
        srcArr[srcIndex] = targetItem;
        if (srcType === targetType) {
            srcArr[targetIndex] = srcItem;
        } else {
            targetArr[targetIndex] = srcItem;
        }
    }
    
    setArray(srcType, srcArr);
    if (srcType !== targetType) {
        setArray(targetType, targetArr);
    }
    
    setDraggedItemInfo(null);
  };

  const renderBlockIcon = (slot: InventorySlot | BlockType | null) => {
    if (slot === null) return null;
    
    // Normalize to handle both raw BlockType (from crafting recipes) and InventorySlot (from state)
    let type: BlockType;
    let count: number = 1;
    
    if (isAbilitySlot(slot)) {
       const ability = getAbility(slot.abilityId);
       if (!ability) return null;
       const boundKey = keyForAbility(keybinds, slot.abilityId);
       return <div data-tooltip={`${ability.name}${boundKey ? ` [${boundKey.toUpperCase()}]` : ''}`} className="w-full h-full rounded-sm shadow-sm relative group flex items-center justify-center overflow-hidden bg-neutral-900 border border-cyan-500/30">{ability.icon}{boundKey && <span className="absolute top-0 right-0 bg-amber-500 text-black font-black text-[10px] px-1 rounded shadow-md z-10 leading-none">{boundKey.toUpperCase()}</span>}</div>;
    }
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
    const activeProfile = profiles.find(p => p.id === activeProfileId);
    return (
      <div className="w-full h-screen flex flex-col font-sans relative overflow-hidden bg-black">
        {/* Fullscreen Thematic Background based on Active Character Race */}
        <div className="absolute inset-0 bg-cover bg-center opacity-40 transition-all duration-1000" style={{ backgroundImage: `url('/assets/races/${activeProfile?.race || 'human'}_art.jpg')` }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/90"></div>
        
        {/* Top Left Header */}
        <div className="absolute top-6 left-6 z-30 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-black text-white text-lg shadow-lg border border-amber-400/30">
              L
            </div>
            <div>
              <div className="text-white font-black text-sm tracking-wider uppercase leading-none" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Lange: Origins</div>
              <div className="text-neutral-400 text-[11px] font-medium">Realm Lobby</div>
            </div>
          </div>
          {currentUser && (
            <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-white font-medium text-xs max-w-[150px] truncate">{currentUser.displayName || currentUser.email || 'Adventurer'}</span>
              <button onClick={handleSignOut} className="px-3 py-1 rounded-lg text-xs font-bold bg-white/10 text-white hover:bg-white/20 transition-all">Sign Out</button>
            </div>
          )}
        </div>

        {showCharacterCreator ? (
           <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
             {/* Character Creator Modal */}
             <div className="w-full max-w-5xl h-[80vh] bg-neutral-900 border border-white/10 rounded-2xl flex overflow-hidden shadow-2xl relative">
                
                {/* Left side preview */}
                <div className="w-full md:w-1/2 relative bg-neutral-900 border-r border-white/5">
                   <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center overflow-hidden">
                       <img src={getSpriteUrl(creatorRace, playerClass, [])} className="h-[120%] object-contain scale-110 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ imageRendering: 'pixelated' }} />
                   </div>
                   <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                   <div className="absolute bottom-8 left-8 right-8">
                      <div className="w-20 h-20 rounded-2xl border-4 border-white mb-4 shadow-xl" style={{ backgroundColor: characterSkin }}></div>
                      <h2 className="text-3xl font-black text-white capitalize">{creatorRace} {playerClass}</h2>
                   </div>
                </div>

                {/* Right side form */}
                <div className="w-full md:w-1/2 p-8 overflow-y-auto custom-scrollbar flex flex-col">
                   <div className="flex justify-between items-center mb-8">
                     <h2 className="text-2xl font-black text-white">New Character</h2>
                     <button onClick={() => setShowCharacterCreator(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10"><X size={20}/></button>
                   </div>
                   
                   <div className="space-y-6 flex-1">
                     <div>
                       <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 block">Name</label>
                       <input
                         type="text"
                         value={nickname}
                         onChange={(e) => setNickname(e.target.value)}
                         className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                         placeholder="Hero Name"
                       />
                     </div>

                     <div>
                       <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 block">Race</label>
                       <div className="grid grid-cols-3 gap-3">
                         {['human', 'elf', 'dwarf'].map(r => (
                           <button
                             key={r}
                             onClick={() => setCreatorRace(r)}
                             className={`py-3 rounded-xl border text-sm font-bold uppercase transition-all ${creatorRace === r ? 'bg-amber-600/20 border-amber-500 text-amber-400' : 'bg-black/40 border-white/5 text-neutral-500 hover:bg-white/5 hover:text-white'}`}
                           >
                             {r}
                           </button>
                         ))}
                       </div>
                     </div>

                     <div>
                       <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 block">Class</label>
                       <div className="grid grid-cols-3 gap-3">
                         {['warrior', 'mage', 'archer'].map(cls => (
                           <button
                             key={cls}
                             onClick={() => setPlayerClass(cls)}
                             className={`py-3 rounded-xl border text-sm font-bold uppercase transition-all ${playerClass === cls ? 'bg-amber-600/20 border-amber-500 text-amber-400' : 'bg-black/40 border-white/5 text-neutral-500 hover:bg-white/5 hover:text-white'}`}
                           >
                             {cls}
                           </button>
                         ))}
                       </div>
                     </div>
                     
                     <div>
                       <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 block">Skin Tone</label>
                       <div className="flex gap-2">
                         {availableSkins.map(s => (
                           <button
                             key={s}
                             onClick={() => setCharacterSkin(s)}
                             className={`w-10 h-10 rounded-full border-2 transition-all ${characterSkin === s ? 'border-amber-400 scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                             style={{ backgroundColor: s }}
                           />
                         ))}
                       </div>
                     </div>
                   </div>

                   <div className="mt-8">
                     {profileError && <p role="alert" className="mb-3 text-red-400">{profileError}</p>}
                     <button
                        onClick={async () => {
                          const newId = `char_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                          const newProfile = createDefaultCharacterDoc({
                            id: newId,
                            name: nickname,
                            skin: characterSkin || 'orange',
                            playerClass: playerClass || 'warrior',
                            race: creatorRace || 'human',
                            health: 20,
                            questsJson: JSON.stringify(defaultQuests),
                          });
                          
                          try {
                            const initialRevision = await createCharacterDoc(db, currentUser.uid, newProfile);
                            characterRevisions.current[newId] = initialRevision;
                          } catch (error) {
                            setProfileError('Could not create character. Please try again.');
                            return;
                          }
                          
                          setProfiles([...profiles, newProfile]);
                          selectProfile(newProfile);

                          setShowCharacterCreator(false);
                        }}
                        className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-black text-lg transition-all active:scale-95 shadow-[0_0_20px_rgba(217,119,6,0.3)]"
                     >
                       Create Hero
                     </button>
                   </div>
                </div>
             </div>
           </div>
        ) : (
           <div className="absolute inset-0 z-10 flex">
             {/* Left side: Realm / World Selector with modal */}
             <div className="hidden md:flex flex-col justify-center pl-8 pr-4 pt-20 pb-8 z-20 max-w-xs shrink-0">
               <LobbyServerSelector
                 selectedServerId={joinInput}
                 onSelectServer={(id) => setJoinInput(id)}
                 onDirectJoin={(id) => joinServer(id)}
               />
             </div>

             {/* Center: Selected Character Model */}
             <div className="flex-1 flex flex-col items-center justify-end pb-20 relative">
               {activeProfile ? (
                 <>
                   {/* Giant Sprite */}
                   <div className="w-full max-w-lg h-3/4 relative flex items-end justify-center mb-10 drop-shadow-2xl pointer-events-none">
                     <img src={getSpriteUrl(activeProfile.race, activeProfile.playerClass, readSlots(activeProfile.equipment, 2))} className="h-full object-contain scale-100 origin-bottom transform-gpu" style={{ imageRendering: 'pixelated' }} />
                   </div>
                   
                   {/* WoW style "Enter World" button */}
                   <button onClick={() => { if(joinInput) joinServer(joinInput); else joinServer('public-lobby'); }} className="px-16 py-5 bg-gradient-to-b from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 border-2 border-amber-500 rounded-full text-amber-100 font-black text-2xl uppercase tracking-widest shadow-[0_0_40px_rgba(220,38,38,0.4)] transition-all hover:scale-105 active:scale-95 z-20">
                     Enter World
                   </button>
                   
                   <div className="absolute bottom-4 bg-black/80 p-4 rounded-xl border border-white/10 flex gap-2 animate-in fade-in slide-in-from-bottom-4 z-20">
                      <input
                        type="text"
                        value={joinInput}
                        onChange={(e) => setJoinInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && joinServer(joinInput)}
                        className="bg-neutral-900 border border-white/10 text-white rounded-lg px-4 py-2 focus:outline-none text-sm w-48"
                        placeholder="Server ID (blank=public)"
                      />
                   </div>
                 </>
               ) : (
                 <div className="flex flex-col items-center justify-center h-full text-white/50 font-bold text-xl">
                   No Character Selected
                 </div>
               )}
             </div>

             {/* Right: Character List */}
             <div className="w-96 bg-black/60 backdrop-blur-md border-l border-white/5 flex flex-col pt-10 pb-6 px-6 relative z-20">
               <div className="mb-6">
                 <h1 className="text-3xl font-black text-center text-amber-500 tracking-widest uppercase" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Characters</h1>
                 <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mt-4"></div>
               </div>

               <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-2">
                 {profiles.map(p => (
                   <button
                     key={p.id}
                     disabled={deletingProfile}
                     onClick={() => {
                        selectProfile(p);
                     }}
                     className={`relative w-full p-4 rounded-lg flex items-center gap-4 transition-all overflow-hidden ${activeProfileId === p.id ? 'bg-amber-900/40 border border-amber-500/50 shadow-[inset_0_0_20px_rgba(245,158,11,0.2)]' : 'bg-white/5 border border-white/5 hover:bg-white/10'}`}
                   >
                      <div className="w-12 h-12 bg-black/50 rounded flex items-center justify-center shrink-0 border border-white/10 overflow-hidden">
                        <img src={getSpriteUrl(p.race, p.playerClass, readSlots(p.equipment, 2))} className="h-[200%] object-contain -mt-2" style={{ imageRendering: 'pixelated' }} />
                      </div>
                      <div className="flex flex-col text-left flex-1 min-w-0">
                         <div className={`font-bold truncate text-lg ${activeProfileId === p.id ? 'text-amber-400' : 'text-white'}`}>{p.name}</div>
                         <div className="text-xs text-neutral-400 capitalize">{p.race} {p.playerClass} • Level {p.level || 1}</div>
                      </div>
                   </button>
                 ))}
               </div>

               <div className="mt-6 flex flex-col gap-3">
                 {profileError && <p role="alert" className="text-sm text-red-400">{profileError}</p>}
                 <button disabled={deletingProfile} onClick={() => setShowCharacterCreator(true)} className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-bold transition-all border border-white/10 text-sm tracking-wider uppercase">
                   Create New Character
                 </button>
                 {confirmDelete && <div role="alertdialog" aria-label="Delete character" className="rounded-lg border border-red-500/40 p-3 text-sm text-red-200">
                   <p>Permanently delete {profiles.find(p => p.id === activeProfileId)?.name}? This cannot be undone.</p>
                   <div className="flex gap-3 mt-3">
                     <button disabled={deletingProfile} onClick={() => void deleteCharacter()} className="rounded bg-red-800 px-3 py-2">Confirm delete</button>
                     <button disabled={deletingProfile} onClick={() => setConfirmDelete(false)} className="rounded bg-neutral-800 px-3 py-2">Cancel</button>
                   </div>
                 </div>}
                 {activeProfileId && profiles.length > 0 && (
                   <button disabled={deletingProfile} onClick={() => {
                      setConfirmDelete(true);
                   }} className="w-full py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg font-bold transition-all border border-red-500/30 text-xs">
                     {deletingProfile ? 'Deleting…' : 'Delete Character'}
                   </button>
                 )}
               </div>

             </div>
           </div>
        )}
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

  const handleToolDurabilityLoss = () => {
    setHotbar(prev => {
        const newHotbar = [...prev];
        const slot = newHotbar[selectedSlotIndex];
        if (slot) {
            const maxDurability = 50;
            const currentDurability = slot.durability !== undefined ? slot.durability : maxDurability;
            if (currentDurability <= 1) {
                newHotbar[selectedSlotIndex] = null; // Item broke
                Sounds.mineBlock();
            } else {
                newHotbar[selectedSlotIndex] = { ...slot, durability: currentDurability - 1 };
            }
        }
        return newHotbar;
    });
  };

  const helmetType = getHelmet();
  const chestplateType = getChestplate();
  const currentActiveProfile = profiles.find(p => p.id === activeProfileId);

  return (
    <div className="w-full h-screen bg-neutral-900 flex flex-col overflow-hidden font-sans select-none touch-none" style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}>
      
      {/* Main Game Area */}
      <div className="flex-1 relative">

        <GameCanvas
          helmet={helmetType}
          chestplate={chestplateType}
          characterSkin={currentActiveProfile?.skin || characterSkin || 'orange'}
          race={currentActiveProfile?.race || creatorRace || 'human'}
          playerClass={currentActiveProfile?.playerClass || playerClass || 'warrior'}
          onArmorDamage={handleArmorDamage}
          onToolDurabilityLoss={handleToolDurabilityLoss}
          currentAmmoCount={currentAmmoCount} 
          nickname={nickname} 
          selectedBlock={selectedBlock} 
          roomId={serverName} 
          userId={currentUser?.uid}
          profileId={activeProfileId || undefined}
          isInventoryOpen={inventoryOpen || showInstructions || furnaceOpen || chestOpen || merchantOpen}
          onHealthChange={setHealth}
          stamina={stamina}
          maxStamina={maxStamina}
          onStaminaChange={setStamina}
          skills={skills}
          mana={mana}
          currentParty={party}
          keybinds={keybinds}
          magicUnlocked={quests.find(q => q.id === 'q5')?.completed === true}
          onManaChange={setMana}

          onTradeRequest={(senderId, senderName) => addNotification('trade', senderId, senderName)}
          onTradeStarted={(trade) => setActiveTrade(trade)}
          onTradeUpdated={(trade) => setActiveTrade(trade)}
          onTradeCompleted={(result) => {
              setActiveTrade(null);
              if (result.success && result.newProfile) {
                 const np = result.newProfile;
                 if (np.hotbar) setHotbar(JSON.parse(np.hotbar));
                 if (np.backpack) setBackpack(JSON.parse(np.backpack));
                 if (np.leftActionBar) setLeftActionBar(JSON.parse(np.leftActionBar));
                 if (np.rightActionBar) setRightActionBar(JSON.parse(np.rightActionBar));
              }
          }}
          onTradeCancelled={(tradeId) => { if (activeTrade?.tradeId === tradeId) setActiveTrade(null); }}
          onPartyInvite={(senderId, senderName) => addNotification('party', senderId, senderName)}
          onPartyUpdate={(updatedParty) => setParty(updatedParty)}
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
             setKills(prev => {
                const newKills = { ...prev };
                newKills[type] = (newKills[type] || 0) + 1;
                return newKills;
             });
             const xpGain = type === 'golem_boss' ? 250 : type === 'slime' ? 10 : 25;
             grantPlayerXp(xpGain);

             if (type === 'golem_boss') {
               setActiveLootRoll({
                 id: 'roll-' + Date.now(),
                 itemName: 'Obsidian Heart Greatsword',
                 itemType: BlockType.Diamond,
                 rarity: 'epic',
                 levelRequirement: 10,
                 timerSeconds: 25,
                 enchantment: '+3 Flametouched',
                 description: 'A colossal blade forged from molten obsidian and the pulsating core of the ancient golem.'
               });
             }
          }}
          onGiveSp={(amount) => setSkillPoints(sp => sp + amount)}
          onGiveXp={(amount) => grantPlayerXp(amount)}
          onGiveLevel={(amount) => grantPlayerLevel(amount)}
          onChestUpdated={(tx, ty, inventory) => {
             if (activeChestCoords?.tx === tx && activeChestCoords?.ty === ty) {
                setChestInventory(inventory);
             }
          }}

          onFireWeapon={handleFireWeapon}

          sendChatMsg={sendChatMsg}
          onChatMessage={(msg) => setChatMessages(prev => [...prev.slice(-49), { ...msg, id: Math.random().toString(), timestamp: msg.timestamp || Date.now() }])}
          onNearbyPlayersChange={setNearbyPlayers}
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
            if (minedBlockType === 999) return; // Don't add XP orbs to inventory!
            let blockType = minedBlockType;
            if (minedBlockType === BlockType.CoalOre) blockType = BlockType.Coal;
            if (minedBlockType === BlockType.DiamondOre) blockType = BlockType.Diamond;
            
            // Random chance for leaves to drop tree seed
            if (minedBlockType === BlockType.Leaves) {
               if (Math.random() < 0.25) {
                   blockType = 206; // TreeSeed
               } else {
                   // Drop nothing for most leaves
                   Sounds.mineBlock();
                   return;
               }
            }
            
            Sounds.mineBlock();
            
            // Add Woodcutting XP if applicable
            if (minedBlockType === BlockType.Wood || minedBlockType === BlockType.Leaves) {
               const wcXpGain = minedBlockType === BlockType.Wood ? 15 : 5;
               setSkills(prev => {
                  let currentLevel = prev.woodcutting || 1;
                  let nextXp = (prev.woodcuttingXp || 0) + wcXpGain;
                  let levelUp = false;
                  while (nextXp >= currentLevel * 50) {
                     nextXp -= currentLevel * 50;
                     currentLevel++;
                     levelUp = true;
                  }
                  if (levelUp) {
                     addNotification('system', 'System', 'System', `Woodcutting Level Up! Now level ${currentLevel}.`);
                  }
                  return { ...prev, woodcutting: currentLevel, woodcuttingXp: nextXp };
               });
            }

            // Add general XP for mining
            const xpGain = (minedBlockType === BlockType.DiamondOre) ? 15 : (minedBlockType === BlockType.GoldOre) ? 10 : (minedBlockType === BlockType.IronOre || minedBlockType === BlockType.CoalOre) ? 5 : 1;
            grantPlayerXp(xpGain);

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
            
            let foundInHotbar = false;
            let foundInBackpack = false;
            
            if (!isEquipable) {
              for (let i = 0; i < hotbar.length; i++) {
                if (hotbar[i] && hotbar[i]!.type === blockType && hotbar[i]!.count < 64) {
                  foundInHotbar = true;
                  break;
                }
              }
            }
            if (!foundInHotbar) {
              const emptyIdx = hotbar.findIndex(s => s === null);
              if (emptyIdx !== -1) foundInHotbar = true;
            }
            
            if (!foundInHotbar && !isEquipable) {
              for (let i = 0; i < backpack.length; i++) {
                if (backpack[i] && backpack[i]!.type === blockType && backpack[i]!.count < 64) {
                  foundInBackpack = true;
                  break;
                }
              }
            }
            if (!foundInHotbar && !foundInBackpack) {
              const emptyIdx = backpack.findIndex(s => s === null);
              if (emptyIdx !== -1) foundInBackpack = true;
            }
            
            if (foundInHotbar) {
               setHotbar(prevHotbar => {
                  const newHotbar = [...prevHotbar];
                  let added = false;
                  if (!isEquipable) {
                    for (let i = 0; i < newHotbar.length; i++) {
                      if (newHotbar[i] && newHotbar[i]!.type === blockType && newHotbar[i]!.count < 64) {
                        newHotbar[i] = { ...newHotbar[i]!, count: newHotbar[i]!.count + 1 };
                        added = true;
                        break;
                      }
                    }
                  }
                  if (!added) {
                    const emptyIdx = newHotbar.indexOf(null);
                    if (emptyIdx !== -1) {
                      newHotbar[emptyIdx] = { type: blockType, count: 1 };
                    }
                  }
                  return newHotbar;
               });
            } else if (foundInBackpack) {
               setBackpack(prevBp => {
                  const newBp = [...prevBp];
                  let added = false;
                  if (!isEquipable) {
                    for (let i = 0; i < newBp.length; i++) {
                      if (newBp[i] && newBp[i]!.type === blockType && newBp[i]!.count < 64) {
                        newBp[i] = { ...newBp[i]!, count: newBp[i]!.count + 1 };
                        added = true;
                        break;
                      }
                    }
                  }
                  if (!added) {
                    const emptyIdx = newBp.indexOf(null);
                    if (emptyIdx !== -1) {
                      newBp[emptyIdx] = { type: blockType, count: 1 };
                    }
                  }
                  return newBp;
               });
            }


            
            

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
              let color = 'bg-pink-500'; let textColor = 'text-pink-400'; let name = 'Guide';
              if (blockType === BlockType.GoblinNPC) { color = 'bg-green-500'; textColor = 'text-green-400'; name = 'Goblin Trader'; }
              if (blockType === BlockType.WizardNPC) { color = 'bg-purple-500'; textColor = 'text-purple-400'; name = 'Wizard'; }
              if (blockType === BlockType.QuestNPC) { color = 'bg-amber-500'; textColor = 'text-amber-400'; name = 'Quest Master'; }
              setNpcDialog({ name, text: 'Hello traveler! The world is dangerous, but full of riches. Check your Quest Log (Press Q) to see what you should do next!', color, ringColor: textColor });
            }
            if (blockType === BlockType.DurelNPC) {
              const killMsg = Object.entries(kills).map(([mob, count]) => `${count} ${mob}(s)`).join(', ');
              setNpcDialog({ name: 'DUREL', text: 'YOU HAVE SLAIN: ' + (killMsg || 'NOTHING YET!'), color: 'bg-red-600', ringColor: 'text-red-500' });
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
            setPlayerDepth(depth);
            setQuests(prev => prev.map(q => {
              if (q.id === 'q5' && !q.completed && depth >= 30 && q.prerequisiteId && prev.find(p => p.id === q.prerequisiteId)?.completed) {
                return { ...q, current: 1, completed: true };
              }
              return q;
            }));
          }}
          onPlayerCoordsChange={(x, y) => {
            setPlayerCoords({ x, y });
          }}
          onWorldPing={(x, y, pingType) => {
            Sounds.slotClick();
            setChatMessages(prev => [
              ...prev,
              {
                id: Math.random().toString(),
                sender: 'Danger Beacon',
                text: `${nickname || 'Player'} pinged danger beacon at [${x}, ${y}]!`,
                timestamp: Date.now()
              }
            ]);
            addNotification('system', 'System', 'System', `Danger beacon pinged at (${x}, ${y})!`);
          }}
        />
        
        {/* UI Overlay - Top Left */}
        <div className="absolute top-4 left-4 bg-black/50 text-white px-4 py-2 rounded-lg pointer-events-none text-sm border border-white/10">
          Playing on server: <span className="font-bold text-blue-400">{serverName}</span>
        </div>

        {/* Collapsible Draggable HUD Quest Tracker */}
        <HUDQuestTracker
          quests={quests}
          onOpenMenu={() => {
            setUnifiedMenuTab('quests');
            setInventoryOpen(true);
          }}
          position={hudLayout.questTracker}
          onPositionChange={(pos) => handleUpdateHUDLayout({ questTracker: { ...hudLayout.questTracker, ...pos, isCustom: true } })}
          isEditMode={isHUDEditMode}
          visible={hudLayout.questTracker.visible !== false}
          onHide={() => handleToggleElementVisibility('questTracker')}
        />

        {/* Dynamic Biome Mini-Radar & Depth Gauge */}
        <DynamicRadar
          playerPos={playerCoords}
          partyMembers={party?.members ? party.members.map(m => ({ id: m.id, name: m.name, x: m.x ?? (playerCoords.x + 8), y: m.y ?? (playerCoords.y - 4) })) : []}
          questTargets={quests.filter(q => !q.completed).map(q => ({ id: q.id, name: q.title || 'Quest', x: playerCoords.x + 25, y: playerCoords.y + 10 }))}
          depth={playerDepth}
          position={hudLayout.radar}
          onPositionChange={(pos) => handleUpdateHUDLayout({ radar: { ...hudLayout.radar, ...pos, isCustom: true } })}
          isEditMode={isHUDEditMode}
          visible={hudLayout.radar.visible !== false}
          onHide={() => handleToggleElementVisibility('radar')}
          onSendPing={(type) => {
            addNotification('system', 'Party Ping', 'Party Beacon', `${nickname || 'Hero'} beaconed a ${type} ping on coordinates [${Math.floor(playerCoords.x)}, ${Math.floor(playerCoords.y)}].`);
          }}
        />

        {/* Status Effects / Buffs & Debuffs Tray */}
        {(hudLayout.buffTray?.visible !== false || isHUDEditMode) && (
          <BuffDebuffTray
            effects={activeEffects}
            onDismiss={(id) => setActiveEffects(prev => prev.filter(e => e.id !== id))}
          />
        )}

        {/* HUD Party Overlay */}
        <HUDPartyOverlay
          party={party}
          nearbyPlayers={nearbyPlayers}
          currentUserId={socketRef.current?.id || ''}
          playerPos={playerCoords}
          position={hudLayout.partyOverlay}
          onPositionChange={(pos) => handleUpdateHUDLayout({ partyOverlay: { ...hudLayout.partyOverlay, ...pos, isCustom: true } })}
          isEditMode={isHUDEditMode}
          visible={hudLayout.partyOverlay.visible !== false}
          onHide={() => handleToggleElementVisibility('partyOverlay')}
          isBlockProtectionActive={isBlockProtectionActive}
          onToggleBlockProtection={handleToggleBlockProtection}
          onInvitePlayer={handleInvitePartyPlayer}
          onLeaveParty={handleLeaveParty}
          onStartReadyCheck={() => {
            addNotification('system', 'Ready Check', 'Party', '10-Second Party Ready Check initiated!');
          }}
          onInspectMember={(member) => {
            setInspectedPlayer({
              id: member.id,
              name: member.name,
              level: member.level || 10,
              playerClass: member.playerClass || 'warrior',
              equipment: equipment.slice(0, 4),
              stats: {
                hp: member.hp || 200,
                maxHp: member.maxHp || 200,
                defense: 15,
                attack: 25
              }
            });
          }}
        />

        {/* Left Action Bar (Draggable & Rotatable) */}
        <DraggableHUDBar
          id="hud-left-action-bar"
          title="Left Action Bar"
          layout={hudLayout.leftActionBar}
          onLayoutChange={(updated) => handleUpdateHUDLayout({ leftActionBar: { ...hudLayout.leftActionBar, ...updated } })}
          onRotate={() => handleRotateHotbar('leftActionBar')}
          onHide={() => handleToggleElementVisibility('leftActionBar')}
          isEditMode={isHUDEditMode}
          defaultPositionStyle={{ left: '8px', top: '50%', transform: 'translateY(-50%)' }}
        >
          <div className={`bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10 flex ${hudLayout.leftActionBar.rotation === 90 ? 'flex-row' : 'flex-col'} gap-1 shadow-2xl ${inventoryOpen ? 'pointer-events-auto' : ''}`}>
            {leftActionBar.map((slot, index) => (
              <button
                key={'l' + index}
                onClick={() => { handleSlotClick('leftActionBar', index); }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'leftActionBar', index)}
                onMouseEnter={() => { if (hoveredSlotRef) hoveredSlotRef.current = { type: 'leftActionBar', index }; }}
                onMouseLeave={() => { if (hoveredSlotRef) hoveredSlotRef.current = null; }}
                onContextMenu={(e) => { e.preventDefault(); if (inventoryOpen) handleSlotClick('leftActionBar', index, true); }}
                className="w-12 h-12 p-1.5 rounded-lg relative bg-black/50 hover:bg-white/10 transition-colors"
              >
                {renderBlockIcon(slot)}
              </button>
            ))}
          </div>
        </DraggableHUDBar>

        {/* Right Action Bar (Draggable & Rotatable) */}
        <DraggableHUDBar
          id="hud-right-action-bar"
          title="Right Action Bar"
          layout={hudLayout.rightActionBar}
          onLayoutChange={(updated) => handleUpdateHUDLayout({ rightActionBar: { ...hudLayout.rightActionBar, ...updated } })}
          onRotate={() => handleRotateHotbar('rightActionBar')}
          onHide={() => handleToggleElementVisibility('rightActionBar')}
          isEditMode={isHUDEditMode}
          defaultPositionStyle={{ right: '8px', top: '50%', transform: 'translateY(-50%)' }}
        >
          <div className={`bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10 flex ${hudLayout.rightActionBar.rotation === 90 ? 'flex-row' : 'flex-col'} gap-1 shadow-2xl ${inventoryOpen ? 'pointer-events-auto' : ''}`}>
            {rightActionBar.map((slot, index) => (
              <button
                key={'r' + index}
                onClick={() => { handleSlotClick('rightActionBar', index); }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'rightActionBar', index)}
                onMouseEnter={() => { if (hoveredSlotRef) hoveredSlotRef.current = { type: 'rightActionBar', index }; }}
                onMouseLeave={() => { if (hoveredSlotRef) hoveredSlotRef.current = null; }}
                onContextMenu={(e) => { e.preventDefault(); if (inventoryOpen) handleSlotClick('rightActionBar', index, true); }}
                className="w-12 h-12 p-1.5 rounded-lg relative bg-black/50 hover:bg-white/10 transition-colors"
              >
                {renderBlockIcon(slot)}
              </button>
            ))}
          </div>
        </DraggableHUDBar>

                {/* Player Status HUD */}
        <div className="absolute top-4 right-4 flex flex-col gap-3 w-64 bg-black/50 p-4 rounded-xl border border-white/10 backdrop-blur-md shadow-2xl">
           
           {/* Level & XP */}
           <div className="flex justify-between items-center mb-1">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-black text-black shadow-[0_0_10px_rgba(251,191,36,0.5)]">
                   {level}
                </div>
                <div className="flex flex-col">
                   <span className="text-xs font-bold text-white uppercase tracking-wider">{nickname || 'Player'}</span>
                   <span className="text-[10px] text-amber-400 font-bold">{xp} / {level * 100} XP</span>
                </div>
             </div>
           </div>
           
           {/* XP Progress Bar */}
           <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden shadow-inner -mt-1">
              <div className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 transition-all duration-300" style={{ width: `${(xp / (level * 100)) * 100}%` }}></div>
           </div>

           {/* Health Bar */}
           <div className="flex flex-col gap-1 mt-1">
             <div className="flex justify-between items-center px-1">
                <span className="text-[10px] uppercase font-black text-red-400 tracking-wider flex items-center gap-1"><Heart size={10} className="fill-red-400" /> HP</span>
                <span className="text-[10px] font-bold text-neutral-300">{health} / {20 + (skills.strength || 0) * 10}</span>
             </div>
             <div className="w-full h-3 bg-neutral-800 rounded-full overflow-hidden shadow-inner border border-red-900/30">
                <div className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-300 relative" style={{ width: `${(health / (20 + (skills.strength || 0) * 10)) * 100}%` }}>
                   <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] w-full h-full animate-[shimmer_2s_infinite]"></div>
                </div>
             </div>
           </div>

           {/* Stamina Bar */}
           <div className="flex flex-col gap-1">
             <div className="flex justify-between items-center px-1">
                <span className="text-[10px] uppercase font-black text-amber-400 tracking-wider flex items-center gap-1"><Zap size={10} className="fill-amber-400" /> SP</span>
                <span className="text-[10px] font-bold text-neutral-300">{Math.round(stamina)} / {maxStamina}</span>
             </div>
             <div className="w-full h-2.5 bg-neutral-800 rounded-full overflow-hidden shadow-inner border border-amber-900/30">
                <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-150 relative" style={{ width: `${Math.max(0, Math.min(100, (stamina / maxStamina) * 100))}%` }}>
                   <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.25)_50%,transparent_100%)] w-full h-full"></div>
                </div>
             </div>
           </div>

           {/* Mana Bar */}
           {quests.find(q => q.id === 'q5')?.completed && (
             <div className="flex flex-col gap-1">
               <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] uppercase font-black text-blue-400 tracking-wider flex items-center gap-1">MP</span>
                  <span className="text-[10px] font-bold text-neutral-300">{mana} / {100 + (skills.intelligence || 0) * 20}</span>
               </div>
               <div className="w-full h-3 bg-neutral-800 rounded-full overflow-hidden shadow-inner border border-blue-900/30">
                  <div className="h-full bg-gradient-to-r from-blue-700 to-cyan-400 transition-all duration-300 relative" style={{ width: `${(mana / (100 + (skills.intelligence || 0) * 20)) * 100}%` }}>
                     <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] w-full h-full animate-[shimmer_2s_infinite]"></div>
                  </div>
               </div>
             </div>
           )}
        </div>
        {/* Multi-Channel Chat System */}
        <ChannelChat
          messages={chatMessages}
          isOpen={isChatOpen}
          onOpenChange={setIsChatOpen}
          onSendMessage={handleSendChatMessage}
        />

        {/* Action Bar Loadout Presets */}
        <div className={`absolute bottom-[78px] left-1/2 transform -translate-x-1/2 ${inventoryOpen ? 'z-[60]' : 'z-20'}`}>
          <ActionBarPresets
            activePreset={activeLoadoutPreset}
            onSelectPreset={handleSelectLoadoutPreset}
          />
        </div>
        
        {/* UI Overlay - Hotbar (Draggable & Rotatable 90 deg) */}
        <DraggableHUDBar
          id="hud-main-hotbar"
          title="Main Hotbar"
          layout={hudLayout.hotbar}
          onLayoutChange={(updated) => handleUpdateHUDLayout({ hotbar: { ...hudLayout.hotbar, ...updated } })}
          onRotate={() => handleRotateHotbar('hotbar')}
          onHide={() => handleToggleElementVisibility('hotbar')}
          isEditMode={isHUDEditMode}
          defaultPositionStyle={{ bottom: '24px', left: '50%', transform: 'translateX(-50%)' }}
        >
          <div className={`flex gap-1 p-2 bg-black/50 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl ${hudLayout.hotbar.rotation === 90 ? 'flex-col' : 'flex-row'} ${inventoryOpen ? 'pointer-events-auto' : ''}`}>
            {hotbar.map((slot, index) => {
              const isSelected = selectedSlotIndex === index && !inventoryOpen;
              return (
                <button
                  key={index}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'hotbar', index)}
                  onMouseEnter={() => { if (hoveredSlotRef) hoveredSlotRef.current = { type: 'hotbar', index }; }}
                  onMouseLeave={() => { if (hoveredSlotRef) hoveredSlotRef.current = null; }}
                  onClick={() => {
                    handleSlotClick('hotbar', index);
                  }}
                  onContextMenu={(e) => { e.preventDefault(); if (inventoryOpen) handleSlotClick('hotbar', index, true); }}
                  className={`w-12 h-12 p-1.5 rounded-lg relative transition-all duration-200 ${
                    isSelected 
                      ? 'ring-2 ring-amber-400 scale-110 bg-gradient-to-t from-white/20 to-transparent shadow-[0_0_15px_rgba(251,191,36,0.5)] z-10' 
                      : 'hover:bg-white/10 opacity-70 hover:opacity-100 bg-black/50'
                  }`}
                >
                  <div className="absolute -top-1 -left-1 text-[9px] font-black bg-black/60 text-white w-4 h-4 flex items-center justify-center rounded border border-white/20 shadow-sm">{index + 1}</div>
                  {renderBlockIcon(slot)}
                  {/* Persistent active slot indicator dot */}
                  {isSelected && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
                      <div className="w-3.5 h-1 bg-amber-400 rounded-full shadow-[0_0_8px_#fbbf24] animate-pulse" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </DraggableHUDBar>
        {/* Consolidated Unified Menu */}
        <UnifiedMenu
          isOpen={inventoryOpen}
          onClose={() => {
            setInventoryOpen(false);
            if (cursorItem) returnCursorItemToInventory(cursorItem);
          }}
          activeTab={unifiedMenuTab}
          onTabChange={setUnifiedMenuTab}
          hotbar={hotbar}
          backpack={backpack}
          leftActionBar={leftActionBar}
          rightActionBar={rightActionBar}
          showLeftActionBar={showLeftActionBar}
          setShowLeftActionBar={setShowLeftActionBar}
          showRightActionBar={showRightActionBar}
          setShowRightActionBar={setShowRightActionBar}
          party={party}
          nearbyPlayers={nearbyPlayers}
          onInvitePartyPlayer={handleInvitePartyPlayer}
          onInspectPartyPlayer={(member) => {
            setInspectedPlayer({
              id: member.id,
              name: member.name,
              level: member.level || 10,
              playerClass: member.playerClass || 'warrior',
              equipment: equipment.slice(0, 4),
              stats: {
                hp: member.hp || 200,
                maxHp: member.maxHp || 200,
                defense: 15,
                attack: 25
              }
            });
          }}
          onLeaveParty={handleLeaveParty}
          onStartReadyCheck={() => {
            addNotification('system', 'Ready Check', 'Party', 'Party Ready Check broadcasted!');
          }}
          equipment={equipment}
          craftingGrid={craftingGrid}
          craftingResult={craftingResult}
          cursorItem={cursorItem}
          onSlotClick={handleSlotClick}
          onClearCrafting={handleClearCraftingGrid}
          onQuickSort={handleQuickSort}
          onQuickStack={handleQuickStack}
          onTossItem={handleTossItem}
          onTriggerHUDEdit={() => {
            setInventoryOpen(false);
            setIsHUDEditMode(true);
          }}
          onApplyEnchant={handleApplyEnchant}
          onApplyGem={handleApplyGem}
          onDismantle={handleDismantle}
          onSlotHover={(_slot, _e, type, index) => {
            if (type && index !== undefined) {
              hoveredSlotRef.current = { type, index };
            }
          }}
          onSlotLeave={() => {
            hoveredSlotRef.current = null;
          }}
          onAddAbilityToBar={handleAddAbilityToBar}
          onAbilityDragStart={handleAbilityDragStart}
          renderBlockIcon={renderBlockIcon}
          player={{
            nickname: nickname || 'Hero',
            skin: characterSkin,
            level: level,
            xp: xp,
            health: health,
            mana: mana,
            stamina: stamina,
            maxStamina: maxStamina,
            kills: kills || {},
            statPoints: statPoints,
            skillPoints: skillPoints,
            skills: skills,
            abilities: abilities,
            onAllocateSkill: (stat) => {
              if (statPoints <= 0 && skillPoints <= 0) return;
              if (stat === 'dexterity' && (skills.dexterity || 0) >= 10) return;
              if (statPoints > 0) {
                setStatPoints(sp => Math.max(0, sp - 1));
              } else {
                setSkillPoints(sp => Math.max(0, sp - 1));
              }
              setSkills(s => ({ ...s, [stat]: (s[stat] || 0) + 1 }));
              Sounds.levelUp();
            },
            onAllocateAbility: (ability) => {
              if (ability.startsWith('spec_')) {
                setAbilities(a => ({ ...a, [ability]: 1 }));
                return;
              }
              if (skillPoints <= 0) return;
              if (ability === 'double_jump' && (abilities.double_jump || 0) >= 1) return;
              setSkillPoints(sp => Math.max(0, sp - 1));
              setAbilities(a => ({ ...a, [ability]: (a[ability] || 0) + 1 }));
              Sounds.levelUp();
            }
          }}
          quests={quests}
          keybinds={keybinds}
          setKeybinds={setKeybinds}
          volume={volume}
          setVolume={(val) => {
            setVolume(val);
            if (val > 0) setIsMuted(false);
          }}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          onLeaveWorld={() => {
            void saveProgress();
            setInventoryOpen(false);
            setAppState('serverBrowser');
            Sounds.slotClick();
          }}
          playerClass={playerClass}
          selectedSlotIndex={selectedSlotIndex}
          onSelectHotbarSlot={setSelectedSlotIndex}
        />

        {/* NPC Dialogue Overlay */}
        {npcDialog && (
          <div className="absolute inset-x-0 bottom-24 flex justify-center z-40 pointer-events-none">
            <div className="bg-black/80 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-2xl flex items-start gap-4 w-full max-w-2xl pointer-events-auto">
               <div className="w-16 h-16 bg-neutral-800 rounded-xl border border-neutral-700 flex items-center justify-center shrink-0">
                 <div className={`w-8 h-8 rounded-full ${npcDialog.color}`}></div>
               </div>
               <div className="flex-1">
                 <h3 className={`${npcDialog.ringColor} font-black text-xl mb-1 uppercase tracking-wider`}>{npcDialog.name}</h3>
                 <p className="text-white text-lg font-medium leading-relaxed">
                   {npcDialog.text}
                 </p>
                 <button onClick={() => setNpcDialog(null)} className="mt-4 text-xs font-bold text-neutral-400 hover:text-white uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full transition-colors">Close</button>
               </div>
            </div>
          </div>
        )}




        {/* Ready Check Modal */}
        {readyCheck && (
           <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
               <div className="bg-[#1A1A1E] border border-indigo-500/30 p-8 rounded-3xl shadow-2xl max-w-sm w-full flex flex-col items-center">
                   <Activity size={48} className="text-indigo-500 mb-4 animate-pulse" />
                   <h2 className="text-2xl font-black text-white tracking-tight mb-2 text-center">Dungeon Ready!</h2>
                   <p className="text-neutral-400 text-center mb-8 text-sm">Your party is ready for {readyCheck.instanceId}.</p>
                   <div className="flex gap-4 w-full">
                       <button onClick={() => { if (socketRef.current) socketRef.current.emit('decline_ready_check'); setReadyCheck(null); }} className="flex-1 bg-red-600/20 hover:bg-red-500 hover:text-white text-red-500 font-bold py-3 rounded-xl transition-all">Decline</button>
                       <button onClick={() => { if (socketRef.current) socketRef.current.emit('accept_ready_check'); }} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all">Accept</button>
                   </div>
               </div>
           </div>
        )}

        {/* Instances Modal */}
        {instancesOpen && (
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40" onClick={() => setInstancesOpen(false)}>
               <div className="bg-[#0A0A0B] border border-neutral-800 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col" style={{ maxHeight: '80vh' }} onClick={e => e.stopPropagation()}>
                   <div className="bg-[#1A1A1E] p-4 flex justify-between items-center border-b border-neutral-800">
                       <h2 className="text-white font-bold flex items-center gap-2"><Globe size={18} className="text-indigo-500"/> Instance Finder</h2>
                       <button onClick={() => setInstancesOpen(false)} className="text-neutral-400 hover:text-white p-2">
                           <X size={20} />
                       </button>
                   </div>
                   <div className="p-6 overflow-y-auto">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="bg-[#151518] border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
                               <div>
                                   <h3 className="text-xl font-black text-white mb-2">Linear Dungeon</h3>
                                   <p className="text-neutral-400 text-sm mb-4">A straightforward dark tunnel filled with dangerous mobs and a challenging boss encounter at the very end.</p>
                                   <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-wider mb-6">
                                       <Activity size={14} className="text-red-500" /> Recommended: Party of 2+
                                   </div>
                               </div>
                               <button onClick={() => {
                                   if (socketRef.current) socketRef.current.emit('queue_instance', { instanceId: 'dungeon' });
                               }} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)]">
                                   Queue for Dungeon
                               </button>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
        )}

        {/* Chest Modal Overlay */}
        {chestOpen && (
          <div 
             className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none animate-in fade-in duration-200"
             onMouseDown={(e) => {
               if (e.target === e.currentTarget) {
                 setChestOpen(false);
                 setActiveChestCoords(null);
                 if (cursorItem) returnCursorItemToInventory(cursorItem);
               }
             }}
          >
            <div className="bg-neutral-950/95 border border-amber-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.85)] p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto custom-scrollbar relative w-full max-w-xl">
              <button 
                onClick={() => {
                  Sounds.slotClick();
                  setChestOpen(false);
                  setActiveChestCoords(null);
                  if (cursorItem) {
                    returnCursorItemToInventory(cursorItem);
                  }
                }}
                className="absolute top-4 right-4 text-neutral-400 hover:text-amber-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-3 border-b border-amber-500/20 pb-3">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <Package size={22} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg leading-none tracking-wide">Storage Chest</h3>
                  <p className="text-xs text-neutral-400 mt-1">Store and retrieve items safely</p>
                </div>
              </div>
              
              {/* Chest Grid */}
              <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
                <span className="text-[11px] font-bold text-amber-400/90 uppercase tracking-wider mb-2 block">Chest Contents</span>
                <div className="grid grid-cols-9 gap-1.5">
                  {chestInventory.map((slot, i) => (
                    <button
                      key={i}
                      onClick={() => handleSlotClick('chest', i)}
                      onContextMenu={(e) => { e.preventDefault(); handleSlotClick('chest', i, true); }}
                      onMouseEnter={() => Sounds.slotHover()}
                      className="w-12 h-12 rounded-lg bg-neutral-950/70 border border-neutral-800 hover:border-amber-400/60 hover:bg-neutral-800/60 transition-all flex items-center justify-center relative active:scale-95"
                    >
                      {renderBlockIcon(slot)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Backpack Grid */}
              <div className="bg-neutral-900/40 p-3 rounded-xl border border-neutral-800">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Backpack</span>
                <div className="grid grid-cols-9 gap-1.5">
                  {backpack.map((slot, i) => (
                    <button
                      key={i}
                      onClick={() => handleSlotClick('backpack', i)}
                      onContextMenu={(e) => { e.preventDefault(); handleSlotClick('backpack', i, true); }}
                      onMouseEnter={() => Sounds.slotHover()}
                      className="w-12 h-12 rounded-lg bg-neutral-950/70 border border-neutral-800 hover:border-amber-400/60 hover:bg-neutral-800/60 transition-all flex items-center justify-center relative active:scale-95"
                    >
                      {renderBlockIcon(slot)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hotbar Grid */}
              <div className="bg-neutral-900/40 p-3 rounded-xl border border-neutral-800">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Hotbar</span>
                <div className="grid grid-cols-9 gap-1.5">
                  {hotbar.map((slot, i) => (
                    <button
                      key={i}
                      onClick={() => handleSlotClick('hotbar', i)}
                      onContextMenu={(e) => { e.preventDefault(); handleSlotClick('hotbar', i, true); }}
                      onMouseEnter={() => Sounds.slotHover()}
                      className="w-12 h-12 rounded-lg bg-neutral-950/70 border border-neutral-800 hover:border-amber-400/60 hover:bg-neutral-800/60 transition-all flex items-center justify-center relative active:scale-95"
                    >
                      {renderBlockIcon(slot)}
                      <span className="absolute top-0.5 left-1 text-[9px] font-mono font-bold text-neutral-500 pointer-events-none">
                        {i === 9 ? '0' : i + 1}
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
                  if (socketRef.current) socketRef.current.emit('send_party_invite', { targetId: interactPlayerId });
                  setNotifications(prev => [...prev, { id: Math.random().toString(), type: 'party', senderId: interactPlayerId, senderName: "System", timestamp: Date.now(), msg: 'Party invite sent.' } as any]);
                  setInteractPlayerId(null);
                }}
                className="w-full bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 py-3 rounded-xl font-bold border border-blue-500/30 transition-colors"
              >
                Invite to Party
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
                onClick={() => {
                  const targetMember = party?.members.find(m => m.id === interactPlayerId);
                  setInspectedPlayer({
                    id: interactPlayerId,
                    name: interactPlayerName || 'Hero',
                    level: 12,
                    playerClass: (targetMember?.role === 'tank' ? 'Warrior' : targetMember?.role === 'healer' ? 'Mage' : 'Ranger') as any,
                    race: 'Human',
                    equipment: [
                      { type: BlockType.Diamond, prefix: 'flametouched', enchantLevel: 5, gem1: 'ruby' },
                      { type: 104, prefix: 'fortified', enchantLevel: 3, gem1: 'emerald' },
                      { type: 105, prefix: 'fleetfoot', enchantLevel: 2, gem1: 'sapphire' }
                    ],
                    stats: {
                      attack: 54,
                      defense: 38,
                      health: 240,
                      maxHealth: 240,
                      mana: 160,
                      maxMana: 160,
                      critChance: 18,
                      speedBonus: 15
                    },
                    guild: 'Silver Vanguard',
                    achievementsCount: 24
                  });
                  setInteractPlayerId(null);
                }}
                className="w-full bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 py-3 rounded-xl font-bold border border-purple-500/30 transition-colors flex items-center justify-center gap-2"
              >
                <Eye size={18} /> Inspect Player Gear
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
             className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none animate-in fade-in duration-200"
             onMouseDown={(e) => {
               if (e.target === e.currentTarget) {
                 setMerchantOpen(false);
                 returnCursorItemToInventory(cursorItem);
               }
             }}
          >
            <div className="bg-neutral-950/95 border border-amber-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.85)] p-6 flex flex-col gap-5 w-full max-w-lg relative">
              <button 
                onClick={() => {
                  Sounds.slotClick();
                  setMerchantOpen(false);
                }}
                className="absolute top-4 right-4 text-neutral-400 hover:text-amber-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-3 border-b border-amber-500/20 pb-3">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <Coins size={22} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg leading-none tracking-wide">Wandering Merchant</h3>
                  <p className="text-xs text-neutral-400 mt-1">Barter raw commodities for rare treasures</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
                <div className="flex flex-col items-center">
                  <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider mb-2">Payment</span>
                  <button
                    onClick={() => handleSlotClick('merchantPayment', 0)}
                    onContextMenu={(e) => { e.preventDefault(); handleSlotClick('merchantPayment', 0, true); }}
                    onMouseEnter={() => Sounds.slotHover()}
                    className="w-16 h-16 rounded-xl bg-neutral-950/80 border border-neutral-700 hover:border-amber-400/70 hover:bg-neutral-800/60 transition-all flex items-center justify-center relative active:scale-95 shadow-inner"
                  >
                    {merchantPayment ? renderBlockIcon(merchantPayment) : null}
                  </button>
                </div>
                
                <div className="flex flex-col items-center gap-2">
                   <ArrowRight className="text-amber-400/80 w-6 h-6 animate-pulse" />
                   <button 
                     onClick={() => { Sounds.craftSuccess(); handleMerchantTrade(); }}
                     className="bg-amber-600 hover:bg-amber-500 text-neutral-950 font-black px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 border border-amber-400/60"
                     disabled={!merchantPayment}
                   >
                     TRADE
                   </button>
                </div>
                
                <div className="flex flex-col items-center">
                  <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider mb-2">Received</span>
                  <button
                    onClick={() => handleSlotClick('merchantOutput', 0)}
                    onContextMenu={(e) => { e.preventDefault(); handleSlotClick('merchantOutput', 0, true); }}
                    onMouseEnter={() => Sounds.slotHover()}
                    className="w-16 h-16 rounded-xl bg-neutral-950/80 border border-neutral-700 hover:border-amber-400/70 hover:bg-neutral-800/60 transition-all flex items-center justify-center relative active:scale-95 shadow-inner"
                  >
                    {merchantOutput ? renderBlockIcon(merchantOutput) : null}
                  </button>
                </div>
              </div>

              <div className="bg-neutral-900/40 rounded-xl p-3.5 border border-neutral-800/80">
                <h4 className="text-[11px] text-amber-400/90 font-bold uppercase tracking-wider mb-2">Exchange Catalog</h4>
                <ul className="text-xs text-neutral-300 space-y-1.5 font-medium">
                   <li className="flex justify-between py-1 px-2 rounded bg-neutral-950/40"><span>5 Gold Ingots</span> <span className="text-amber-300 font-bold font-mono">➔ 1 Diamond</span></li>
                   <li className="flex justify-between py-1 px-2 rounded bg-neutral-950/40"><span>3 Iron Ingots</span> <span className="text-amber-300 font-bold font-mono">➔ 1 Iron Sword</span></li>
                   <li className="flex justify-between py-1 px-2 rounded bg-neutral-950/40"><span>10 Coal</span> <span className="text-amber-300 font-bold font-mono">➔ 1 Apple</span></li>
                </ul>
              </div>

            </div>
          </div>
      )}

      
      {/* Notifications Overlay */}
      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className="bg-neutral-950/90 backdrop-blur-xl border border-amber-500/30 p-3.5 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.75)] flex items-center justify-between gap-4 animate-in fade-in slide-in-from-right-4 duration-300 pointer-events-auto max-w-sm">
             <div className="flex items-center gap-3">
               {n.type === 'trade' ? <Star className="text-amber-400 w-5 h-5 shrink-0" /> : n.type === 'friend' ? <Heart className="text-emerald-400 w-5 h-5 shrink-0" /> : n.type === 'level_up' ? <Award className="text-amber-400 w-5 h-5 shrink-0 animate-bounce" /> : <Shield className="text-sky-400 w-5 h-5 shrink-0" />}
               <div>
                 <p className="text-xs font-bold text-neutral-100 leading-snug">{n.msg ? n.msg : (n.type === 'trade' ? 'Trade Request' : n.type === 'friend' ? 'Friend Request' : 'Party Invite')}</p>
                 {!n.msg && <p className="text-[11px] text-neutral-400">From {n.senderName}</p>}
               </div>
             </div>
             {n.type !== 'system' && n.type !== 'level_up' && (
               <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => {
                     setNotifications(prev => prev.filter(x => x.id !== n.id));
                     if (n.type === 'trade') {
                         setIsChatOpen(true);
                         if (chatInputRef.current) {
                             chatInputRef.current.value = 'I accept your trade request!';
                             chatInputRef.current.focus();
                         }
                     } else if (n.type === 'party') {
                         setParty({
                           id: 'party_' + n.senderId,
                           leaderId: n.senderId,
                           members: [
                             { id: n.senderId, name: n.senderName || 'Leader', isLeader: true, hp: 100, maxHp: 100, level: 5, playerClass: 'warrior' },
                             { id: socketRef.current?.id || 'me', name: nickname, isLeader: false, hp: health, maxHp: 20 + (skills.strength || 0) * 10, level, playerClass }
                           ]
                         });
                         if (socketRef.current) socketRef.current.emit('chat_message', { text: 'I joined your party!', channel: 'party', room: serverName });
                     } else if (n.type === 'friend') {
                         setSendChatMsg({text: 'I accepted your friend request!', timestamp: Date.now()});
                         if (socketRef.current) socketRef.current.emit('chat_message', { text: 'I accepted your friend request!', room: serverName });
                     }
                  }} className="bg-emerald-600/80 hover:bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors border border-emerald-500/40">
                    Accept
                  </button>
                  <button onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors border border-neutral-700">
                    Decline
                  </button>
               </div>
             )}
          </div>
        ))}
      </div>

      {furnaceOpen && (
          <div 
             className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none animate-in fade-in duration-200"
             onMouseDown={(e) => {
               if (e.target === e.currentTarget) {
                 setFurnaceOpen(false);
                 returnCursorItemToInventory(cursorItem);
               }
             }}
          >
            <div className="bg-neutral-950/95 border border-amber-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.85)] p-6 flex flex-col gap-5 w-full max-w-lg relative max-h-[90vh] overflow-y-auto custom-scrollbar">
              <button 
                onClick={() => {
                  Sounds.slotClick();
                  setFurnaceOpen(false);
                }}
                className="absolute top-4 right-4 text-neutral-400 hover:text-amber-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-3 border-b border-amber-500/20 pb-3">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <Flame size={22} className="text-amber-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg leading-none tracking-wide">Blast Furnace</h3>
                  <p className="text-xs text-neutral-400 mt-1">Smelt raw ores with coal into refined ingots</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-4 bg-neutral-900/60 p-5 rounded-xl border border-neutral-800">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-neutral-400 mb-1 font-bold uppercase tracking-wider">Ore Input</span>
                    <button
                      onClick={() => handleSlotClick('furnaceInput', 0)}
                      onContextMenu={(e) => { e.preventDefault(); handleSlotClick('furnaceInput', 0, true); }}
                      onMouseEnter={() => Sounds.slotHover()}
                      className="w-14 h-14 rounded-xl bg-neutral-950/80 border border-neutral-700 hover:border-amber-400/70 hover:bg-neutral-800/60 transition-all flex items-center justify-center relative active:scale-95 shadow-inner"
                    >
                      {furnaceInput ? renderBlockIcon(furnaceInput) : null}
                    </button>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-neutral-400 mb-1 font-bold uppercase tracking-wider">Fuel (Coal)</span>
                    <button
                      onClick={() => handleSlotClick('furnaceFuel', 0)}
                      onContextMenu={(e) => { e.preventDefault(); handleSlotClick('furnaceFuel', 0, true); }}
                      onMouseEnter={() => Sounds.slotHover()}
                      className="w-14 h-14 rounded-xl bg-neutral-950/80 border border-neutral-700 hover:border-amber-400/70 hover:bg-neutral-800/60 transition-all flex items-center justify-center relative active:scale-95 shadow-inner"
                    >
                      {furnaceFuel ? renderBlockIcon(furnaceFuel) : null}
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col items-center justify-center flex-1 px-4">
                   <div className="w-full bg-neutral-950 rounded-full h-2 mb-2 border border-neutral-800 overflow-hidden shadow-inner">
                      <div className="bg-gradient-to-r from-amber-600 to-yellow-400 h-full rounded-full transition-all duration-200 shadow-[0_0_10px_rgba(245,158,11,0.5)]" style={{ width: `${smeltProgress}%` }}></div>
                   </div>
                   <span className="text-[10px] text-amber-400 font-mono font-bold">{smeltProgress > 0 ? `${Math.round(smeltProgress)}%` : 'Idle'}</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-amber-400 mb-1 font-bold uppercase tracking-wider">Smelted Output</span>
                  <button
                    onClick={() => handleSlotClick('furnaceOutput', 0)}
                    onContextMenu={(e) => { e.preventDefault(); handleSlotClick('furnaceOutput', 0, true); }}
                    onMouseEnter={() => Sounds.slotHover()}
                    className="w-16 h-16 rounded-xl bg-neutral-950/80 border border-amber-500/40 hover:border-amber-400/80 hover:bg-neutral-800/60 transition-all flex items-center justify-center relative active:scale-95 shadow-inner"
                  >
                    {furnaceOutput ? renderBlockIcon(furnaceOutput) : null}
                  </button>
                </div>
              </div>

              {/* Backpack Grid */}
              <div className="bg-neutral-900/40 p-3 rounded-xl border border-neutral-800">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Backpack</span>
                <div className="grid grid-cols-9 gap-1.5">
                  {backpack.map((slot, i) => (
                    <button
                      key={i}
                      onClick={() => handleSlotClick('backpack', i)}
                      onContextMenu={(e) => { e.preventDefault(); handleSlotClick('backpack', i, true); }}
                      onMouseEnter={() => Sounds.slotHover()}
                      className="w-12 h-12 rounded-lg bg-neutral-950/70 border border-neutral-800 hover:border-amber-400/60 hover:bg-neutral-800/60 transition-all flex items-center justify-center relative active:scale-95"
                    >
                      {renderBlockIcon(slot)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hotbar Grid */}
              <div className="bg-neutral-900/40 p-3 rounded-xl border border-neutral-800">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Hotbar</span>
                <div className="grid grid-cols-9 gap-1.5">
                  {hotbar.map((slot, i) => (
                    <button
                      key={i}
                      onClick={() => handleSlotClick('hotbar', i)}
                      onContextMenu={(e) => { e.preventDefault(); handleSlotClick('hotbar', i, true); }}
                      onMouseEnter={() => Sounds.slotHover()}
                      className="w-12 h-12 rounded-lg bg-neutral-950/70 border border-neutral-800 hover:border-amber-400/60 hover:bg-neutral-800/60 transition-all flex items-center justify-center relative active:scale-95"
                    >
                      {renderBlockIcon(slot)}
                      <span className="absolute top-0.5 left-1 text-[9px] font-mono font-bold text-neutral-500 pointer-events-none">
                        {i === 9 ? '0' : i + 1}
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

        {/* HUD Edit Mode Overlay */}
        <HUDEditOverlay
          isActive={isHUDEditMode}
          layout={hudLayout}
          onClose={() => setIsHUDEditMode(false)}
          onReset={handleResetHUDLayout}
          onToggleVisibility={handleToggleElementVisibility}
          onRotateBar={handleRotateHotbar}
        />

        {/* Interactive Party Loot Roll Window */}
        {activeLootRoll && (
          <PartyLootRollModal
            item={activeLootRoll}
            onRoll={(decision) => {
              Sounds.slotClick();
              setChatMessages(prev => [
                ...prev,
                {
                  id: Math.random().toString(),
                  sender: 'Loot System',
                  text: `${nickname || 'Hero'} selected [${decision.toUpperCase()}] for ${activeLootRoll.itemName}.`,
                  timestamp: Date.now()
                }
              ]);
              setActiveLootRoll(null);
            }}
            onClose={() => setActiveLootRoll(null)}
          />
        )}

        {/* Deep Player Inspection Modal */}
        {inspectedPlayer && (
          <PlayerInspectModal
            player={inspectedPlayer}
            onClose={() => setInspectedPlayer(null)}
            renderBlockIcon={renderBlockIcon}
          />
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
                      <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white border border-white/5">SHIFT</span> <span className="text-sm text-neutral-300">Sprint (Consumes Stamina)</span></li>
                      <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white border border-white/5"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg></span> <span className="text-sm text-neutral-300">Left Click to Mine/Attack</span></li>
                      <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white border border-white/5"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg></span> <span className="text-sm text-neutral-300">Right Click to Place/Interact</span></li>
                    </ul>
                 </div>
                 
                 <div className="bg-[#0A0A0B]/80 p-6 rounded-3xl border border-white/5">
                    <h3 className="text-sm uppercase tracking-widest text-neutral-500 font-bold mb-4">Inventory & UI</h3>
                    <ul className="space-y-4">
                      <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white border border-white/5">TAB</span> <span className="text-sm text-neutral-300">Unified Menu (Quests / Skills / Inv)</span></li>
                      <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white border border-white/5">Q</span> <span className="text-sm text-neutral-300">Drop Item (Ctrl+Q for full stack)</span></li>
                      <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white border border-white/5">J / L</span> <span className="text-sm text-neutral-300">Quest Log</span></li>
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