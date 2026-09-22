import React, { useState } from 'react';
import { 
  User, Package, Hammer, BookOpen, Sparkles, Settings, 
  X, Volume2, VolumeX, LogOut, ArrowRight, Check, 
  Trash2, Shield, Swords, Heart, Zap, Award, Search, Plus, Wrench, GripVertical, Lock, Keyboard,
  Layers, Flame, Star, Compass, LayoutTemplate, Users, Crown, CheckCircle2, UserPlus, HelpCircle, Crosshair
} from 'lucide-react';
import { BlockType, BlockNames, BlockColors } from '../lib/constants';
import { RECIPES } from '../lib/crafting';
import { 
  abilitiesForClass, 
  findAbilityOnBars, 
  isAbilityUnlocked, 
  keyForAbility, 
  bindAbilityKey, 
  unbindAbility, 
  isBindableKey, 
  elementalMagicAbilities, 
  isElementalAbility 
} from '../lib/abilities';
import { getTalentTreeForClass, getTalentRank, hasCapstone, getSelectedSpec } from '../lib/talents';
import { getArmorSetInfo, ARMOR_SETS } from '../lib/armorSets';
import { Sounds, AudioChannels } from '../lib/audio';
import { loadKeybinds, saveKeybinds, resetKeybinds, DEFAULT_KEYBINDS, KEYBIND_LABELS, KeybindMap } from '../lib/keybinds';
import { getItemMetadata, RARITY_STYLES, ItemTooltip } from './ItemTooltip';
import { EnchantingStationView } from './EnchantingStationView';
import { EnchantmentPrefix, GemType, CursedAffix } from '../lib/enchanting';

export type UnifiedMenuTab = 'character' | 'inventory' | 'crafting' | 'enchanting' | 'quests' | 'skills' | 'social' | 'settings';

interface UnifiedMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: UnifiedMenuTab;
  onTabChange: (tab: UnifiedMenuTab) => void;
  hotbar: any[];
  backpack: any[];
  leftActionBar?: any[];
  rightActionBar?: any[];
  showLeftActionBar?: boolean;
  setShowLeftActionBar?: (v: boolean) => void;
  showRightActionBar?: boolean;
  setShowRightActionBar?: (v: boolean) => void;
  equipment: any[];
  craftingGrid: any[];
  craftingResult: { result: BlockType; count: number } | null;
  cursorItem?: any;
  onSlotClick: (type: any, index: number, isRightClick?: boolean, isShiftClick?: boolean) => void;
  /** `index` is a slot position, or the ability id when `type` is 'ability' (skill-tree card). */
  onSlotHover?: (slot: any, e: React.MouseEvent, type?: string, index?: number | string) => void;
  onSlotLeave?: () => void;
  /** Skill tree → action bars: "Add to Bar" button and drag-and-drop. */
  onAddAbilityToBar?: (abilityId: string) => void;
  onAbilityDragStart?: (e: React.DragEvent, abilityId: string) => void;
  onClearCrafting: () => void;
  onQuickSort: () => void;
  onQuickStack: () => void;
  onTriggerHUDEdit?: () => void;
  onApplyEnchant?: (
    slotSource: 'hotbar' | 'backpack',
    slotIndex: number,
    prefix: EnchantmentPrefix,
    newLevel: number,
    cost: { gold: number; materials: { type: BlockType; count: number }[] }
  ) => void;
  onApplyGem?: (
    slotSource: 'hotbar' | 'backpack',
    slotIndex: number,
    socketIndex: 1 | 2,
    gemType: GemType
  ) => void;
  onApplyCurse?: (
    slotSource: 'hotbar' | 'backpack',
    slotIndex: number,
    curse: CursedAffix,
    cost: { gold: number; materials: { type: BlockType; count: number }[] }
  ) => void;
  onDismantle?: (
    slotSource: 'hotbar' | 'backpack',
    slotIndex: number,
    yields: { type: BlockType; count: number }[]
  ) => void;
  onTossItem?: (item: any) => void;
  renderBlockIcon: (slot: any) => React.ReactNode;
  player: {
    nickname: string;
    skin: string;
    level: number;
    xp: number;
    health: number;
    maxHealth?: number;
    mana: number;
    maxMana?: number;
    stamina: number;
    maxStamina: number;
    kills?: Record<string, number>;
    statPoints?: number;
    skillPoints?: number;
    skills?: { strength?: number; dexterity?: number; intelligence?: number };
    abilities?: Record<string, number>;
    onAllocateSkill?: (stat: 'strength' | 'dexterity' | 'intelligence') => void;
    onAllocateAbility?: (ability: string) => void;
  };
  quests: any[];
  keybinds: Record<string, string>;
  setKeybinds: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  volume: number;
  setVolume: (v: number) => void;
  isMuted: boolean;
  setIsMuted: (v: boolean) => void;
  onLeaveWorld: () => void;
  playerClass?: string;
  selectedSlotIndex?: number;
  onSelectHotbarSlot?: (idx: number) => void;
  party?: any;
  nearbyPlayers?: any[];
  onInvitePlayer?: (id: string) => void;
  onInspectPlayer?: (player: any) => void;
  onLeaveParty?: () => void;
  onStartReadyCheck?: () => void;
  onOpenInstructions?: () => void;
}

