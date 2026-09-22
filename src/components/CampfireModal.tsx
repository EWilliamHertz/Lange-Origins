import React, { useState } from 'react';
import { X, Flame, Sparkles, Utensils, Clock, Shield, Heart, Zap, Wind } from 'lucide-react';
import { BlockType, BlockNames } from '../lib/constants';
import { InventorySlot } from '../types';
import { Sounds } from '../lib/audio';

interface CampfireRecipe {
  id: string;
  name: string;
  result: BlockType;
  count: number;
  ingredients: { type: BlockType; count: number; name: string }[];
  buffTitle: string;
  buffDescription: string;
  buffIcon: 'heart' | 'zap' | 'wind' | 'shield' | 'utensils';
  color: string;
}

export const CULINARY_RECIPES: CampfireRecipe[] = [
  {
    id: 'hearty_stew',
    name: 'Hearty Stew',
    result: BlockType.HeartyStew,
    count: 1,
    ingredients: [
      { type: BlockType.Carrot, count: 1, name: 'Farm Carrot' },
      { type: BlockType.RawMeat, count: 1, name: 'Raw Meat' },
      { type: BlockType.WildSpice, count: 1, name: 'Wild Spice' },
    ],
    buffTitle: '+40 Max HP (5 min)',
    buffDescription: 'Simmered slow over embers. Increases maximum health by 40 and heals instantly.',
    buffIcon: 'heart',
    color: 'from-amber-500/20 to-rose-500/20 text-rose-400 border-rose-500/40'
  },
  {
    id: 'arcane_broth',
    name: 'Arcane Broth',
    result: BlockType.ArcaneBroth,
    count: 1,
    ingredients: [
      { type: BlockType.Apple, count: 1, name: 'Apple' },
      { type: BlockType.RawMeat, count: 1, name: 'Raw Meat' },
      { type: BlockType.WildSpice, count: 1, name: 'Wild Spice' },
    ],
    buffTitle: '2x Mana Regen (5 min)',
    buffDescription: 'Pulsing mystic soup that doubles mana regeneration rate for spellcasters.',
    buffIcon: 'zap',
    color: 'from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/40'
  },
  {
    id: 'hunters_roast',
    name: "Hunter's Roast",
    result: BlockType.HuntersRoast,
    count: 1,
    ingredients: [
      { type: BlockType.RawMeat, count: 1, name: 'Raw Meat' },
      { type: BlockType.Carrot, count: 1, name: 'Farm Carrot' },
      { type: BlockType.Apple, count: 1, name: 'Apple' },
    ],
    buffTitle: '+35% Move Speed (5 min)',
    buffDescription: 'Glazed tenderloin that boosts sprinting speed and cuts stamina drain.',
    buffIcon: 'wind',
    color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/40'
  },
  {
    id: 'ironhide_goulash',
    name: 'Ironhide Goulash',
    result: BlockType.IronhideGoulash,
    count: 1,
    ingredients: [
      { type: BlockType.RawMeat, count: 1, name: 'Raw Meat' },
      { type: BlockType.Bone, count: 1, name: 'Bone' },
      { type: BlockType.WildSpice, count: 1, name: 'Wild Spice' },
    ],
    buffTitle: '+30% Damage Resist (5 min)',
    buffDescription: 'Dense mineral bone stew that temporarily thickens skin to reduce incoming damage.',
    buffIcon: 'shield',
    color: 'from-amber-600/20 to-orange-500/20 text-amber-400 border-amber-500/40'
  },
  {
    id: 'cooked_meat',
    name: 'Seared Steak',
    result: BlockType.CookedMeat,
    count: 1,
    ingredients: [
      { type: BlockType.RawMeat, count: 1, name: 'Raw Meat' },
      { type: BlockType.Coal, count: 1, name: 'Coal Fuel' },
    ],
    buffTitle: '+12 HP & +40 Stamina',
    buffDescription: 'Crisp seared cut of steak. Quick nutrition restoring both health and energy.',
    buffIcon: 'utensils',
    color: 'from-orange-500/20 to-amber-500/20 text-orange-400 border-orange-500/40'
  },
];

interface CampfireModalProps {
  isOpen: boolean;
  onClose: () => void;
  backpack: InventorySlot[];
  hotbar: InventorySlot[];
  onCookRecipe: (recipe: CampfireRecipe) => void;
  renderBlockIcon: (slot: InventorySlot | BlockType | null) => React.ReactNode;
}

