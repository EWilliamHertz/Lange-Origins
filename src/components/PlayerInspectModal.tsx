import React from 'react';
import { X, Shield, Swords, Zap, Heart, Sparkles, UserCheck, Gem } from 'lucide-react';
import { BlockType, BlockNames } from '../lib/constants';
import { getItemMetadata, RARITY_STYLES } from './ItemTooltip';
import type { InventorySlotData } from '../lib/characterSchema';
import { PREFIXES, GEMS } from '../lib/enchanting';

export interface InspectedPlayer {
  id: string;
  name: string;
  race: string;
  playerClass: string;
  level: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  skin?: string;
  equipment: (InventorySlotData | null)[];
  skills?: Record<string, number>;
}

interface PlayerInspectModalProps {
  player: InspectedPlayer | null;
  onClose: () => void;
  renderBlockIcon: (slot: InventorySlotData | null) => React.ReactNode;
}

export const PlayerInspectModal: React.FC<PlayerInspectModalProps> = ({
  player,
  onClose,
  renderBlockIcon
}) => {
  if (!player) return null;

  const helmetSlot = player.equipment[0] || null;
  const chestplateSlot = player.equipment[1] || null;

  const helmetMeta = helmetSlot ? getItemMetadata(helmetSlot.type, helmetSlot.durability) : null;
  const chestMeta = chestplateSlot ? getItemMetadata(chestplateSlot.type, chestplateSlot.durability) : null;

  const totalDefense = (helmetMeta?.defense || 0) + (chestMeta?.defense || 0) + ((player.skills?.defense || 0) * 2);
  const totalAttack = 10 + ((player.skills?.strength || 0) * 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-neutral-950 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-amber-950/40 via-neutral-900 to-neutral-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <UserCheck size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-wide text-white uppercase flex items-center gap-2">
                {player.name}
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Level {player.level}
                </span>
              </h3>
              <p className="text-xs text-neutral-400 capitalize">
                {player.race} • {player.playerClass}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">
          {/* Vitals Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-neutral-900/80 p-3 rounded-xl border border-rose-500/30 flex items-center gap-3">
              <Heart size={20} className="text-rose-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-neutral-400 font-bold uppercase">Health Pool</span>
                <span className="font-mono font-bold text-sm text-white">
                  {player.health} / {player.maxHealth || 100}
                </span>
              </div>
            </div>

            <div className="bg-neutral-900/80 p-3 rounded-xl border border-sky-500/30 flex items-center gap-3">
              <Zap size={20} className="text-sky-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-neutral-400 font-bold uppercase">Mana Reserves</span>
                <span className="font-mono font-bold text-sm text-white">
                  {player.mana} / {player.maxMana || 50}
                </span>
              </div>
            </div>
          </div>

          {/* Combat Ratings */}
          <div className="bg-neutral-900/50 p-4 rounded-xl border border-white/5 flex items-center justify-around">
            <div className="flex flex-col items-center gap-1">
              <Swords size={18} className="text-red-400" />
              <span className="text-xs text-neutral-400">Power Rating</span>
              <span className="font-mono font-bold text-base text-white">{totalAttack}</span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex flex-col items-center gap-1">
              <Shield size={18} className="text-sky-400" />
              <span className="text-xs text-neutral-400">Armor Defense</span>
              <span className="font-mono font-bold text-base text-white">+{totalDefense}</span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex flex-col items-center gap-1">
              <Sparkles size={18} className="text-amber-400" />
              <span className="text-xs text-neutral-400">Class Spec</span>
              <span className="font-mono font-bold text-xs uppercase text-amber-300">
                {player.playerClass}
              </span>
            </div>
          </div>

          {/* Equipped Armor & Enchantments */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Equipped Armor & Enchantments
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Helmet */}
              <div className="p-3 bg-neutral-900/80 border border-white/10 rounded-xl flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center shrink-0">
                  {renderBlockIcon(helmetSlot)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Head Armor</span>
                  <span className="text-xs font-bold truncate text-white">
                    {helmetMeta?.name || 'No Helmet Equipped'}
                  </span>
                  {helmetSlot?.enchantment && (
                    <span className="text-[10px] font-mono font-bold text-amber-300 flex items-center gap-1 mt-0.5">
                      <Sparkles size={10} /> +{helmetSlot.enchantment.level} {helmetSlot.enchantment.prefix || 'Enchanted'}
                    </span>
                  )}
                </div>
              </div>

              {/* Chestplate */}
              <div className="p-3 bg-neutral-900/80 border border-white/10 rounded-xl flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center shrink-0">
                  {renderBlockIcon(chestplateSlot)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Torso Armor</span>
                  <span className="text-xs font-bold truncate text-white">
                    {chestMeta?.name || 'No Chestplate Equipped'}
                  </span>
                  {chestplateSlot?.enchantment && (
                    <span className="text-[10px] font-mono font-bold text-amber-300 flex items-center gap-1 mt-0.5">
                      <Sparkles size={10} /> +{chestplateSlot.enchantment.level} {chestplateSlot.enchantment.prefix || 'Enchanted'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-neutral-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-bold transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