export const UnifiedMenu: React.FC<UnifiedMenuProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  hotbar,
  backpack,
  leftActionBar = [],
  rightActionBar = [],
  showLeftActionBar = false,
  setShowLeftActionBar = (_v: boolean) => {},
  showRightActionBar = false,
  setShowRightActionBar = (_v: boolean) => {},
  equipment,
  craftingGrid,
  craftingResult,
  cursorItem,
  onSlotClick,
  onSlotHover,
  onSlotLeave,
  onAddAbilityToBar,
  onAbilityDragStart,
  onClearCrafting,
  onQuickSort,
  onQuickStack,
  onTriggerHUDEdit,
  onApplyEnchant,
  onApplyGem,
  onApplyCurse,
  onDismantle,
  onTossItem,
  renderBlockIcon,
  player,
  quests,
  keybinds,
  setKeybinds,
  volume,
  setVolume,
  isMuted,
  setIsMuted,
  onLeaveWorld,
  playerClass = 'warrior',
  selectedSlotIndex = 0,
  onSelectHotbarSlot = () => {},
  party,
  nearbyPlayers = [],
  onInvitePlayer,
  onInspectPlayer,
  onLeaveParty,
  onStartReadyCheck,
  onOpenInstructions
}) => {
  const [recipeFilter, setRecipeFilter] = useState('');
  const [recipeCategory, setRecipeCategory] = useState<'all' | 'weapons' | 'armor' | 'tools' | 'resources'>('all');
  const [questFilter, setQuestFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [hoveredTooltip, setHoveredTooltip] = useState<{ slot: any; x: number; y: number } | null>(null);
  const [selectedSpecId, setSelectedSpecId] = useState<string | null>(null);
  const [socialInviteSearch, setSocialInviteSearch] = useState('');

  // Audio channels state
  const [audioVols, setAudioVols] = useState(() => AudioChannels.getVolumes());

  // Custom keybinds state
  const [activeKeybinds, setActiveKeybinds] = useState<KeybindMap>(() => loadKeybinds());
  const [listeningKeybindAction, setListeningKeybindAction] = useState<keyof KeybindMap | null>(null);

  // Inventory search & category filter state
  const [invSearch, setInvSearch] = useState('');
  const [invCategory, setInvCategory] = useState<'all' | 'weapons' | 'armor' | 'materials' | 'consumables'>('all');

  // Crafting filter mode state
  const [craftFilterMode, setCraftFilterMode] = useState<'all' | 'craftable'>('all');

  // Listen for key remapping input
  React.useEffect(() => {
    if (!listeningKeybindAction) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setListeningKeybindAction(null);
        return;
      }

      const newKey = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const updated = {
        ...activeKeybinds,
        [listeningKeybindAction]: newKey
      };
      setActiveKeybinds(updated);
      saveKeybinds(updated);
      setListeningKeybindAction(null);
      Sounds.slotClick();
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [listeningKeybindAction, activeKeybinds]);

  // Ability quick keybind state
  const [bindingAbilityId, setBindingAbilityId] = useState<string | null>(null);

  // Listen for ability keybind input
  React.useEffect(() => {
    if (!bindingAbilityId) return;

    const handleAbilityKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setBindingAbilityId(null);
        return;
      }

      if (isBindableKey(e.key)) {
        setKeybinds(prev => bindAbilityKey(prev, e.key, bindingAbilityId));
        Sounds.slotClick();
        setBindingAbilityId(null);
      }
    };

    window.addEventListener('keydown', handleAbilityKeyDown, true);
    return () => window.removeEventListener('keydown', handleAbilityKeyDown, true);
  }, [bindingAbilityId, setKeybinds]);

  if (!isOpen) return null;

  // Safe fallbacks for player stats & abilities to prevent any runtime crashes
  const safeSkills = player.skills || { strength: 0, dexterity: 0, intelligence: 0 };
  const safeAbilities = player.abilities || { slash: 0, fireball: 0, heal: 0, double_jump: 0 };
  const safeStatPoints = player.statPoints ?? 0;
  const safeSkillPoints = player.skillPoints ?? 0;

  // Compute player combat stats
  const helmetType = equipment[0]?.type || null;
  const chestplateType = equipment[1]?.type || null;
  const helmDefense = helmetType ? (getItemMetadata(helmetType).defense || 0) : 0;
  const chestDefense = chestplateType ? (getItemMetadata(chestplateType).defense || 0) : 0;
  const totalDefense = helmDefense + chestDefense;

  const currentWeapon = hotbar[selectedSlotIndex]?.type || null;
  const hasStaff = currentWeapon === BlockType.WizardStaff ||
    equipment?.some((eq: any) => eq && (eq.type === BlockType.WizardStaff || eq === BlockType.WizardStaff)) ||
    hotbar?.some((h: any) => h && (h.type === BlockType.WizardStaff || h === BlockType.WizardStaff)) ||
    backpack?.some((b: any) => b && (b.type === BlockType.WizardStaff || b === BlockType.WizardStaff));
  const baseWeaponDmg = currentWeapon ? (getItemMetadata(currentWeapon).attack || 1) : 1;
  const totalAttackPower = baseWeaponDmg + (safeSkills.strength || 0) * 2;
  const totalKills = Object.values(player.kills || {}).reduce((a: number, b: any) => a + Number(b || 0), 0);

  const calculatedMaxHp = player.maxHealth || (20 + (safeSkills.strength || 0) * 10);
  const calculatedMaxMana = player.maxMana || (100 + (safeSkills.intelligence || 0) * 20);

  const partyMembersList: any[] = Array.isArray(party) 
    ? party 
    : (party?.members || [{ id: 'self', name: player.nickname || 'Adventurer', hp: player.health, maxHp: calculatedMaxHp, isLeader: true, playerClass }]);

  // Tab configurations
  const TABS: { id: UnifiedMenuTab; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    { id: 'character', label: 'Character', icon: <User size={18} /> },
    { id: 'inventory', label: 'Inventory & Bag', icon: <Package size={18} /> },
    { id: 'crafting', label: 'Crafting', icon: <Hammer size={18} /> },
    { id: 'enchanting', label: 'Mystic Anvil', icon: <Sparkles size={18} /> },
    { 
      id: 'quests', 
      label: 'Quest Log', 
      icon: <BookOpen size={18} />, 
      badge: quests.filter(q => !q.completed).length 
    },
    { 
      id: 'skills', 
      label: 'Skill Tree', 
      icon: <Sparkles size={18} />, 
      badge: safeSkillPoints > 0 ? safeSkillPoints : undefined 
    },
    { 
      id: 'social', 
      label: 'Party & Social', 
      icon: <Users size={18} />, 
      badge: partyMembersList.length > 1 ? partyMembersList.length : undefined 
    },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  // Helper for rendering an inventory slot with hover, click, and audio cues
  const renderSlot = (
    type: string, 
    index: number, 
    slot: any, 
    extraClasses: string = '', 
    showKeyNumber?: number,
    isSelected?: boolean
  ) => {
    const isEquipped = type === 'equipment';
    const rarity = slot?.type ? getItemMetadata(slot.type).rarity : 'common';
    const rarityConfig = RARITY_STYLES[rarity];

    const matchesFilter = (() => {
      if (!slot?.type) return true;
      const meta = getItemMetadata(slot.type);
      const nameMatch = !invSearch || meta.name.toLowerCase().includes(invSearch.toLowerCase());
      if (!nameMatch) return false;
      if (invCategory === 'all') return true;
      if (invCategory === 'weapons') return meta.category === 'Weapon' || meta.attack !== undefined;
      if (invCategory === 'armor') return meta.category === 'Armor' || meta.defense !== undefined;
      if (invCategory === 'materials') return meta.category === 'Resource' || meta.category === 'Tool';
      if (invCategory === 'consumables') return meta.category === 'Consumable' || meta.category === 'Magical';
      return true;
    })();

    const isDimmed = slot && !matchesFilter;
    const isFilteredMatch = slot && matchesFilter && (Boolean(invSearch) || invCategory !== 'all');

    return (
      <button
        key={`${type}-${index}`}
        id={`slot-${type}-${index}`}
        aria-label={`${type} slot ${index + 1}${slot ? "" : " (empty)"}`}
        onClick={(e) => {
          if (isEquipped) {
            Sounds.equipGear();
          } else if (type === 'craftingResult') {
            Sounds.craftSuccess();
          } else {
            Sounds.slotClick();
          }
          onSlotClick(type, index, false, e.shiftKey);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          Sounds.slotClick();
          onSlotClick(type, index, true, e.shiftKey);
        }}
        onMouseEnter={(e) => {
          Sounds.slotHover();
          if (slot) {
            setHoveredTooltip({ slot, x: e.clientX, y: e.clientY });
          }
          if (onSlotHover) onSlotHover(slot, e, type, index);
        }}
        onMouseMove={(e) => {
          if (slot) {
            setHoveredTooltip({ slot, x: e.clientX, y: e.clientY });
          }
        }}
        onMouseLeave={() => {
          setHoveredTooltip(null);
          if (onSlotLeave) onSlotLeave();
        }}
        className={`w-12 h-12 rounded-lg border transition-all duration-150 relative flex items-center justify-center select-none active:scale-95 ${
          isSelected 
            ? 'border-amber-400 bg-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.35)] ring-1 ring-amber-400' 
            : slot 
            ? `${rarityConfig.border} bg-neutral-900/70 hover:border-amber-400/70 hover:bg-neutral-800/80 shadow-sm ${isDimmed ? 'opacity-25 grayscale' : ''} ${isFilteredMatch ? 'ring-2 ring-amber-400/80 shadow-[0_0_10px_rgba(245,158,11,0.4)]' : ''}` 
            : 'border-neutral-800 bg-neutral-950/50 hover:border-neutral-700 hover:bg-neutral-900/40'
        } ${extraClasses}`}
      >
        {showKeyNumber !== undefined && (
          <span className="absolute top-0.5 left-1 text-[9px] font-mono font-bold text-neutral-500 pointer-events-none">
            {showKeyNumber}
          </span>
        )}
        <div className="w-9 h-9 flex items-center justify-center pointer-events-none">
          {renderBlockIcon(slot)}
        </div>
      </button>
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[75] p-4 select-none"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Dark Fantasy Glassmorphism Frame */}
      <div className="bg-neutral-950/90 backdrop-blur-2xl border border-amber-500/30 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.1)] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-neutral-200">
        
        {/* Navigation Header */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-amber-500/20 bg-gradient-to-r from-neutral-950 via-neutral-900/95 to-neutral-950 shrink-0 select-none z-20">
          <div className="flex-1 min-w-0 overflow-x-auto flex items-center gap-1.5 py-0.5 no-scrollbar">
            {TABS.map((t, idx) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  id={`tab-btn-${t.id}`}
                  onClick={() => {
                    Sounds.slotClick();
                    onTabChange(t.id);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 tracking-wide whitespace-nowrap shrink-0 relative ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span className={isActive ? 'text-amber-400' : 'text-neutral-500'}>
                    {t.icon}
                  </span>
                  <span>{t.label}</span>
                  {t.badge !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isActive ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-800 text-neutral-300'
                    }`}>
                      {t.badge}
                    </span>
                  )}
                  <span className="hidden lg:inline text-[9px] text-neutral-600 font-mono ml-0.5">
                    [{idx + 1}]
                  </span>
                </button>
              );
            })}
          </div>

          <div className="shrink-0 flex items-center gap-2 pl-3 border-l border-neutral-800/80 bg-neutral-950/80 rounded-lg py-1 px-2.5">
            <span className="text-[10px] text-neutral-400 hidden sm:inline font-mono tracking-tight bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
              <span className="text-amber-400 font-bold">Tab</span> Cycle • <span className="text-amber-400 font-bold">Esc</span> Close
            </span>
            <button
              id="unified-menu-close-btn"
              onClick={() => {
                Sounds.slotClick();
                onClose();
              }}
              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close Menu (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          
          {/* TAB 1: CHARACTER & EQUIPMENT */}
          {activeTab === 'character' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left: Paperdoll & Avatar Inspect */}
              <div className="md:col-span-5 bg-neutral-900/60 rounded-xl border border-amber-500/20 p-5 flex flex-col items-center gap-4 relative overflow-hidden shadow-inner">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex flex-col items-center">
                  <h3 className="text-lg font-bold text-white tracking-wide">
                    {player.nickname || 'Adventurer'}
                  </h3>
                  <span className="text-xs text-amber-400 font-mono">
                    Level {player.level} • {playerClass.toUpperCase()}
                  </span>
                </div>

                {/* Paperdoll Canvas Preview */}
                <div className="relative w-36 h-44 bg-neutral-950/80 rounded-xl border border-neutral-800 flex items-center justify-center shadow-inner">
                  {/* Decorative Pedestal */}
                  <div className="absolute bottom-3 w-24 h-4 bg-amber-500/20 rounded-full blur-sm" />
                  
                  {/* Player Sprite Preview */}
                  <div className="relative flex flex-col items-center">
                    {/* Head with skin & helmet */}
                    <div 
                      className="w-10 h-10 rounded-sm border border-black/40 relative shadow-md flex items-center justify-center"
                      style={{ backgroundColor: player.skin || '#F5D0A9' }}
                    >
                      {equipment[0] && (
                        <div className="absolute inset-0 flex items-center justify-center p-0.5">
                          {renderBlockIcon(equipment[0])}
                        </div>
                      )}
                    </div>
                    {/* Torso with chestplate */}
                    <div 
                      className="w-12 h-14 rounded-sm border border-black/40 mt-0.5 relative flex items-center justify-center"
                      style={{ backgroundColor: '#2196F3' }}
                    >
                      {equipment[1] && (
                        <div className="absolute inset-0 flex items-center justify-center p-0.5">
                          {renderBlockIcon(equipment[1])}
                        </div>
                      )}
                    </div>
                    {/* Legs */}
                    <div className="flex gap-1 mt-0.5">
                      <div className="w-5 h-8 bg-neutral-700 rounded-b-sm border border-black/40" />
                      <div className="w-5 h-8 bg-neutral-700 rounded-b-sm border border-black/40" />
                    </div>
                  </div>
                </div>

                {/* Equipment Slots */}
                <div className="flex items-center gap-4 bg-neutral-950/70 px-4 py-3 rounded-xl border border-neutral-800">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                      Helmet
                    </span>
                    {renderSlot('equipment', 0, equipment[0], 'w-14 h-14')}
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                      Chestplate
                    </span>
                    {renderSlot('equipment', 1, equipment[1], 'w-14 h-14')}
                  </div>
                </div>
              </div>

              {/* Right: Detailed RPG Attributes & Stats */}
              <div className="md:col-span-7 flex flex-col gap-4">
                
                {/* Vitals Summary */}
                <div className="bg-neutral-900/60 rounded-xl border border-amber-500/20 p-4 flex flex-col gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Sparkles size={14} /> Vitals & Progression
                  </h4>

                  {/* Health Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="flex items-center gap-1 text-rose-400 font-bold">
                        <Heart size={13} fill="currentColor" /> Health
                      </span>
                      <span className="text-neutral-300">{Math.round(player.health)} / {calculatedMaxHp}</span>
                    </div>
                    <div className="w-full h-2.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                      <div 
                        className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.max(0, Math.min(100, (player.health / calculatedMaxHp) * 100))}%` }} 
                      />
                    </div>
                  </div>

                  {/* Stamina Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <Zap size={13} fill="currentColor" /> Stamina
                      </span>
                      <span className="text-neutral-300">{Math.round(player.stamina)} / {player.maxStamina}</span>
                    </div>
                    <div className="w-full h-2.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.max(0, Math.min(100, (player.stamina / player.maxStamina) * 100))}%` }} 
                      />
                    </div>
                  </div>

                  {/* Mana Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="flex items-center gap-1 text-cyan-400 font-bold">
                        <Sparkles size={13} /> Arcane Mana
                      </span>
                      <span className="text-neutral-300">{Math.round(player.mana)} / {calculatedMaxMana}</span>
                    </div>
                    <div className="w-full h-2.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.max(0, Math.min(100, (player.mana / calculatedMaxMana) * 100))}%` }} 
                      />
                    </div>
                  </div>

                  {/* Level & XP Bar */}
                  <div className="pt-1 border-t border-white/5">
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="flex items-center gap-1 text-amber-400 font-bold">
                        <Award size={13} /> Level {player.level} Progress
                      </span>
                      <span className="text-neutral-400">{player.xp} / {150 + Math.max(0, player.level - 1) * 75} XP</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-600 to-amber-300 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min(100, (player.xp / (150 + Math.max(0, player.level - 1) * 75)) * 100)}%` }} 
                      />
                    </div>
                  </div>
                </div>

                {/* Combat Ratings */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800 flex flex-col items-center text-center">
                    <Swords size={20} className="text-rose-400 mb-1" />
                    <span className="text-[10px] uppercase font-bold text-neutral-400">Total Attack</span>
                    <span className="text-lg font-bold text-white font-mono mt-0.5">{totalAttackPower}</span>
                  </div>
                  <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800 flex flex-col items-center text-center">
                    <Shield size={20} className="text-sky-400 mb-1" />
                    <span className="text-[10px] uppercase font-bold text-neutral-400">Total Armor</span>
                    <span className="text-lg font-bold text-white font-mono mt-0.5">+{totalDefense}</span>
                  </div>
                  <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800 flex flex-col items-center text-center">
                    <Award size={20} className="text-amber-400 mb-1" />
                    <span className="text-[10px] uppercase font-bold text-neutral-400">Monsters Slain</span>
                    <span className="text-lg font-bold text-white font-mono mt-0.5">{totalKills}</span>
                  </div>
                </div>

                {/* Quick Link to Skills */}
                <div className="bg-amber-950/30 border border-amber-500/30 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-amber-200">Stat Points Available</p>
                    <p className="text-[11px] text-neutral-400">Allocate points to enhance Strength, Dexterity, or Intelligence.</p>
                  </div>
                  <button
                    onClick={() => onTabChange('skills')}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-md"
                  >
                    View Skills <ArrowRight size={13} />
                  </button>
                </div>

              </div>

              {/* Tiered Armor Set Bonuses Panel */}
              <div className="md:col-span-12 min-w-0 bg-neutral-900/60 p-5 rounded-xl border border-cyan-500/30 flex flex-col gap-3 mt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                    <Layers size={16} className="text-cyan-400" /> Tiered Armor Set Bonuses
                  </h4>
                  <button
                    onClick={() => onTabChange('skills')}
                    className="px-3 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                  >
                    Manage Skills & Talents <ArrowRight size={12} />
                  </button>
                </div>
                {(() => {
                  const activeSets = getArmorSetInfo(equipment);
                  if (activeSets.length === 0) {
                    return (
                      <p className="text-xs text-neutral-400 italic">
                        Equip matching armor sets (e.g., Iron Helmet + Chestplate) to activate powerful tier set bonuses and defensive perks.
                      </p>
                    );
                  }
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                      {activeSets.map(s => (
                        <div key={s.set.id} className="p-3 bg-neutral-950/80 rounded-lg border border-cyan-500/40 flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs flex items-center gap-1.5">
                              <Shield size={13} className="text-cyan-400" /> {s.set.name}
                            </span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${s.isComplete ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' : 'bg-neutral-800 text-neutral-400'}`}>
                              {s.equippedCount} / {s.totalPieces} Pieces
                            </span>
                          </div>
                          {s.activeBonuses.map(b => (
                            <div key={b.id} className="text-[11px] text-emerald-300 font-medium">
                              ★ {b.name}: {b.perks.join(', ')}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB 2: INVENTORY & BAG */}
          {activeTab === 'inventory' && (
            <div className="flex flex-col gap-6">
              
              {/* Action Tools / Quick Management Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/60 px-4 py-3 rounded-xl border border-amber-500/20">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      Sounds.slotClick();
                      onQuickSort();
                    }}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-bold rounded-lg border border-neutral-700 transition-colors flex items-center gap-1.5"
                  >
                    <Wrench size={13} /> Sort Inventory
                  </button>
                  <button
                    onClick={() => {
                      Sounds.slotClick();
                      onQuickStack();
                    }}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-bold rounded-lg border border-neutral-700 transition-colors flex items-center gap-1.5"
                  >
                    <Package size={13} /> Quick Stack
                  </button>
                  {onTriggerHUDEdit && (
                    <button
                      onClick={() => {
                        Sounds.slotClick();
                        onTriggerHUDEdit();
                      }}
                      className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold rounded-lg border border-amber-500/40 transition-colors flex items-center gap-1.5 shadow-sm"
                      title="Reposition HUD elements & rotate action bars 90 degrees"
                    >
                      <LayoutTemplate size={13} /> Edit HUD & Bars
                    </button>
                  )}
                </div>

                {/* Action Bar Toggles */}
                <div className="flex items-center gap-3 text-xs text-neutral-400">
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                    <input 
                      type="checkbox" 
                      checked={showLeftActionBar} 
                      onChange={(e) => setShowLeftActionBar(e.target.checked)} 
                      className="accent-amber-500 rounded"
                    />
                    <span>Left Action Bar</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                    <input 
                      type="checkbox" 
                      checked={showRightActionBar} 
                      onChange={(e) => setShowRightActionBar(e.target.checked)} 
                      className="accent-amber-500 rounded"
                    />
                    <span>Right Action Bar</span>
                  </label>
                </div>
              </div>

              {/* Search & Category Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-900/60 p-3 rounded-xl border border-amber-500/20">
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'all', label: 'All Items' },
                    { id: 'weapons', label: 'Weapons' },
                    { id: 'armor', label: 'Armor' },
                    { id: 'materials', label: 'Materials' },
                    { id: 'consumables', label: 'Consumables' },
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        Sounds.slotClick();
                        setInvCategory(cat.id as any);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                        invCategory === cat.id
                          ? 'bg-amber-500 text-neutral-950 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                          : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Search Box */}
                <div className="relative w-full sm:w-56 shrink-0">
                  <Search size={14} className="absolute left-2.5 top-2.5 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Search backpack..."
                    value={invSearch}
                    onChange={(e) => setInvSearch(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                  {invSearch && (
                    <button
                      onClick={() => setInvSearch('')}
                      className="absolute right-2 top-2 text-neutral-400 hover:text-white"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Backpack Grid (27 slots) */}
              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-amber-400">
                  Backpack Storage (27 Slots)
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-9 gap-2 bg-neutral-900/40 p-4 rounded-xl border border-neutral-800/80">
                  {backpack.map((slot, i) => renderSlot('backpack', i, slot))}
                </div>
              </div>

              {/* Hotbar (10 slots) */}
              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-amber-400">
                  Primary Hotbar (Keys 1-9, 0) — Empty slots: mine / punch
                </span>
                <div className="flex flex-wrap gap-2 bg-neutral-900/40 p-4 rounded-xl border border-neutral-800/80">
                  {hotbar.map((slot, i) => 
                    renderSlot('hotbar', i, slot, '', (i + 1) % 10, i === selectedSlotIndex)
                  )}
                </div>
              </div>

              <p className="text-xs text-neutral-400">Click to pick up or swap an item. Right-click to split a stack. Empty hotbar slots let you punch and mine soft blocks.</p>
              {[
                { type: 'leftActionBar', label: 'Left Action Bar', slots: leftActionBar, visible: showLeftActionBar },
                { type: 'rightActionBar', label: 'Right Action Bar', slots: rightActionBar, visible: showRightActionBar },
              ].filter(bar => bar.visible).map(bar => (
                <div key={bar.type} className="flex flex-col gap-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-amber-400">{bar.label}</span>
                  <div className="flex flex-wrap gap-2 bg-neutral-900/40 p-4 rounded-xl border border-neutral-800/80">
                    {bar.slots.map((slot, i) => renderSlot(bar.type, i, slot))}
                  </div>
                </div>
              ))}

              {/* Toss / Drop Item Zone */}
              <div 
                onMouseDown={() => {
                  if (cursorItem) {
                    onTossItem(cursorItem);
                  }
                }}
                className="border-2 border-dashed border-rose-500/30 hover:border-rose-500/70 bg-rose-950/20 hover:bg-rose-950/40 p-4 rounded-xl flex items-center justify-center gap-2 text-rose-400 transition-colors cursor-pointer group"
                title="Click with held item to drop into world"
              >
                <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold tracking-wide">
                  {cursorItem ? 'Click here to drop held item into the world' : 'Drop Zone (Click with item or press Q to toss)'}
                </span>
              </div>

            </div>
          )}

          {/* TAB 3: CRAFTING GRID & RECIPES */}
          {activeTab === 'crafting' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left: 3x3 Crafting Table */}
              <div className="md:col-span-6 bg-neutral-900/60 rounded-xl border border-amber-500/20 p-5 flex flex-col items-center gap-5">
                <div className="flex justify-between items-center w-full">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Hammer size={16} /> 3x3 Crafting Matrix
                  </h4>
                  <button
                    onClick={() => {
                      Sounds.slotClick();
                      onClearCrafting();
                    }}
                    className="text-[11px] text-neutral-400 hover:text-white px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 transition-colors"
                  >
                    Clear Grid
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  {/* 3x3 Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-neutral-950/80 p-3 rounded-xl border border-neutral-800">
                    {craftingGrid.map((slot, i) => renderSlot('crafting', i, slot, 'w-14 h-14'))}
                  </div>

                  <ArrowRight size={24} className="text-amber-500/60" />

                  {/* Result Slot */}
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-neutral-400">Result</span>
                    <div className="p-1 rounded-xl bg-amber-500/10 border border-amber-500/40">
                      {renderSlot(
                        'craftingResult', 
                        0, 
                        craftingResult ? { type: craftingResult.result, count: craftingResult.count } : null, 
                        'w-16 h-16'
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-400 text-center italic">
                  Arrange items according to recipes. Click result slot to craft item.
                </p>

                {/* Hotbar Quick Access in Crafting */}
                <div className="w-full pt-4 border-t border-white/5">
                  <span className="text-[11px] font-bold text-neutral-400 block mb-2">Quick Hotbar Access:</span>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                    {hotbar.map((slot, i) => renderSlot('hotbar', i, slot, 'w-10 h-10', (i + 1) % 10))}
                  </div>
                </div>
              </div>

              {/* Right: Recipe Book Guide */}
              <div className="md:col-span-6 bg-neutral-900/60 rounded-xl border border-amber-500/20 p-5 flex flex-col gap-4">
                {(() => {
                  // Compute player's held materials
                  const playerItemCounts: Record<number, number> = {};
                  [...hotbar, ...backpack].forEach(slot => {
                    if (slot && slot.type) {
                      playerItemCounts[slot.type] = (playerItemCounts[slot.type] || 0) + (slot.count || 1);
                    }
                  });

                  const checkCanCraft = (pattern: (BlockType | null)[]) => {
                    const needed: Record<number, number> = {};
                    pattern.forEach(p => {
                      if (p) needed[p] = (needed[p] || 0) + 1;
                    });
                    return Object.entries(needed).every(([type, need]) => (playerItemCounts[Number(type)] || 0) >= need);
                  };

                  const totalCraftable = RECIPES.filter(r => checkCanCraft(r.pattern)).length;

                  return (
                    <>
                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                            <BookOpen size={16} /> Recipe Catalog
                          </h4>
                          <div className="relative w-40">
                            <Search size={14} className="absolute left-2.5 top-2.5 text-neutral-500" />
                            <input 
                              type="text"
                              placeholder="Search recipes..."
                              value={recipeFilter}
                              onChange={(e) => setRecipeFilter(e.target.value)}
                              className="w-full pl-8 pr-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>

                        {/* Discovery Filter Mode */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              Sounds.slotClick();
                              setCraftFilterMode('all');
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              craftFilterMode === 'all'
                                ? 'bg-neutral-700 text-white'
                                : 'bg-neutral-900 text-neutral-400 hover:text-white'
                            }`}
                          >
                            All Recipes ({RECIPES.length})
                          </button>
                          <button
                            onClick={() => {
                              Sounds.slotClick();
                              setCraftFilterMode('craftable');
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                              craftFilterMode === 'craftable'
                                ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                                : 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/60'
                            }`}
                          >
                            <Sparkles size={12} className="text-emerald-400" />
                            <span>Craftable Now ({totalCraftable})</span>
                          </button>
                        </div>
                      </div>

                      {/* Recipe List */}
                      <div className="flex-1 overflow-y-auto max-h-[380px] custom-scrollbar flex flex-col gap-2 pr-1">
                        {RECIPES.filter(r => {
                          const name = BlockNames[r.result]?.toLowerCase() || '';
                          const matchesName = name.includes(recipeFilter.toLowerCase());
                          if (!matchesName) return false;
                          if (craftFilterMode === 'craftable') {
                            return checkCanCraft(r.pattern);
                          }
                          return true;
                        }).map((r, idx) => {
                          const resultName = BlockNames[r.result] || 'Item';
                          const rarity = getItemMetadata(r.result).rarity;
                          const rConfig = RARITY_STYLES[rarity];
                          const canCraft = checkCanCraft(r.pattern);

                          return (
                            <div 
                              key={`recipe-${idx}`}
                              className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                                canCraft
                                  ? 'bg-neutral-950/90 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                  : 'bg-neutral-950/70 border-neutral-800/80 hover:border-amber-500/30'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg border ${rConfig.border} bg-neutral-900 flex items-center justify-center p-1`}>
                                  {renderBlockIcon(r.result)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h5 className={`text-xs font-bold ${rConfig.text}`}>
                                      {resultName} {r.count > 1 && `(x${r.count})`}
                                    </h5>
                                    {canCraft && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300 flex items-center gap-1 shadow-sm">
                                        <Check size={9} /> Craftable Now
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-neutral-500">
                                    3x3 Shaped Recipe
                                  </span>
                                </div>
                              </div>

                              {/* Mini 3x3 pattern display */}
                              <div className="grid grid-cols-3 gap-0.5 bg-neutral-900 p-1 rounded border border-neutral-800">
                                {r.pattern.map((p, pIdx) => (
                                  <div 
                                    key={pIdx} 
                                    className="w-3.5 h-3.5 rounded-[1px] flex items-center justify-center"
                                    style={{ backgroundColor: p ? (BlockColors[p] || '#888') : 'rgba(255,255,255,0.05)' }}
                                    title={p ? BlockNames[p] : 'Empty'}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB: MYSTIC ANVIL & ENCHANTING */}
          {activeTab === 'enchanting' && (
            <EnchantingStationView
              hotbar={hotbar}
              backpack={backpack}
              renderBlockIcon={renderBlockIcon}
              onApplyEnchant={onApplyEnchant || (() => {})}
              onApplyGem={onApplyGem || (() => {})}
              onApplyCurse={onApplyCurse}
              onDismantle={onDismantle || (() => {})}
            />
          )}

          {/* TAB 4: QUEST LOG */}
          {activeTab === 'quests' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <BookOpen size={16} /> World Chronicle & Quests
                </h3>
                <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800 text-xs">
                  <button
                    onClick={() => setQuestFilter('all')}
                    className={`px-3 py-1 rounded-md font-bold transition-colors ${questFilter === 'all' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'}`}
                  >
                    All ({quests.length})
                  </button>
                  <button
                    onClick={() => setQuestFilter('active')}
                    className={`px-3 py-1 rounded-md font-bold transition-colors ${questFilter === 'active' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'}`}
                  >
                    Active ({quests.filter(q => !q.completed).length})
                  </button>
                  <button
                    onClick={() => setQuestFilter('completed')}
                    className={`px-3 py-1 rounded-md font-bold transition-colors ${questFilter === 'completed' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'}`}
                  >
                    Completed ({quests.filter(q => q.completed).length})
                  </button>
                </div>
              </div>

              {/* Quest Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quests.filter(q => {
                  if (questFilter === 'active') return !q.completed;
                  if (questFilter === 'completed') return q.completed;
                  return true;
                }).map(q => {
                  const progressPct = Math.min(100, Math.round((q.current / q.goal) * 100));

                  return (
                    <div 
                      key={q.id}
                      className={`p-4 rounded-xl border transition-all duration-150 flex flex-col justify-between gap-3 ${
                        q.completed 
                          ? 'bg-emerald-950/20 border-emerald-500/30' 
                          : 'bg-neutral-900/60 border-neutral-800 hover:border-amber-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className={`text-sm font-bold ${q.completed ? 'text-emerald-300' : 'text-white'}`}>
                            {q.title}
                          </h4>
                          <p className="text-xs text-neutral-400 mt-1">
                            {q.description}
                          </p>
                        </div>
                        {q.completed ? (
                          <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            <Check size={16} />
                          </span>
                        ) : (
                          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                            {q.current} / {q.goal}
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                          <div 
                            className={`h-full transition-all duration-300 ${q.completed ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-neutral-500 mt-1">
                          <span>{q.completed ? 'Reward Claimed' : 'In Progress'}</span>
                          <span>{progressPct}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: SKILL TREE & STAT POINTS */}
          {activeTab === 'skills' && (
            <div className="flex flex-col gap-6">
              
              {/* Stat & Skill Points Allocation Header */}
              <div className="bg-gradient-to-r from-amber-950/50 via-neutral-900/80 to-blue-950/50 p-4 rounded-xl border border-amber-500/40 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-400" /> Unified Skill & Progression Tree
                  </h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Leveling up grants Stat Points for core attributes and Skill Points for combat abilities and talents.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-neutral-950/80 px-3 py-1.5 rounded-lg border border-amber-500/30 flex items-center gap-1.5 text-xs">
                    <span className="text-neutral-400">Stat Points:</span>
                    <span className="font-mono font-bold text-amber-300 text-sm">{safeStatPoints}</span>
                  </div>
                  <div className="bg-neutral-950/80 px-3 py-1.5 rounded-lg border border-blue-500/30 flex items-center gap-1.5 text-xs">
                    <span className="text-neutral-400">Skill Points:</span>
                    <span className="font-mono font-bold text-blue-300 text-sm">{safeSkillPoints}</span>
                  </div>
                </div>
              </div>

              {/* 3 Core Stats Cards */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                  <Award size={14} /> Core Attributes
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Strength */}
                  <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <h5 className="font-bold text-white text-sm flex items-center gap-1.5">
                          <Swords size={16} className="text-rose-400" /> Strength
                        </h5>
                        <span className="text-xs font-mono font-bold bg-neutral-950 px-2 py-0.5 rounded border border-neutral-700 text-white">
                          Lv {safeSkills.strength || 0}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        Authoritatively scales melee weapon strike power (+2 dmg/lvl).
                      </p>
                    </div>
                    <button
                      disabled={safeStatPoints <= 0}
                      onClick={() => {
                        Sounds.slotClick();
                        player.onAllocateSkill?.('strength');
                      }}
                      className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-neutral-700"
                    >
                      <Plus size={14} /> Allocate (1 Point)
                    </button>
                  </div>

                  {/* Dexterity */}
                  <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <h5 className="font-bold text-white text-sm flex items-center gap-1.5">
                          <Zap size={16} className="text-emerald-400" /> Dexterity
                        </h5>
                        <span className="text-xs font-mono font-bold bg-neutral-950 px-2 py-0.5 rounded border border-neutral-700 text-white">
                          Lv {safeSkills.dexterity || 0} / 10
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        Scales archery projectile speed and boosts sprint stamina (+10/lvl).
                      </p>
                    </div>
                    <button
                      disabled={safeStatPoints <= 0 || (safeSkills.dexterity || 0) >= 10}
                      onClick={() => {
                        Sounds.slotClick();
                        player.onAllocateSkill?.('dexterity');
                      }}
                      className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-neutral-700"
                    >
                      <Plus size={14} /> Allocate (1 Point)
                    </button>
                  </div>

                  {/* Intelligence */}
                  <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <h5 className="font-bold text-white text-sm flex items-center gap-1.5">
                          <Sparkles size={16} className="text-cyan-400" /> Intelligence
                        </h5>
                        <span className="text-xs font-mono font-bold bg-neutral-950 px-2 py-0.5 rounded border border-neutral-700 text-white">
                          Lv {safeSkills.intelligence || 0}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        Scales staff spell damage, spell mana efficiency, and max mana pool.
                      </p>
                    </div>
                    <button
                      disabled={safeStatPoints <= 0}
                      onClick={() => {
                        Sounds.slotClick();
                        player.onAllocateSkill?.('intelligence');
                      }}
                      className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-neutral-700"
                    >
                      <Plus size={14} /> Allocate (1 Point)
                    </button>
                  </div>

                </div>
              </div>

              {/* Talent Specializations */}
              {(() => {
                const tree = getTalentTreeForClass(playerClass);
                const currentSpecId = selectedSpecId || getSelectedSpec(safeAbilities, playerClass);
                const activeSpec = tree.specs.find(s => s.id === currentSpecId) || tree.specs[0];

                return (
                  <div className="bg-neutral-900/60 p-5 rounded-xl border border-purple-500/30 flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                          <Star size={16} className="text-purple-400" /> Talent Specializations
                        </h4>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Choose a branching specialization and invest skill points into passive combat perks.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 bg-neutral-950/80 p-1 rounded-xl border border-purple-500/20">
                        {tree.specs.map(s => {
                          const isSelected = s.id === activeSpec.id;
                          return (
                            <button
                              key={s.id}
                              onClick={() => {
                                Sounds.slotClick();
                                setSelectedSpecId(s.id);
                                const specIdx = tree.specs.findIndex(x => x.id === s.id);
                                player.onAllocateAbility?.(`spec_${tree.playerClass}_${specIdx}`);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-purple-600 text-white shadow-lg'
                                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                              }`}
                            >
                              <span>{s.icon}</span> {s.name} <span className="text-[10px] opacity-70">({s.role})</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-3 bg-neutral-950/50 rounded-lg border border-purple-500/20 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{activeSpec.icon}</span> {activeSpec.name} - {activeSpec.role}
                        </span>
                        <p className="text-[11px] text-neutral-400 mt-0.5">{activeSpec.description}</p>
                      </div>
                    </div>

                    {/* Talent Tiers & Capstone Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {activeSpec.tiers.map((tier) => {
                        const rank = getTalentRank(safeAbilities, tier.id);
                        return (
                          <div key={tier.id} className="p-3 bg-neutral-950/70 rounded-xl border border-neutral-800 flex flex-col justify-between gap-2.5">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-white flex items-center gap-1">
                                  <span>{tier.icon}</span> {tier.name}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold bg-neutral-900 border border-neutral-700 text-purple-300">
                                  Rank {rank} / {tier.maxRank}
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-400 leading-relaxed">{tier.description}</p>
                              <span className="text-[10px] text-emerald-400 font-medium block mt-1">
                                {tier.bonusPerRank}
                              </span>
                            </div>
                            <button
                              disabled={safeSkillPoints <= 0 || rank >= tier.maxRank}
                              onClick={() => {
                                Sounds.slotClick();
                                player.onAllocateAbility?.(`talent_${tier.id}`);
                              }}
                              className="w-full py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1 border border-neutral-700"
                            >
                              <Plus size={12} /> {rank >= tier.maxRank ? 'Maxed' : 'Invest (1 SP)'}
                            </button>
                          </div>
                        );
                      })}

                      {/* Capstone Passive */}
                      {(() => {
                        const capstone = activeSpec.capstone;
                        const unlocked = hasCapstone(safeAbilities, capstone.id);
                        return (
                          <div className="p-3 bg-gradient-to-b from-purple-950/40 to-neutral-950/70 rounded-xl border border-purple-500/40 flex flex-col justify-between gap-2.5 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                                  <span>{capstone.icon}</span> {capstone.name}
                                </span>
                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold border ${unlocked ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-neutral-900 text-neutral-500 border-neutral-800'}`}>
                                  {unlocked ? 'ACTIVE' : 'CAPSTONE'}
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-300 leading-relaxed">{capstone.description}</p>
                            </div>
                            <button
                              disabled={safeSkillPoints <= 0 || unlocked}
                              onClick={() => {
                                Sounds.slotClick();
                                player.onAllocateAbility?.(`capstone_${capstone.id}`);
                              }}
                              className="w-full py-1.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1 border border-purple-500/50 shadow-md"
                            >
                              <Sparkles size={12} /> {unlocked ? 'Capstone Mastered' : 'Unlock Capstone (1 SP)'}
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })()}

              {/* Class MMO Abilities — unified with inline rank upgrades, drag onto a bar, or bind */}
              {(() => {
                const renderAbilityCard = (ability: any, themeColor: 'cyan' | 'amber') => {
                  const isUnlocked = isAbilityUnlocked(ability, safeSkills, hasStaff);
                  const boundKey = keyForAbility(keybinds, ability.id);
                  const placement = findAbilityOnBars({ hotbar, leftActionBar, rightActionBar }, ability.id);
                  const placementLabel = placement
                    ? `${placement.bar === 'hotbar' ? 'Hotbar' : placement.bar === 'leftActionBar' ? 'Left bar' : 'Right bar'} ${placement.index + 1}`
                    : null;
                  const abilityRank = safeAbilities[ability.id] || (isUnlocked ? 1 : 0);
                  const isBinding = bindingAbilityId === ability.id;

                  return (
                    <div 
                      key={ability.id}
                      data-ability-id={ability.id}
                      draggable={isUnlocked}
                      onDragStart={(e) => {
                        if (!isUnlocked) { e.preventDefault(); return; }
                        onAbilityDragStart?.(e, ability.id);
                      }}
                      onMouseEnter={(e) => onSlotHover?.(null, e, 'ability', ability.id)}
                      onMouseLeave={() => onSlotLeave?.()}
                      title={isUnlocked ? 'Click "Bind Key" or drag to an action bar' : `Requires ${ability.req} ${ability.class === 'warrior' ? 'Strength' : ability.class === 'archer' ? 'Dexterity' : 'Intelligence'}`}
                      className={`p-3 rounded-xl border flex flex-col justify-between gap-2.5 transition-colors ${
                        isUnlocked 
                          ? themeColor === 'amber'
                            ? 'bg-neutral-950/80 border-amber-500/40 text-neutral-200 shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:border-amber-400/70'
                            : 'bg-neutral-950/80 border-cyan-500/40 text-neutral-200 shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:border-cyan-400/70'
                          : 'bg-neutral-950/40 border-neutral-800/80 text-neutral-500 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 shrink-0 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center">
                            {ability.icon}
                          </div>
                          <div className="min-w-0">
                            <h6 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                              {ability.name}
                              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${themeColor === 'amber' ? 'bg-amber-950 text-amber-300 border border-amber-500/30' : 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'}`}>
                                Rank {abilityRank}
                              </span>
                            </h6>
                            <span className="text-[10px] text-neutral-400">
                              {ability.req > 0 ? `Req ${ability.req}` : 'Starter'} · {ability.cost > 0 ? `${ability.cost} MP` : 'Free'} · {ability.cd}s CD
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!isUnlocked && <Lock size={12} className="text-neutral-500" />}
                          {boundKey && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-amber-500 text-neutral-950 rounded shadow-sm" title={`Bound to ${boundKey.toUpperCase()}`}>
                              {boundKey.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-[11px] text-neutral-400 italic">
                        {ability.desc}
                      </p>

                      <div className="flex flex-col gap-1.5 pt-1 border-t border-white/5">
                        {/* Interactive Keybind Button */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={!isUnlocked}
                            onClick={(e) => {
                              e.stopPropagation();
                              setBindingAbilityId(isBinding ? null : ability.id);
                            }}
                            className={`flex-1 py-1 px-2 rounded-md font-bold text-[10px] transition-all flex items-center justify-center gap-1 border ${
                              isBinding
                                ? 'bg-amber-500 text-neutral-950 border-amber-400 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                                : boundKey
                                ? 'bg-amber-950/60 text-amber-300 border-amber-500/50 hover:bg-amber-900/60'
                                : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed'
                            }`}
                          >
                            <Keyboard size={11} className={isBinding ? 'text-neutral-950' : 'text-amber-400'} />
                            <span>{isBinding ? 'Press Key...' : boundKey ? `Bound: [${boundKey.toUpperCase()}]` : 'Bind Key'}</span>
                          </button>

                          {boundKey && (
                            <button
                              type="button"
                              title="Unbind Key"
                              onClick={(e) => {
                                e.stopPropagation();
                                setKeybinds(prev => unbindAbility(prev, ability.id));
                                Sounds.slotClick();
                              }}
                              className="p-1 rounded-md text-neutral-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-bold ${placementLabel ? 'text-emerald-400' : 'text-neutral-500'}`}>
                            {placementLabel ? `On bar: ${placementLabel}` : 'Not on a bar'}
                          </span>
                          <button
                            type="button"
                            disabled={!isUnlocked || !!placement}
                            onClick={(e) => { e.stopPropagation(); onAddAbilityToBar?.(ability.id); }}
                            className={`px-2 py-1 ${themeColor === 'amber' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-cyan-600 hover:bg-cyan-500'} disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-[10px] rounded-md transition-colors flex items-center gap-1`}
                          >
                            <Plus size={11} /> {placement ? 'On Bar' : 'Add to Bar'}
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={!isUnlocked || safeSkillPoints <= 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            Sounds.slotClick();
                            player.onAllocateAbility?.(ability.id);
                          }}
                          className="w-full py-1 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-emerald-300 font-bold text-[10px] rounded-md transition-colors flex items-center justify-center gap-1 border border-neutral-700"
                        >
                          <Plus size={11} /> Upgrade Rank (1 SP)
                        </button>
                      </div>
                    </div>
                  );
                };

                return (
                  <>
                    {/* Class Combat Abilities */}
                    <div className="bg-neutral-900/60 p-5 rounded-xl border border-cyan-500/30 flex flex-col gap-4">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                          <Zap size={16} /> Class Combat Abilities & Upgrades
                        </h4>
                        <span className="text-xs text-neutral-400">Class: {playerClass.toUpperCase()}</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1"><Keyboard size={12} className="text-amber-400" /> Click "Bind Key" on any ability to bind</span>
                        <span className="flex items-center gap-1"><GripVertical size={12} className="text-cyan-400" /> Or drag onto action bars</span>
                        <span className="flex items-center gap-1"><Plus size={12} className="text-emerald-400" /> Spend Skill Points to raise ability rank</span>
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {abilitiesForClass(playerClass).map(ability => renderAbilityCard(ability, 'cyan'))}
                      </div>
                    </div>

                    {/* Elemental Magic & Wizard Staff Spells */}
                    <div className="bg-neutral-900/60 p-5 rounded-xl border border-amber-500/30 flex flex-col gap-4">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                          <Flame size={16} /> Elemental Magic & Staff Spells
                        </h4>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border ${hasStaff ? 'bg-amber-950/80 text-amber-300 border-amber-500/40' : 'bg-neutral-950 text-neutral-400 border-neutral-800'}`}>
                          {hasStaff ? '⚡ Wizard Staff Wielded' : 'Staff or Magic Required'}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1"><Sparkles size={12} className="text-amber-400" /> Elemental magic channelable with Wizard Staffs</span>
                        <span className="flex items-center gap-1"><Keyboard size={12} className="text-amber-400" /> Keybindable directly or placeable on action bars</span>
                        <span className="flex items-center gap-1"><Crosshair size={12} className="text-cyan-400" /> Casts towards cursor direction</span>
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {elementalMagicAbilities().map(ability => renderAbilityCard(ability, 'amber'))}
                      </div>
                    </div>
                  </>
                );
              })()}

            </div>
          )}

          {/* TAB 6: SETTINGS & KEYBINDS */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left: Audio Channels & Session Controls */}
              <div className="md:col-span-6 bg-neutral-900/60 rounded-xl border border-amber-500/20 p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Volume2 size={16} /> Configurable Audio Channels
                  </h4>
                  <span className="text-[10px] text-neutral-400">Independent Volume Levels</span>
                </div>

                {/* Master Volume */}
                <div className="flex flex-col gap-2 bg-neutral-950/70 p-3 rounded-xl border border-neutral-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-200 font-bold">Master Volume</span>
                    <span className="text-amber-400 font-mono font-bold">{Math.round(isMuted ? 0 : audioVols.master * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const newMute = !isMuted;
                        setIsMuted(newMute);
                        if (!newMute && audioVols.master === 0) {
                          AudioChannels.setMasterVolume(0.5);
                          setAudioVols(prev => ({ ...prev, master: 0.5 }));
                        }
                      }}
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                    >
                      {isMuted || audioVols.master === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                    <input 
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : audioVols.master}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        AudioChannels.setMasterVolume(v);
                        setAudioVols(prev => ({ ...prev, master: v }));
                        setVolume(v);
                        if (v > 0) setIsMuted(false);
                      }}
                      className="w-full accent-amber-500 h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Music & Atmosphere Volume */}
                <div className="flex flex-col gap-2 bg-neutral-950/70 p-3 rounded-xl border border-neutral-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-300">Music & Ambience</span>
                    <span className="text-cyan-400 font-mono font-bold">{Math.round(audioVols.music * 100)}%</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={audioVols.music}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      AudioChannels.setMusicVolume(v);
                      setAudioVols(prev => ({ ...prev, music: v }));
                    }}
                    className="w-full accent-cyan-500 h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* SFX & Combat Volume */}
                <div className="flex flex-col gap-2 bg-neutral-950/70 p-3 rounded-xl border border-neutral-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-300">SFX & Combat Impact</span>
                    <span className="text-rose-400 font-mono font-bold">{Math.round(audioVols.sfx * 100)}%</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={audioVols.sfx}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      AudioChannels.setSfxVolume(v);
                      setAudioVols(prev => ({ ...prev, sfx: v }));
                    }}
                    className="w-full accent-rose-500 h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* UI Cues Volume */}
                <div className="flex flex-col gap-2 bg-neutral-950/70 p-3 rounded-xl border border-neutral-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-300">UI Cues & Menu Clicks</span>
                    <span className="text-emerald-400 font-mono font-bold">{Math.round(audioVols.ui * 100)}%</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={audioVols.ui}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      AudioChannels.setUiVolume(v);
                      setAudioVols(prev => ({ ...prev, ui: v }));
                    }}
                    className="w-full accent-emerald-500 h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Exit Game */}
                <div className="mt-2 pt-4 border-t border-white/5 flex flex-col gap-2">
                  <h5 className="text-xs font-bold text-neutral-300">Session Controls</h5>
                  {onOpenInstructions && (
                    <button
                      onClick={() => {
                        Sounds.slotClick();
                        onOpenInstructions();
                      }}
                      className="w-full py-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 border border-amber-500/30 active:scale-95"
                    >
                      <HelpCircle size={15} /> View Controls & Game Guide
                    </button>
                  )}
                  <button
                    onClick={() => {
                      Sounds.slotClick();
                      onLeaveWorld();
                    }}
                    className="w-full py-2.5 bg-rose-600/80 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 border border-rose-500/40"
                  >
                    <LogOut size={16} /> Save Progress & Return to Lobby
                  </button>
                </div>
              </div>

              {/* Right: Custom Keybind Remapping */}
              <div className="md:col-span-6 bg-neutral-900/60 rounded-xl border border-amber-500/20 p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Keyboard size={16} /> Custom Keybind Remapping
                  </h4>
                  <button
                    onClick={() => {
                      const reset = resetKeybinds();
                      setActiveKeybinds(reset);
                      Sounds.slotClick();
                    }}
                    className="text-[11px] text-neutral-400 hover:text-amber-300 transition-colors"
                  >
                    Reset Defaults
                  </button>
                </div>

                <p className="text-xs text-neutral-400">
                  Click any keybind to reassign. Press any key on your keyboard, or press <kbd className="text-[10px] bg-neutral-800 px-1 py-0.5 rounded text-neutral-300">Esc</kbd> to cancel.
                </p>

                <div className="flex-1 overflow-y-auto max-h-[380px] custom-scrollbar flex flex-col gap-1.5 pr-1 text-xs">
                  {(Object.keys(KEYBIND_LABELS) as (keyof KeybindMap)[]).map((actionKey) => {
                    const label = KEYBIND_LABELS[actionKey];
                    const currentBind = activeKeybinds[actionKey] || DEFAULT_KEYBINDS[actionKey] || '';
                    const isListening = listeningKeybindAction === actionKey;

                    return (
                      <div 
                        key={actionKey}
                        className={`flex justify-between items-center py-2 px-3 rounded-lg border transition-all ${
                          isListening
                            ? 'bg-amber-500/20 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)] ring-1 ring-amber-500'
                            : 'bg-neutral-950/60 border-neutral-800/80 hover:border-neutral-700'
                        }`}
                      >
                        <span className="text-neutral-300 font-medium">{label}</span>
                        <button
                          onClick={() => {
                            Sounds.slotClick();
                            setListeningKeybindAction(isListening ? null : actionKey);
                          }}
                          className={`px-2.5 py-1 rounded font-mono text-[11px] font-bold border transition-all ${
                            isListening
                              ? 'bg-amber-400 text-neutral-950 border-amber-300 animate-pulse'
                              : 'bg-neutral-800 hover:bg-neutral-700 text-amber-300 border-neutral-700 hover:border-amber-400/50'
                          }`}
                        >
                          {isListening ? 'Press key...' : currentBind.toUpperCase()}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* Social & Party Tab */}
          {activeTab === 'social' && (
            <div className="flex flex-col gap-5 max-w-3xl mx-auto py-2">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      Party & Companions
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 font-mono border border-cyan-800">
                        {partyMembersList.length}/4 Members
                      </span>
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Form parties, inspect member gear, coordinate dungeon expeditions & set loot rules.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      Sounds.slotClick();
                      onStartReadyCheck?.();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <CheckCircle2 size={14} />
                    <span>Ready Check</span>
                  </button>

                  {partyMembersList.length > 1 && onLeaveParty && (
                    <button
                      type="button"
                      onClick={() => {
                        Sounds.slotClick();
                        onLeaveParty();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <LogOut size={13} />
                      <span>Leave Party</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Party Member Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {partyMembersList.map((member: any) => {
                  const isSelf = member.id === 'self' || member.id === player.nickname || member.name === player.nickname || member.name === 'You';
                  const hp = isSelf ? Math.round(player.health) : (member.hp ?? 100);
                  const maxHp = isSelf ? calculatedMaxHp : (member.maxHp ?? 100);
                  const hpPercent = Math.max(0, Math.min(100, Math.floor((hp / maxHp) * 100)));

                  return (
                    <div
                      key={member.id}
                      className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-3.5 flex flex-col gap-2.5 shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {member.isLeader && (
                            <Crown size={14} className="text-amber-400" title="Party Leader" />
                          )}
                          <div className="w-7 h-7 rounded-lg bg-neutral-800 flex items-center justify-center border border-neutral-700">
                            {member.playerClass === 'mage' ? (
                              <Sparkles size={14} className="text-cyan-400" />
                            ) : member.playerClass === 'archer' ? (
                              <Zap size={14} className="text-emerald-400" />
                            ) : (
                              <Shield size={14} className="text-rose-400" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-white flex items-center gap-1">
                              {member.name}
                              {isSelf && <span className="text-[10px] text-neutral-500">(You)</span>}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono capitalize">
                              Lv. {member.level || player.level} {member.playerClass || playerClass}
                            </span>
                          </div>
                        </div>

                        {!isSelf && onInspectPlayer && (
                          <button
                            type="button"
                            onClick={() => {
                              Sounds.slotClick();
                              onInspectPlayer(member);
                            }}
                            className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-bold border border-neutral-700 active:scale-95"
                          >
                            Inspect Gear
                          </button>
                        )}
                      </div>

                      {/* Health Bar */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                          <span>Health</span>
                          <span>{hp} / {maxHp}</span>
                        </div>
                        <div className="w-full bg-neutral-950 rounded-full h-2 overflow-hidden border border-neutral-800">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${hpPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Nearby Adventurers & Quick Invite */}
              <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserPlus size={15} className="text-cyan-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Nearby Adventurers In Realm
                    </h4>
                  </div>
                  <input
                    type="text"
                    placeholder="Filter players..."
                    value={socialInviteSearch}
                    onChange={(e) => setSocialInviteSearch(e.target.value)}
                    className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-500 w-44"
                  />
                </div>

                {nearbyPlayers.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic py-2">
                    No other players currently near your coordinates.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {nearbyPlayers
                      .filter(p => !socialInviteSearch || p.name.toLowerCase().includes(socialInviteSearch.toLowerCase()))
                      .map(p => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/70 border border-neutral-800 text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-bold text-neutral-200 truncate">{p.name}</span>
                            {p.level && <span className="text-[10px] text-amber-400 font-mono">L{p.level}</span>}
                          </div>
                          {onInvitePlayer && (
                            <button
                              type="button"
                              onClick={() => {
                                Sounds.slotClick();
                                onInvitePlayer(p.id);
                              }}
                              className="px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] active:scale-95"
                            >
                              Invite
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Dynamic Item Tooltip */}
      {hoveredTooltip && (
        <ItemTooltip
          slot={hoveredTooltip.slot}
          x={hoveredTooltip.x}
          y={hoveredTooltip.y}
          equippedHelmet={equipment[0]?.type}
          equippedChestplate={equipment[1]?.type}
          activeWeapon={hotbar[selectedSlotIndex]?.type}
        />
      )}
    </div>
  );
};