export const CampfireModal: React.FC<CampfireModalProps> = ({
  isOpen,
  onClose,
  backpack,
  hotbar,
  onCookRecipe,
  renderBlockIcon,
}) => {
  const [cookingId, setCookingId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Helper to count total amount of an item across inventory and hotbar
  const getItemCount = (type: BlockType): number => {
    let total = 0;
    const countIn = (slots: InventorySlot[]) => {
      for (const slot of slots) {
        if (slot && slot.type === type) {
          total += slot.count;
        }
      }
    };
    countIn(backpack);
    countIn(hotbar);
    return total;
  };

  const handleCook = (recipe: CampfireRecipe) => {
    // Check if player has required ingredients
    const canCook = recipe.ingredients.every(ing => getItemCount(ing.type) >= ing.count);
    if (!canCook || cookingId) return;

    setCookingId(recipe.id);
    Sounds.sizzle();

    setTimeout(() => {
      onCookRecipe(recipe);
      setCookingId(null);
      Sounds.craftSuccess();
    }, 850);
  };

  return (
    <div
      id="campfire-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="campfire-modal-card"
        className="relative w-full max-w-2xl bg-neutral-900/95 border border-amber-500/40 rounded-2xl p-6 shadow-[0_0_40px_rgba(245,158,11,0.25)] flex flex-col gap-5 text-neutral-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="campfire-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all active:scale-95"
          title="Close (ESC)"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 border-b border-amber-500/20 pb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/40 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <Flame size={26} className="text-amber-500 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-white font-black text-xl tracking-wide">Campfire Hearth & Culinary Cauldron</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Cooking Station
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Combine farm produce, wild game meats, and aromatic spices over the fire to brew meals with powerful buffs.
            </p>
          </div>
        </div>

        {/* Recipe Cards List */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-400 px-1">
            <span className="flex items-center gap-1.5">
              <Utensils size={14} className="text-amber-400" />
              Heirloom Recipes
            </span>
            <span>Buff Benefits & Ingredients</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {CULINARY_RECIPES.map((recipe) => {
              const canCook = recipe.ingredients.every(ing => getItemCount(ing.type) >= ing.count);
              const isCookingThis = cookingId === recipe.id;

              return (
                <div
                  key={recipe.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 bg-neutral-950/70 ${recipe.color} hover:border-amber-400/60`}
                >
                  {/* Left: Result Icon & Name */}
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <div className="w-12 h-12 rounded-xl bg-neutral-900/90 border border-amber-500/30 flex items-center justify-center relative shadow-inner">
                      {renderBlockIcon(recipe.result)}
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm tracking-wide flex items-center gap-2">
                        {recipe.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {recipe.buffIcon === 'heart' && <Heart size={12} className="text-rose-400" />}
                        {recipe.buffIcon === 'zap' && <Zap size={12} className="text-purple-400" />}
                        {recipe.buffIcon === 'wind' && <Wind size={12} className="text-emerald-400" />}
                        {recipe.buffIcon === 'shield' && <Shield size={12} className="text-amber-400" />}
                        {recipe.buffIcon === 'utensils' && <Utensils size={12} className="text-orange-400" />}
                        <span className="text-[11px] font-semibold text-white/90">
                          {recipe.buffTitle}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 max-w-xs mt-0.5 line-clamp-1">
                        {recipe.buffDescription}
                      </p>
                    </div>
                  </div>

                  {/* Middle: Required Ingredients with Player Counts */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {recipe.ingredients.map((ing, i) => {
                      const owned = getItemCount(ing.type);
                      const hasEnough = owned >= ing.count;

                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs ${
                            hasEnough
                              ? 'bg-neutral-900/90 border-neutral-700 text-neutral-200'
                              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                          }`}
                        >
                          <div className="w-5 h-5 flex items-center justify-center scale-90">
                            {renderBlockIcon(ing.type)}
                          </div>
                          <span className="font-medium text-[11px]">{ing.name}</span>
                          <span
                            className={`font-mono text-[10px] font-bold px-1 rounded ${
                              hasEnough ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {owned}/{ing.count}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right: Cook Button */}
                  <button
                    onClick={() => handleCook(recipe)}
                    disabled={!canCook || Boolean(cookingId)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 whitespace-nowrap active:scale-95 ${
                      canCook
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer'
                        : 'bg-neutral-800/70 text-neutral-500 border border-neutral-700/50 cursor-not-allowed'
                    }`}
                  >
                    {isCookingThis ? (
                      <>
                        <Flame size={14} className="animate-spin text-amber-300" />
                        <span>Simmering...</span>
                      </>
                    ) : (
                      <>
                        <Utensils size={14} />
                        <span>Cook over Fire</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Player Inventory Preview for Quick Reference */}
        <div className="bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Larder Ingredients & Backpack
            </span>
            <span className="text-[10px] text-amber-400/90 flex items-center gap-1">
              <Sparkles size={11} />
              Ingredients in backpack are detected automatically
            </span>
          </div>

          <div className="grid grid-cols-9 gap-1.5">
            {backpack.map((slot, i) => (
              <div
                key={i}
                className={`w-11 h-11 rounded-lg border flex items-center justify-center relative ${
                  slot &&
                  (slot.type === BlockType.Carrot ||
                    slot.type === BlockType.Apple ||
                    slot.type === BlockType.RawMeat ||
                    slot.type === BlockType.WildSpice ||
                    slot.type === BlockType.Bone ||
                    slot.type === BlockType.Coal)
                    ? 'bg-amber-950/30 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                    : 'bg-neutral-900/60 border-neutral-800 text-neutral-500'
                }`}
              >
                {slot ? renderBlockIcon(slot) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default CampfireModal;
