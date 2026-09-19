import React, { useState, useEffect } from 'react';
import { Dices, Coins, X, Award, Sparkles, Shield, Swords, Clock } from 'lucide-react';
import { BlockType, BlockNames } from '../lib/constants';
import { getItemMetadata, RARITY_STYLES } from './ItemTooltip';

export interface LootRollItem {
  id: string;
  itemType: BlockType;
  itemName: string;
  droppedBy: string;
  rarity: 'rare' | 'epic' | 'legendary' | 'mythic';
  expiresAt: number;
}

export interface RollResult {
  playerId: string;
  playerName: string;
  choice: 'need' | 'greed' | 'pass';
  roll?: number;
}

interface PartyLootRollModalProps {
  activeItem: LootRollItem | null;
  onRoll: (itemId: string, choice: 'need' | 'greed' | 'pass') => void;
  rollResults?: RollResult[];
}

export const PartyLootRollModal: React.FC<PartyLootRollModalProps> = ({
  activeItem,
  onRoll,
  rollResults = []
}) => {
  const [selectedChoice, setSelectedChoice] = useState<'need' | 'greed' | 'pass' | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(30);

  useEffect(() => {
    if (!activeItem) {
      setSelectedChoice(null);
      return;
    }
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((activeItem.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        if (!selectedChoice) onRoll(activeItem.id, 'pass');
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [activeItem, selectedChoice, onRoll]);

  if (!activeItem) return null;

  const metadata = getItemMetadata(activeItem.itemType);
  const rarityStyle = RARITY_STYLES[activeItem.rarity] || RARITY_STYLES.rare;

  const handleChoice = (choice: 'need' | 'greed' | 'pass') => {
    setSelectedChoice(choice);
    onRoll(activeItem.id, choice);
  };

  return (
    <div className="fixed bottom-24 right-6 z-40 w-80 bg-neutral-950/95 backdrop-blur-xl border border-amber-500/40 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 text-white animate-in slide-in-from-bottom-5 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <Award size={16} className="text-amber-400" />
          <span className="text-xs font-black uppercase tracking-wider text-amber-200">
            Party Loot Distribution
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-400">
          <Clock size={12} />
          <span>{timeLeft}s</span>
        </div>
      </div>

      {/* Item Display */}
      <div className={`p-3 rounded-xl border ${rarityStyle.border} ${rarityStyle.glow} bg-neutral-900/80 flex items-center gap-3`}>
        <div className="w-12 h-12 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center shrink-0">
          <Sparkles size={22} className={rarityStyle.text} />
        </div>
        <div className="flex flex-col min-w-0">
          <span className={`text-sm font-bold truncate ${rarityStyle.text}`}>
            {activeItem.itemName || metadata.name}
          </span>
          <span className="text-[10px] text-neutral-400">
            Dropped by <strong className="text-neutral-200">{activeItem.droppedBy}</strong>
          </span>
          <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-300 mt-1">
            {metadata.attack && <span>ATK: {metadata.attack}</span>}
            {metadata.defense && <span>DEF: +{metadata.defense}</span>}
          </div>
        </div>
      </div>

      {/* Rolling Actions */}
      {!selectedChoice ? (
        <div className="grid grid-cols-3 gap-2 pt-1">
          {/* Need */}
          <button
            onClick={() => handleChoice('need')}
            className="py-2.5 rounded-xl bg-gradient-to-t from-red-800 to-red-600 hover:from-red-700 hover:to-red-500 border border-red-400/50 text-white font-bold text-xs flex flex-col items-center gap-1 shadow-lg active:scale-95 transition-all"
          >
            <Dices size={16} />
            <span>Need</span>
          </button>

          {/* Greed */}
          <button
            onClick={() => handleChoice('greed')}
            className="py-2.5 rounded-xl bg-gradient-to-t from-amber-800 to-amber-600 hover:from-amber-700 hover:to-amber-500 border border-amber-400/50 text-white font-bold text-xs flex flex-col items-center gap-1 shadow-lg active:scale-95 transition-all"
          >
            <Coins size={16} />
            <span>Greed</span>
          </button>

          {/* Pass */}
          <button
            onClick={() => handleChoice('pass')}
            className="py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-white/10 text-neutral-300 font-bold text-xs flex flex-col items-center gap-1 active:scale-95 transition-all"
          >
            <X size={16} />
            <span>Pass</span>
          </button>
        </div>
      ) : (
        <div className="p-2.5 rounded-xl bg-neutral-900 border border-white/10 text-center text-xs">
          <span className="text-neutral-400">You voted: </span>
          <strong className="uppercase font-mono text-amber-300 ml-1">{selectedChoice}</strong>
        </div>
      )}

      {/* Roll Results Ticker */}
      {rollResults.length > 0 && (
        <div className="border-t border-white/10 pt-2 flex flex-col gap-1 text-[10px]">
          {rollResults.map((r, i) => (
            <div key={i} className="flex justify-between items-center text-neutral-400 font-mono">
              <span>{r.playerName}</span>
              <span className="capitalize text-neutral-200">
                {r.choice} {r.roll !== undefined ? `(d100: ${r.roll})` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
