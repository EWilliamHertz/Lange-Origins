import React, { useState } from 'react';
import { 
  User, Package, Hammer, BookOpen, Sparkles, Settings, 
  X, Volume2, VolumeX, LogOut, ArrowRight, Check, 
  Trash2, Shield, Swords, Heart, Zap, Award, Search, Plus, Wrench
} from 'lucide-react';
import { BlockType, BlockNames, BlockColors } from '../lib/constants';
import { RECIPES } from '../lib/crafting';
import { MMO_ABILITIES } from '../App';
import { Sounds } from '../lib/audio';
import { getItemMetadata, RARITY_STYLES, ItemTooltip } from './ItemTooltip';

export type UnifiedMenuTab = 'character' | 'inventory' | 'crafting' | 'quests' | 'skills' | 'settings';

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
  onSlotClick: (type: any, index: number, isRightClick?: boolean) => void;
  onSlotHover?: (slot: any, e: React.MouseEvent, type?: string, index?: number) => void;
  onSlotLeave?: () => void;
  onClearCrafting: () => void;
  onQuickSort: () => void;
  onQuickStack: () => void;
  onTossItem?: (item: any) => void;
  renderBlockIcon: (slot: any) => React.ReactNode;
  player: {
    nickname: string;
    skin: string;
    level: number;
    xp: number;
    health: number;
    mana: number;
    stamina: number;
    maxStamina: number;
    kills?: Record<string, number>;
    statPoints: number;
    skillPoints: number;
    skills: { strength: number; dexterity: number; intelligence: number };
    abilities: { slash: number; fireball: number; heal: number; double_jump: number };
    onAllocateSkill: (stat: 'strength' | 'dexterity' | 'intelligence') => void;
    onAllocateAbility: (ability: 'slash' | 'fireball' | 'heal' | 'double_jump') => void;
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
  onClearCrafting,
  onQuickSort,
  onQuickStack,
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
  onSelectHotbarSlot = () => {}
}) => {
  const [recipeFilter, setRecipeFilter] = useState('');
  const [recipeCategory, setRecipeCategory] = useState<'all' | 'weapons' | 'armor' | 'tools' | 'resources'>('all');
  const [questFilter, setQuestFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [hoveredTooltip, setHoveredTooltip] = useState<{ slot: any; x: number; y: number } | null>(null);

  if (!isOpen) return null;

  // Compute player combat stats
  const helmetType = equipment[0]?.type || null;
  const chestplateType = equipment[1]?.type || null;
  const helmDefense = helmetType ? (getItemMetadata(helmetType).defense || 0) : 0;
  const chestDefense = chestplateType ? (getItemMetadata(chestplateType).defense || 0) : 0;
  const totalDefense = helmDefense + chestDefense;

  const currentWeapon = hotbar[selectedSlotIndex]?.type || null;
  const baseWeaponDmg = currentWeapon ? (getItemMetadata(currentWeapon).attack || 1) : 1;
  const totalAttackPower = baseWeaponDmg + (player.skills.strength || 0) * 2;
  const totalKills = Object.values(player.kills || {}).reduce((a: number, b: any) => a + Number(b || 0), 0);

  // Tab configurations
  const TABS: { id: UnifiedMenuTab; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    { id: 'character', label: 'Character', icon: <User size={18} /> },
    { id: 'inventory', label: 'Inventory & Bag', icon: <Package size={18} /> },
    { id: 'crafting', label: 'Crafting', icon: <Hammer size={18} /> },
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
      badge: player.skillPoints > 0 ? player.skillPoints : undefined 
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

    return (
      <button
        key={`${type}-${index}`}
        id={`slot-${type}-${index}`}
        onClick={() => {
          if (isEquipped) {
            Sounds.equipGear();
          } else if (type === 'craftingResult') {
            Sounds.craftSuccess();
          } else {
            Sounds.slotClick();
          }
          onSlotClick(type, index, false);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          Sounds.slotClick();
          onSlotClick(type, index, true);
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
            ? `${rarityConfig.border} bg-neutral-900/70 hover:border-amber-400/70 hover:bg-neutral-800/80 shadow-sm` 
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
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 select-none"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Dark Fantasy Glassmorphism Frame */}
      <div className="bg-neutral-950/90 backdrop-blur-2xl border border-amber-500/30 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.1)] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-neutral-200">
        
        {/* Navigation Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-amber-500/20 bg-gradient-to-r from-neutral-950 via-neutral-900/90 to-neutral-950">
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
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
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 tracking-wide relative ${
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
                  <span className="hidden md:inline text-[9px] text-neutral-600 font-mono ml-0.5">
                    [{idx + 1}]
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-neutral-500 hidden sm:inline font-mono">
              [Tab] Cycle • [Esc] Close
            </span>
            <button
              id="unified-menu-close-btn"
              onClick={() => {
                Sounds.slotClick();
                onClose();
              }}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close Menu (Esc)"
            >
              <X size={20} />
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
                      <span className="text-neutral-300">{Math.round(player.health)} / 20</span>
                    </div>
                    <div className="w-full h-2.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                      <div 
                        className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.max(0, Math.min(100, (player.health / 20) * 100))}%` }} 
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
                      <span className="text-neutral-300">{Math.round(player.mana)} / 100</span>
                    </div>
                    <div className="w-full h-2.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.max(0, Math.min(100, (player.mana / 100) * 100))}%` }} 
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

              {/* Ability Point Allocation Banner */}
              <div className="bg-gradient-to-r from-blue-950/40 via-neutral-900/80 to-blue-950/40 p-4 rounded-xl border border-blue-500/40 flex items-center justify-between mt-4">
                <div>
                  <h4 className="text-sm font-bold text-blue-300 flex items-center gap-1.5">
                    <Sparkles size={16} /> Available Skill Points: <span className="text-white text-base ml-1 font-mono">{player.skillPoints}</span>
                  </h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    1 level up grants exactly 1 skill point. Allocate points to unlock and upgrade combat abilities.
                  </p>
                </div>
              </div>

              {/* Abilities Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Slash */}
                <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <h5 className="font-bold text-white text-sm flex items-center gap-1.5">
                        <Swords size={16} className="text-red-400" /> Slash
                      </h5>
                      <span className="text-xs font-mono font-bold bg-neutral-950 px-2 py-0.5 rounded border border-neutral-700 text-white">
                        Lv {player.abilities.slash || 0}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Basic melee attack. Damage increases by +5 per level.
                    </p>
                  </div>
                  <button
                    disabled={player.skillPoints <= 0}
                    onClick={() => { Sounds.slotClick(); player.onAllocateAbility('slash'); }}
                    className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-neutral-700"
                  >
                    <Plus size={14} /> Upgrade (1 Point)
                  </button>
                </div>

                {/* Fireball */}
                <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <h5 className="font-bold text-white text-sm flex items-center gap-1.5">
                        <Zap size={16} className="text-orange-400" /> Fireball
                      </h5>
                      <span className="text-xs font-mono font-bold bg-neutral-950 px-2 py-0.5 rounded border border-neutral-700 text-white">
                        Lv {player.abilities.fireball || 0}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Shoot a flaming projectile. Damage +8 per level.
                    </p>
                  </div>
                  <button
                    disabled={player.skillPoints <= 0}
                    onClick={() => { Sounds.slotClick(); player.onAllocateAbility('fireball'); }}
                    className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-neutral-700"
                  >
                    <Plus size={14} /> Upgrade (1 Point)
                  </button>
                </div>
                
                {/* Heal */}
                <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <h5 className="font-bold text-white text-sm flex items-center gap-1.5">
                        <Heart size={16} className="text-rose-400" /> Heal
                      </h5>
                      <span className="text-xs font-mono font-bold bg-neutral-950 px-2 py-0.5 rounded border border-neutral-700 text-white">
                        Lv {player.abilities.heal || 0}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Restore health over time. Healing rate +2 per level.
                    </p>
                  </div>
                  <button
                    disabled={player.skillPoints <= 0}
                    onClick={() => { Sounds.slotClick(); player.onAllocateAbility('heal'); }}
                    className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-neutral-700"
                  >
                    <Plus size={14} /> Upgrade (1 Point)
                  </button>
                </div>
                
                {/* Double Jump */}
                <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <h5 className="font-bold text-white text-sm flex items-center gap-1.5">
                        <ArrowRight size={16} className="text-blue-400 rotate-[-90deg]" /> Double Jump
                      </h5>
                      <span className="text-xs font-mono font-bold bg-neutral-950 px-2 py-0.5 rounded border border-neutral-700 text-white">
                        Lv {player.abilities.double_jump || 0} / 1
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Unlock the ability to jump a second time in mid-air.
                    </p>
                  </div>
                  <button
                    disabled={player.skillPoints <= 0 || (player.abilities.double_jump || 0) >= 1}
                    onClick={() => { Sounds.slotClick(); player.onAllocateAbility('double_jump'); }}
                    className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-neutral-700"
                  >
                    <Plus size={14} /> Unlock (1 Point)
                  </button>
                </div>

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

              {/* Backpack Grid (27 slots) */}
              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-amber-400">
                  Backpack Storage (27 Slots)
                </span>
                <div className="grid grid-cols-9 gap-2 bg-neutral-900/40 p-4 rounded-xl border border-neutral-800/80">
                  {backpack.map((slot, i) => renderSlot('backpack', i, slot))}
                </div>
              </div>

              {/* Hotbar (10 slots) */}
              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-amber-400">
                  Primary Hotbar (Keys 1-9, 0)
                </span>
                <div className="flex flex-wrap gap-2 bg-neutral-900/40 p-4 rounded-xl border border-neutral-800/80">
                  {hotbar.map((slot, i) => 
                    renderSlot('hotbar', i, slot, '', (i + 1) % 10, i === selectedSlotIndex)
                  )}
                </div>
              </div>

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

                {/* Recipe List */}
                <div className="flex-1 overflow-y-auto max-h-[380px] custom-scrollbar flex flex-col gap-2 pr-1">
                  {RECIPES.filter(r => {
                    const name = BlockNames[r.result]?.toLowerCase() || '';
                    return name.includes(recipeFilter.toLowerCase());
                  }).map((r, idx) => {
                    const resultName = BlockNames[r.result] || 'Item';
                    const rarity = getItemMetadata(r.result).rarity;
                    const rConfig = RARITY_STYLES[rarity];

                    return (
                      <div 
                        key={`recipe-${idx}`}
                        className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800/80 flex items-center justify-between gap-3 hover:border-amber-500/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg border ${rConfig.border} bg-neutral-900 flex items-center justify-center p-1`}>
                            {renderBlockIcon(r.result)}
                          </div>
                          <div>
                            <h5 className={`text-xs font-bold ${rConfig.text}`}>
                              {resultName} {r.count > 1 && `(x${r.count})`}
                            </h5>
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

              </div>
            </div>
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
              
              {/* Stat Point Allocation Banner */}
              <div className="bg-gradient-to-r from-amber-950/40 via-neutral-900/80 to-amber-950/40 p-4 rounded-xl border border-amber-500/40 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                    <Sparkles size={16} /> Available Stat Points: <span className="text-white text-base ml-1 font-mono">{player.statPoints}</span>
                  </h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    1 level up grants exactly 1 stat point. Allocate points to empower your character.
                  </p>
                </div>
              </div>

              {/* 3 Core Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Strength */}
                <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <h5 className="font-bold text-white text-sm flex items-center gap-1.5">
                        <Swords size={16} className="text-rose-400" /> Strength
                      </h5>
                      <span className="text-xs font-mono font-bold bg-neutral-950 px-2 py-0.5 rounded border border-neutral-700 text-white">
                        Lv {player.skills.strength || 0}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Increases melee weapon damage by +2 per level.
                    </p>
                  </div>
                  <button
                    disabled={player.statPoints <= 0}
                    onClick={() => {
                      Sounds.slotClick();
                      player.onAllocateSkill('strength');
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
                        Lv {player.skills.dexterity || 0} / 10
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Increases maximum sprint stamina by +10 per level.
                    </p>
                  </div>
                  <button
                    disabled={player.statPoints <= 0 || (player.skills.dexterity || 0) >= 10}
                    onClick={() => {
                      Sounds.slotClick();
                      player.onAllocateSkill('dexterity');
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
                        Lv {player.skills.intelligence || 0}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Amplifies magic staff spells and boosts maximum mana.
                    </p>
                  </div>
                  <button
                    disabled={player.statPoints <= 0}
                    onClick={() => {
                      Sounds.slotClick();
                      player.onAllocateSkill('intelligence');
                    }}
                    className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-neutral-700"
                  >
                    <Plus size={14} /> Allocate (1 Point)
                  </button>
                </div>

              </div>

              {/* Class MMO Abilities */}
              <div className="bg-neutral-900/60 p-5 rounded-xl border border-amber-500/20 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                    <Zap size={16} /> Class Combat Abilities
                  </h4>
                  <span className="text-xs text-neutral-400">Class: {playerClass.toUpperCase()}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {MMO_ABILITIES.filter(a => a.class === playerClass).map(ability => {
                    const statReq = ability.class === 'warrior' ? player.skills.strength : ability.class === 'archer' ? player.skills.dexterity : player.skills.intelligence;
                    const isUnlocked = (statReq || 0) >= ability.req;
                    const boundKey = Object.entries(keybinds).find(([k, v]) => v === ability.id)?.[0];

                    return (
                      <div 
                        key={ability.id}
                        className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
                          isUnlocked 
                            ? 'bg-neutral-950/80 border-cyan-500/40 text-neutral-200 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                            : 'bg-neutral-950/40 border-neutral-800/80 text-neutral-500 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center">
                              {ability.icon}
                            </div>
                            <div>
                              <h6 className="text-xs font-bold text-white">{ability.name}</h6>
                              <span className="text-[10px] text-neutral-400">Req: Lv {ability.req}</span>
                            </div>
                          </div>
                          {boundKey && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-amber-500 text-neutral-950 rounded">
                              {boundKey.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 italic">
                          {ability.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 6: SETTINGS & KEYBINDS */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left: Audio & Experience */}
              <div className="md:col-span-6 bg-neutral-900/60 rounded-xl border border-amber-500/20 p-5 flex flex-col gap-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Volume2 size={16} /> Audio & Ambience
                </h4>

                {/* Master Volume */}
                <div className="flex flex-col gap-2 bg-neutral-950/70 p-3 rounded-xl border border-neutral-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-300 font-bold">Master Volume</span>
                    <span className="text-amber-400 font-mono">{Math.round(isMuted ? 0 : volume * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                    >
                      {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                    <input 
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setVolume(v);
                        if (v > 0) setIsMuted(false);
                      }}
                      className="w-full accent-amber-500 h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Exit Game */}
                <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-2">
                  <h5 className="text-xs font-bold text-neutral-300">Session Controls</h5>
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

              {/* Right: Keybind Reference */}
              <div className="md:col-span-6 bg-neutral-900/60 rounded-xl border border-amber-500/20 p-5 flex flex-col gap-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Settings size={16} /> Controls & Keybinds
                </h4>

                <div className="flex flex-col gap-1.5 text-xs">
                  {[
                    { action: 'Move Left / Right', key: 'A / D' },
                    { action: 'Jump', key: 'W / Space' },
                    { action: 'Drop Through Platform', key: 'S' },
                    { action: 'Hold Sprint', key: 'Shift' },
                    { action: 'Attack / Break Block', key: 'Left Click' },
                    { action: 'Place Block / Interact', key: 'Right Click' },
                    { action: 'Consolidated Menu', key: 'Tab / E' },
                    { action: 'Quick Quest Log', key: 'Q' },
                    { action: 'Cycle Hotbar', key: '1 - 9, 0' },
                    { action: 'Toss Item', key: 'Drop Zone or Q' },
                  ].map((kb, idx) => (
                    <div 
                      key={idx}
                      className="flex justify-between items-center py-1.5 px-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/80"
                    >
                      <span className="text-neutral-300">{kb.action}</span>
                      <kbd className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-amber-300 font-mono text-[11px] font-bold">
                        {kb.key}
                      </kbd>
                    </div>
                  ))}
                </div>
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
