import React, { useState } from 'react';
import { Sparkles, Hammer, Shield, Swords, Gem, Flame, Trash2, ArrowRight, Check, AlertCircle, Skull, AlertTriangle, Zap } from 'lucide-react';
import { BlockType, BlockNames } from '../lib/constants';
import { getItemMetadata } from './ItemTooltip';
import type { InventorySlotData } from '../lib/characterSchema';
import {
  EnchantmentPrefix,
  GemType,
  CursedAffix,
  PREFIXES,
  GEMS,
  CURSED_AFFIXES,
  canEnchant,
  getEnchantCost,
  getCursedAffixCost,
  getGemResonance,
  getDismantleYield
} from '../lib/enchanting';
import { Sounds } from '../lib/audio';

interface EnchantingStationViewProps {
  hotbar: (InventorySlotData | null)[];
  backpack: (InventorySlotData | null)[];
  renderBlockIcon: (slot: InventorySlotData | null) => React.ReactNode;
  onApplyEnchant: (
    slotSource: 'hotbar' | 'backpack',
    slotIndex: number,
    prefix: EnchantmentPrefix,
    newLevel: number,
    cost: { gold: number; materials: { type: BlockType; count: number }[] }
  ) => void;
  onApplyGem: (
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
  onDismantle: (
    slotSource: 'hotbar' | 'backpack',
    slotIndex: number,
    yields: { type: BlockType; count: number }[]
  ) => void;
}

export const EnchantingStationView: React.FC<EnchantingStationViewProps> = ({
  hotbar,
  backpack,
  renderBlockIcon,
  onApplyEnchant,
  onApplyGem,
  onApplyCurse,
  onDismantle
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'enchant' | 'gems' | 'curses' | 'dismantle'>('enchant');
  const [selectedSlotRef, setSelectedSlotRef] = useState<{ source: 'hotbar' | 'backpack'; index: number } | null>(null);
  const [selectedPrefix, setSelectedPrefix] = useState<EnchantmentPrefix>('Flametouched');
  const [selectedSocketIndex, setSelectedSocketIndex] = useState<1 | 2>(1);
  const [selectedGem, setSelectedGem] = useState<GemType>('ruby');
  const [selectedCurse, setSelectedCurse] = useState<CursedAffix>('Bloodbound');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Retrieve current selected item
  const selectedItem: InventorySlotData | null = selectedSlotRef
    ? (selectedSlotRef.source === 'hotbar' ? hotbar[selectedSlotRef.index] : backpack[selectedSlotRef.index])
    : null;

  const itemMeta = selectedItem ? getItemMetadata(selectedItem.type, selectedItem.durability) : null;
  const isEnchantable = selectedItem ? canEnchant(selectedItem.type) : false;

  // Inventory material counters
  const countMaterialInInv = (type: BlockType): number => {
    let sum = 0;
    hotbar.forEach(s => { if (s && s.type === type) sum += s.count; });
    backpack.forEach(s => { if (s && s.type === type) sum += s.count; });
    return sum;
  };

  const playerGold = countMaterialInInv(BlockType.GoldIngot);
  const playerArcaneDust = countMaterialInInv(BlockType.ArcaneDust);
  const playerSlimeCore = countMaterialInInv(BlockType.SlimeCore);
  const playerGolemShard = countMaterialInInv(BlockType.GolemShard);

  // Compute Cost for Enchanting
  const currentLevel = selectedItem?.enchantment?.level || 0;
  const nextLevel = Math.min(10, currentLevel + 1);
  const enchantCost = getEnchantCost(nextLevel, selectedPrefix);

  const canAffordEnchant =
    playerGold >= enchantCost.gold &&
    enchantCost.materials.every(m => countMaterialInInv(m.type) >= m.count);

  // Compute Cost for Cursing
  const curseCost = getCursedAffixCost(selectedCurse);
  const canAffordCurse =
    playerGold >= curseCost.gold &&
    curseCost.materials.every(m => countMaterialInInv(m.type) >= m.count);

  // Sockets & Resonance Calculations for Selected Item
  const existingSockets = {
    slot1: selectedItem?.sockets?.slot1 || selectedItem?.gem1 || null,
    slot2: selectedItem?.sockets?.slot2 || selectedItem?.gem2 || null,
  };
  const activeResonance = getGemResonance(existingSockets);
  const projectedSockets = {
    ...existingSockets,
    [selectedSocketIndex === 1 ? 'slot1' : 'slot2']: selectedGem,
  };
  const projectedResonance = getGemResonance(projectedSockets);

  const handleEnchant = () => {
    if (!selectedSlotRef || !selectedItem || !canAffordEnchant || currentLevel >= 10) return;
    Sounds.levelUp();
    onApplyEnchant(selectedSlotRef.source, selectedSlotRef.index, selectedPrefix, nextLevel, enchantCost);
    setSuccessNotice(`Successfully infused +${nextLevel} ${selectedPrefix}!`);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  const handleSocketGem = () => {
    if (!selectedSlotRef || !selectedItem) return;
    const gemMeta = GEMS[selectedGem];
    if (countMaterialInInv(gemMeta.blockType) < 1) return;
    Sounds.equipGear();
    onApplyGem(selectedSlotRef.source, selectedSlotRef.index, selectedSocketIndex, selectedGem);
    setSuccessNotice(`Embedded ${gemMeta.name} into Socket ${selectedSocketIndex}!`);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  const handleApplyCurseAction = () => {
    if (!selectedSlotRef || !selectedItem || !canAffordCurse || !onApplyCurse) return;
    Sounds.death();
    onApplyCurse(selectedSlotRef.source, selectedSlotRef.index, selectedCurse, curseCost);
    setSuccessNotice(`Bound ${CURSED_AFFIXES[selectedCurse].title} to equipment!`);
    setTimeout(() => setSuccessNotice(null), 3500);
  };

  const dismantleYields = selectedItem ? getDismantleYield(selectedItem.type, selectedItem.durability) : [];

  const handleDismantle = () => {
    if (!selectedSlotRef || !selectedItem) return;
    Sounds.craftSuccess();
    onDismantle(selectedSlotRef.source, selectedSlotRef.index, dismantleYields);
    setSuccessNotice(`Item dismantled into raw arcane materials!`);
    setSelectedSlotRef(null);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setActiveSubTab('enchant'); Sounds.slotClick(); }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'enchant'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5 border border-transparent'
            }`}
          >
            <Sparkles size={15} />
            <span>Enchant Gear</span>
          </button>

          <button
            onClick={() => { setActiveSubTab('gems'); Sounds.slotClick(); }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'gems'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5 border border-transparent'
            }`}
          >
            <Gem size={15} />
            <span>Gem Sockets & Resonance</span>
          </button>

          <button
            onClick={() => { setActiveSubTab('curses'); Sounds.death(); }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'curses'
                ? 'bg-rose-950/70 text-rose-300 border border-rose-500/60 shadow-[0_0_15px_rgba(225,29,72,0.3)]'
                : 'text-neutral-400 hover:text-rose-300 hover:bg-rose-950/20 border border-transparent'
            }`}
          >
            <Skull size={15} className="text-rose-400" />
            <span>Cursed Affixes (High Risk)</span>
          </button>

          <button
            onClick={() => { setActiveSubTab('dismantle'); Sounds.slotClick(); }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'dismantle'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5 border border-transparent'
            }`}
          >
            <Trash2 size={15} />
            <span>Salvage & Dismantle</span>
          </button>
        </div>

        {/* Currency summary */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-amber-400 flex items-center gap-1">
            Gold: <strong>{playerGold}</strong>
          </span>
          <span className="text-purple-400 flex items-center gap-1">
            Dust: <strong>{playerArcaneDust}</strong>
          </span>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successNotice && (
        <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in">
          <Check size={16} />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Main Grid: Left = Anvil Altar / Slots, Right = Inventory Selector */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: The Anvil Altar Workstation */}
        <div className="md:col-span-6 bg-neutral-900/60 rounded-xl border border-amber-500/20 p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Hammer size={14} />
              {activeSubTab === 'enchant' && 'Mystic Enchanting Anvil'}
              {activeSubTab === 'gems' && 'Jeweler Socket Workbench'}
              {activeSubTab === 'curses' && 'Forbidden Curse Infusion Altar'}
              {activeSubTab === 'dismantle' && 'Salvage & Smelting Furnace'}
            </h4>
            {selectedItem && (
              <button
                onClick={() => setSelectedSlotRef(null)}
                className="text-[10px] text-neutral-400 hover:text-white"
              >
                Clear Anvil
              </button>
            )}
          </div>

          {/* Anvil Target Centerpiece */}
          <div className="flex items-center justify-center p-4 bg-black/40 rounded-xl border border-white/10 relative overflow-hidden">
            {selectedItem ? (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-neutral-900 border-2 border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center">
                  <div className="w-12 h-12 flex items-center justify-center">
                    {renderBlockIcon(selectedItem)}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-white">
                    {selectedItem.enchantment ? `+${selectedItem.enchantment.level} ` : ''}
                    {itemMeta?.name || 'Selected Item'}
                  </span>
                  <span className="text-xs text-amber-300">
                    {selectedItem.enchantment?.prefix || 'Unenchanted Item'}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400 mt-1">
                    {itemMeta?.attack && <span>ATK: {itemMeta.attack}</span>}
                    {itemMeta?.defense && <span>DEF: +{itemMeta.defense}</span>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center gap-2 text-center text-neutral-500">
                <Hammer size={28} className="opacity-40" />
                <span className="text-xs">Select a weapon, armor, or tool from your bag on the right</span>
              </div>
            )}
          </div>

          {/* TAB 1: ENCHANTING OPTIONS */}
          {activeSubTab === 'enchant' && (
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-bold uppercase text-neutral-400">Choose Prefix Rune</span>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(PREFIXES).map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedPrefix(p.id); Sounds.slotClick(); }}
                    className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                      selectedPrefix === p.id
                        ? 'bg-amber-500/20 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                        : 'bg-neutral-900/60 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="text-xs font-bold" style={{ color: p.color }}>
                      {p.name}
                    </span>
                    <span className="text-[10px] text-neutral-400 leading-tight">
                      {p.description}
                    </span>
                  </button>
                ))}
              </div>

              {/* Cost & Requirements */}
              {selectedItem && (
                <div className="p-3 bg-black/40 rounded-xl border border-white/10 flex flex-col gap-2 mt-1">
                  <span className="text-[10px] uppercase font-bold text-neutral-400">
                    Infusion Cost (Tier +{nextLevel})
                  </span>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className={playerGold >= enchantCost.gold ? 'text-amber-400' : 'text-rose-400'}>
                      Gold: {enchantCost.gold} (You: {playerGold})
                    </span>
                    {enchantCost.materials.map(m => {
                      const have = countMaterialInInv(m.type);
                      return (
                        <span key={m.type} className={have >= m.count ? 'text-purple-300' : 'text-rose-400'}>
                          {BlockNames[m.type]}: {m.count} (You: {have})
                        </span>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleEnchant}
                    disabled={!isEnchantable || !canAffordEnchant || currentLevel >= 10}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all mt-1"
                  >
                    <Sparkles size={15} />
                    <span>{currentLevel >= 10 ? 'Max Enchantment (+10)' : `Infuse +${nextLevel} ${selectedPrefix}`}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GEM SOCKETING */}
          {activeSubTab === 'gems' && (
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-bold uppercase text-neutral-400">Select Socket & Cut Gem</span>

              <div className="flex items-center gap-2">
                {[1, 2].map(num => (
                  <button
                    key={num}
                    onClick={() => setSelectedSocketIndex(num as 1 | 2)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                      selectedSocketIndex === num
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                        : 'bg-neutral-900 border-white/10 text-neutral-400'
                    }`}
                  >
                    Socket #{num}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {Object.values(GEMS).map(g => {
                  const count = countMaterialInInv(g.blockType);
                  return (
                    <button
                      key={g.type}
                      onClick={() => { setSelectedGem(g.type); Sounds.slotClick(); }}
                      className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                        selectedGem === g.type
                          ? 'bg-amber-500/20 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                          : 'bg-neutral-900/60 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold" style={{ color: g.color }}>
                          {g.name}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">x{count}</span>
                      </div>
                      <span className="text-[10px] text-neutral-400">{g.description}</span>
                    </button>
                  );
                })}
              </div>

              {/* Gem Resonance Preview */}
              {selectedItem && (
                <div className="p-3 bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-black/50 rounded-xl border border-indigo-500/30 flex flex-col gap-1.5 mt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-indigo-300 flex items-center gap-1">
                      <Sparkles size={11} className="text-amber-400" />
                      {activeResonance ? '✦ Active Resonance Set Bonus ✦' : (projectedResonance ? '✦ Projected Resonance Preview ✦' : 'Resonance Synergy')}
                    </span>
                    {(activeResonance || projectedResonance) && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {(activeResonance || projectedResonance)?.name}
                      </span>
                    )}
                  </div>
                  {(activeResonance || projectedResonance) ? (
                    <div className="flex flex-col gap-1 text-[11px]">
                      <p className="text-white font-medium">
                        {(activeResonance || projectedResonance)?.description}
                      </p>
                      <span className="text-[10px] text-sky-300">
                        <strong>Aura: </strong>{(activeResonance || projectedResonance)?.auraBonusText}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-neutral-400 italic">
                      Slot 2 complementary cut gems into this item to unlock hidden elemental resonance, custom weapon slashes, and orbiting auras!
                    </span>
                  )}
                </div>
              )}

              {selectedItem && (
                <button
                  onClick={handleSocketGem}
                  disabled={!isEnchantable || countMaterialInInv(GEMS[selectedGem].blockType) < 1}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all mt-2"
                >
                  <Gem size={15} />
                  <span>Embed {GEMS[selectedGem].name}</span>
                </button>
              )}
            </div>
          )}

          {/* TAB 3: CURSED AFFIXES ALTAR */}
          {activeSubTab === 'curses' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-rose-400 flex items-center gap-1.5">
                  <Skull size={13} /> Ancient Forbidden Rite
                </span>
                <span className="text-[10px] text-rose-300/80 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">
                  High Risk, High Reward
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {Object.values(CURSED_AFFIXES).map(curse => (
                  <button
                    key={curse.id}
                    onClick={() => { setSelectedCurse(curse.id); Sounds.slotClick(); }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-1.5 transition-all ${
                      selectedCurse === curse.id
                        ? 'bg-rose-950/70 border-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.35)] ring-1 ring-rose-500/60'
                        : 'bg-neutral-900/60 border-white/10 hover:border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-rose-300 flex items-center gap-1.5">
                        <Skull size={12} className="text-rose-500" />
                        {curse.title}
                      </span>
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/40 text-neutral-400 border border-white/10">
                        {curse.applicableTo}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-300 leading-tight">
                      {curse.description}
                    </p>
                    <div className="flex flex-wrap gap-2 text-[10px] font-mono pt-1">
                      <span className="text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold">
                        ✦ {curse.positiveEffect}
                      </span>
                      <span className="text-rose-400 bg-red-950/50 px-1.5 py-0.5 rounded border border-red-500/30 font-bold flex items-center gap-1">
                        <AlertTriangle size={10} />
                        {curse.negativeEffect}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Curse Binding Requirements */}
              {selectedItem && (
                <div className="p-3 bg-red-950/30 rounded-xl border border-red-500/40 flex flex-col gap-2 mt-1">
                  <span className="text-[10px] uppercase font-bold text-rose-300">
                    Sacrificial Catalyst Required
                  </span>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className={playerGold >= curseCost.gold ? 'text-amber-400' : 'text-rose-400'}>
                      Gold: {curseCost.gold} (You: {playerGold})
                    </span>
                    {curseCost.materials.map(m => {
                      const have = countMaterialInInv(m.type);
                      return (
                        <span key={m.type} className={have >= m.count ? 'text-purple-300' : 'text-rose-400'}>
                          {BlockNames[m.type]}: {m.count} (You: {have})
                        </span>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleApplyCurseAction}
                    disabled={!isEnchantable || !canAffordCurse}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-700 via-rose-700 to-red-800 hover:from-red-600 hover:to-rose-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all mt-1"
                  >
                    <Skull size={15} className="text-rose-300" />
                    <span>Bind {CURSED_AFFIXES[selectedCurse].name} to Gear</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DISMANTLE */}
          {activeSubTab === 'dismantle' && (
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-bold uppercase text-neutral-400">Salvage Yield Preview</span>
              {selectedItem ? (
                <div className="p-3 bg-black/40 rounded-xl border border-white/10 flex flex-col gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {dismantleYields.map((y, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-white/10 text-xs font-mono text-neutral-300">
                        {BlockNames[y.type]}: +{y.count}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={handleDismantle}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all mt-2"
                  >
                    <Trash2 size={15} />
                    <span>Dismantle & Extract Materials</span>
                  </button>
                </div>
              ) : (
                <span className="text-xs text-neutral-500 italic">Select an item from the right to preview salvage yield.</span>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Inventory Equipment & Material Selector */}
        <div className="md:col-span-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Inventory & Bag Equipment
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">
              Click item to place on Anvil
            </span>
          </div>

          {/* Hotbar Slots */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase text-neutral-500">Hotbar</span>
            <div className="grid grid-cols-6 gap-2">
              {hotbar.map((slot, index) => {
                const isSelected = selectedSlotRef?.source === 'hotbar' && selectedSlotRef.index === index;
                return (
                  <button
                    key={`hotbar-${index}`}
                    onClick={() => {
                      Sounds.slotClick();
                      setSelectedSlotRef({ source: 'hotbar', index });
                    }}
                    className={`h-12 rounded-lg border flex items-center justify-center relative transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                        : slot
                        ? 'bg-neutral-900 border-white/10 hover:border-white/30'
                        : 'bg-neutral-950 border-white/5 opacity-50'
                    }`}
                  >
                    <div className="w-9 h-9 flex items-center justify-center">
                      {renderBlockIcon(slot)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Backpack Slots */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase text-neutral-500">Backpack Storage</span>
            <div className="grid grid-cols-6 gap-2 max-h-56 overflow-y-auto custom-scrollbar p-1">
              {backpack.map((slot, index) => {
                const isSelected = selectedSlotRef?.source === 'backpack' && selectedSlotRef.index === index;
                return (
                  <button
                    key={`backpack-${index}`}
                    onClick={() => {
                      Sounds.slotClick();
                      setSelectedSlotRef({ source: 'backpack', index });
                    }}
                    className={`h-12 rounded-lg border flex items-center justify-center relative transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                        : slot
                        ? 'bg-neutral-900 border-white/10 hover:border-white/30'
                        : 'bg-neutral-950 border-white/5 opacity-50'
                    }`}
                  >
                    <div className="w-9 h-9 flex items-center justify-center">
                      {renderBlockIcon(slot)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
