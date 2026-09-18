import React from 'react';
import { BlockType, BlockNames } from '../lib/constants';
import { Shield, Swords, Pickaxe, Sparkles, Coins, Zap, Heart, Wrench } from 'lucide-react';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface ItemInfo {
  name: string;
  category: 'Weapon' | 'Armor' | 'Tool' | 'Consumable' | 'Resource' | 'Magical' | 'Mechanism' | 'Special';
  rarity: ItemRarity;
  attack?: number;
  defense?: number;
  miningPower?: number;
  durability?: { current: number; max: number };
  description: string;
  coinValue: number;
}

export function getItemRarity(type: BlockType): ItemRarity {
  if (type === BlockType.BossDrop || type === BlockType.AdminBrick) return 'mythic';
  if (
    type === BlockType.DiamondSword ||
    type === BlockType.DiamondHelmet ||
    type === BlockType.DiamondChestplate ||
    type === BlockType.MagicStaff ||
    type === BlockType.WizardStaff ||
    type === BlockType.BlueCrystal
  ) return 'legendary';
  if (
    type === BlockType.Diamond ||
    type === BlockType.DiamondOre ||
    type === BlockType.GoldHelmet ||
    type === BlockType.GoldChestplate ||
    type === BlockType.GoldSword ||
    type === BlockType.Bow ||
    type === BlockType.Gun ||
    type === BlockType.GrapplingHook
  ) return 'epic';
  if (
    type === BlockType.GoldIngot ||
    type === BlockType.GoldOre ||
    type === BlockType.IronHelmet ||
    type === BlockType.IronChestplate ||
    type === BlockType.IronSword ||
    type === BlockType.IronPickaxe ||
    type === BlockType.IronAxe ||
    type === BlockType.TNT
  ) return 'rare';
  if (
    type === BlockType.IronOre ||
    type === BlockType.IronIngot ||
    type === BlockType.StonePickaxe ||
    type === BlockType.StoneSword ||
    type === BlockType.StoneAxe ||
    type === BlockType.WoodSword ||
    type === BlockType.WoodPickaxe ||
    type === BlockType.WoodAxe ||
    type === BlockType.Apple ||
    type === BlockType.Carrot ||
    type === BlockType.Arrow
  ) return 'uncommon';
  return 'common';
}

export const RARITY_STYLES: Record<ItemRarity, { label: string; text: string; border: string; glow: string; badge: string }> = {
  common: {
    label: 'Common',
    text: 'text-neutral-300',
    border: 'border-neutral-700/80',
    glow: 'shadow-neutral-900/50',
    badge: 'bg-neutral-800/80 text-neutral-300 border-neutral-700'
  },
  uncommon: {
    label: 'Uncommon',
    text: 'text-emerald-400',
    border: 'border-emerald-500/40',
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
  },
  rare: {
    label: 'Rare',
    text: 'text-sky-400',
    border: 'border-sky-500/50',
    glow: 'shadow-[0_0_20px_rgba(14,165,233,0.2)]',
    badge: 'bg-sky-950/60 text-sky-300 border-sky-500/40'
  },
  epic: {
    label: 'Epic',
    text: 'text-purple-400',
    border: 'border-purple-500/60',
    glow: 'shadow-[0_0_22px_rgba(168,85,247,0.25)]',
    badge: 'bg-purple-950/60 text-purple-300 border-purple-500/40'
  },
  legendary: {
    label: 'Legendary',
    text: 'text-amber-400',
    border: 'border-amber-500/70',
    glow: 'shadow-[0_0_25px_rgba(245,158,11,0.3)]',
    badge: 'bg-amber-950/60 text-amber-300 border-amber-500/50'
  },
  mythic: {
    label: 'Mythic',
    text: 'text-rose-400',
    border: 'border-rose-500/80',
    glow: 'shadow-[0_0_30px_rgba(244,63,94,0.35)]',
    badge: 'bg-rose-950/70 text-rose-200 border-rose-500/60'
  }
};

export function getItemMetadata(type: BlockType, currentDurability?: number): ItemInfo {
  const name = BlockNames[type] || 'Unknown Artifact';
  const rarity = getItemRarity(type);

  // Defaults
  let category: ItemInfo['category'] = 'Resource';
  let attack: number | undefined;
  let defense: number | undefined;
  let miningPower: number | undefined;
  let maxDurability: number | undefined;
  let description = 'A standard material harvested from the world.';
  let coinValue = 1;

  switch (type) {
    case BlockType.DiamondSword:
      category = 'Weapon';
      attack = 10;
      maxDurability = 80;
      description = 'Forged of dense crystalline diamond. Strikes with lethal precision.';
      coinValue = 80;
      break;
    case BlockType.GoldSword:
      category = 'Weapon';
      attack = 7;
      maxDurability = 35;
      description = 'A regal gilded blade with formidable swiftness.';
      coinValue = 35;
      break;
    case BlockType.IronSword:
      category = 'Weapon';
      attack = 6;
      maxDurability = 50;
      description = 'A tempered steel broadsword trusted by seasoned adventurers.';
      coinValue = 18;
      break;
    case BlockType.StoneSword:
      category = 'Weapon';
      attack = 5;
      maxDurability = 40;
      description = 'Chiseled stone blade with rugged cutting force.';
      coinValue = 6;
      break;
    case BlockType.WoodSword:
      category = 'Weapon';
      attack = 4;
      maxDurability = 30;
      description = 'A carved wooden practice sword.';
      coinValue = 2;
      break;
    case BlockType.Bow:
      category = 'Weapon';
      attack = 7;
      description = 'Fires arrows with extended ballistic velocity.';
      coinValue = 25;
      break;
    case BlockType.Gun:
      category = 'Weapon';
      attack = 12;
      description = 'High-impact kinetic firearm requiring ammunition.';
      coinValue = 60;
      break;
    case BlockType.MagicStaff:
    case BlockType.WizardStaff:
      category = 'Magical';
      attack = 9;
      description = 'Channels elemental arcane energy into radiant bursts.';
      coinValue = 75;
      break;
    case BlockType.DiamondHelmet:
      category = 'Armor';
      defense = 5;
      maxDurability = 150;
      description = 'Reinforced crystalline helm offering paramount skull defense.';
      coinValue = 90;
      break;
    case BlockType.DiamondChestplate:
      category = 'Armor';
      defense = 8;
      maxDurability = 150;
      description = 'Impenetrable diamond cuirass guarding the bearer’s heart.';
      coinValue = 140;
      break;
    case BlockType.GoldHelmet:
      category = 'Armor';
      defense = 3;
      maxDurability = 40;
      description = 'Ornate golden crown imbued with soft magical shielding.';
      coinValue = 40;
      break;
    case BlockType.GoldChestplate:
      category = 'Armor';
      defense = 5;
      maxDurability = 40;
      description = 'Radiant chestplate worn by royal vanguards.';
      coinValue = 65;
      break;
    case BlockType.IronHelmet:
      category = 'Armor';
      defense = 2;
      maxDurability = 50;
      description = 'Solid iron visor protectively forged against impacts.';
      coinValue = 20;
      break;
    case BlockType.IronChestplate:
      category = 'Armor';
      defense = 4;
      maxDurability = 50;
      description = 'Sturdy plate armor absorbing hostile strikes.';
      coinValue = 35;
      break;
    case BlockType.IronPickaxe:
      category = 'Tool';
      attack = 5;
      miningPower = 3;
      maxDurability = 50;
      description = 'Capable of shattering iron, gold, and diamond ores.';
      coinValue = 18;
      break;
    case BlockType.StonePickaxe:
      category = 'Tool';
      attack = 4;
      miningPower = 2;
      maxDurability = 40;
      description = 'Sturdy pickaxe suitable for harvesting coal and stone.';
      coinValue = 5;
      break;
    case BlockType.WoodPickaxe:
      category = 'Tool';
      attack = 3;
      miningPower = 1;
      maxDurability = 30;
      description = 'Primitive wooden pick for basic excavations.';
      coinValue = 2;
      break;
    case BlockType.IronAxe:
      category = 'Tool';
      attack = 6;
      maxDurability = 50;
      description = 'Sharp woodsman axe tearing through trunks with ease.';
      coinValue = 16;
      break;
    case BlockType.StoneAxe:
      category = 'Tool';
      attack = 4;
      maxDurability = 40;
      description = 'Rough-hewn stone axe for lumber gathering.';
      coinValue = 5;
      break;
    case BlockType.WoodAxe:
      category = 'Tool';
      attack = 3;
      maxDurability = 30;
      description = 'Basic timber axe.';
      coinValue = 2;
      break;
    case BlockType.Apple:
      category = 'Consumable';
      description = 'Crisp orchard fruit. Restores 4 health upon consumption.';
      coinValue = 3;
      break;
    case BlockType.Carrot:
      category = 'Consumable';
      description = 'Nutritious farm vegetable. Restores 3 health.';
      coinValue = 2;
      break;
    case BlockType.BossDrop:
      category = 'Special';
      description = 'Ancient runic heart wrenched from the slumbering Golem.';
      coinValue = 250;
      break;
    case BlockType.BlueCrystal:
      category = 'Magical';
      description = 'Pulsing arcane crystal vibrating with pure mana.';
      coinValue = 45;
      break;
    case BlockType.Diamond:
      category = 'Resource';
      description = 'Flawless gem coveted across kingdoms.';
      coinValue = 40;
      break;
    case BlockType.GoldIngot:
      category = 'Resource';
      description = 'Heavy bar of refined gold.';
      coinValue = 15;
      break;
    case BlockType.IronIngot:
      category = 'Resource';
      description = 'Tempered ingot ready for smithing tools and arms.';
      coinValue = 5;
      break;
    case BlockType.Coal:
      category = 'Resource';
      description = 'Flammable fuel source powering smelting furnaces.';
      coinValue = 2;
      break;
    default:
      coinValue = 1;
      break;
  }

  let durability: { current: number; max: number } | undefined;
  if (maxDurability) {
    durability = {
      current: currentDurability !== undefined ? currentDurability : maxDurability,
      max: maxDurability
    };
  }

  return {
    name,
    category,
    rarity,
    attack,
    defense,
    miningPower,
    durability,
    description,
    coinValue
  };
}

interface ItemTooltipProps {
  slot: { type: BlockType; count: number; durability?: number } | BlockType | null;
  x: number;
  y: number;
  equippedHelmet?: BlockType | null;
  equippedChestplate?: BlockType | null;
  activeWeapon?: BlockType | null;
}

export const ItemTooltip: React.FC<ItemTooltipProps> = ({
  slot,
  x,
  y,
  equippedHelmet,
  equippedChestplate,
  activeWeapon
}) => {
  if (!slot) return null;

  const blockType = typeof slot === 'number' ? slot : slot.type;
  if (!blockType || blockType === BlockType.Air) return null;

  const currentDur = typeof slot === 'object' ? slot.durability : undefined;
  const count = typeof slot === 'object' ? slot.count : 1;
  const info = getItemMetadata(blockType, currentDur);
  const rarityConfig = RARITY_STYLES[info.rarity];

  // Comparisons
  let attackComparison: number | null = null;
  if (info.attack !== undefined && activeWeapon && activeWeapon !== blockType) {
    const equippedInfo = getItemMetadata(activeWeapon);
    if (equippedInfo.attack !== undefined) {
      attackComparison = info.attack - equippedInfo.attack;
    }
  }

  let defenseComparison: number | null = null;
  if (info.defense !== undefined) {
    const isHelmet = blockType === BlockType.IronHelmet || blockType === BlockType.GoldHelmet || blockType === BlockType.DiamondHelmet;
    const isChestplate = blockType === BlockType.IronChestplate || blockType === BlockType.GoldChestplate || blockType === BlockType.DiamondChestplate;
    
    if (isHelmet && equippedHelmet && equippedHelmet !== blockType) {
      const eq = getItemMetadata(equippedHelmet);
      if (eq.defense !== undefined) defenseComparison = info.defense - eq.defense;
    } else if (isChestplate && equippedChestplate && equippedChestplate !== blockType) {
      const eq = getItemMetadata(equippedChestplate);
      if (eq.defense !== undefined) defenseComparison = info.defense - eq.defense;
    }
  }

  // Clamped viewport positioning
  const tooltipWidth = 260;
  const leftPos = Math.min(x + 14, window.innerWidth - tooltipWidth - 16);
  const topPos = Math.min(y + 14, window.innerHeight - 300);

  return (
    <div
      className={`fixed z-[80] pointer-events-none rounded-xl bg-neutral-950/90 backdrop-blur-xl border ${rarityConfig.border} ${rarityConfig.glow} p-3.5 w-[260px] shadow-2xl flex flex-col gap-2.5 transition-opacity duration-150 animate-in fade-in zoom-in-95`}
      style={{ left: leftPos, top: topPos }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2">
        <div>
          <div className="flex items-center gap-1.5">
            <h4 className={`text-sm font-bold tracking-wide ${rarityConfig.text}`}>
              {info.name}
            </h4>
            {count > 1 && (
              <span className="text-xs text-neutral-400 font-mono">x{count}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${rarityConfig.badge}`}>
              {rarityConfig.label}
            </span>
            <span className="text-[10px] text-neutral-400 tracking-wide">
              {info.category}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {(info.attack !== undefined || info.defense !== undefined || info.miningPower !== undefined) && (
        <div className="grid grid-cols-1 gap-1.5 py-0.5 text-xs">
          {info.attack !== undefined && (
            <div className="flex items-center justify-between bg-neutral-900/60 px-2.5 py-1 rounded-md border border-neutral-800">
              <span className="flex items-center gap-1.5 text-neutral-300 font-medium">
                <Swords size={13} className="text-red-400" /> Attack Power
              </span>
              <div className="flex items-center gap-1">
                <span className="font-bold text-white font-mono">{info.attack}</span>
                {attackComparison !== null && (
                  <span className={`text-[11px] font-bold font-mono ${attackComparison >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ({attackComparison >= 0 ? `+${attackComparison}` : attackComparison})
                  </span>
                )}
              </div>
            </div>
          )}

          {info.defense !== undefined && (
            <div className="flex items-center justify-between bg-neutral-900/60 px-2.5 py-1 rounded-md border border-neutral-800">
              <span className="flex items-center gap-1.5 text-neutral-300 font-medium">
                <Shield size={13} className="text-sky-400" /> Defense Rating
              </span>
              <div className="flex items-center gap-1">
                <span className="font-bold text-white font-mono">+{info.defense}</span>
                {defenseComparison !== null && (
                  <span className={`text-[11px] font-bold font-mono ${defenseComparison >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ({defenseComparison >= 0 ? `+${defenseComparison}` : defenseComparison})
                  </span>
                )}
              </div>
            </div>
          )}

          {info.miningPower !== undefined && (
            <div className="flex items-center justify-between bg-neutral-900/60 px-2.5 py-1 rounded-md border border-neutral-800">
              <span className="flex items-center gap-1.5 text-neutral-300 font-medium">
                <Pickaxe size={13} className="text-amber-400" /> Mining Tier
              </span>
              <span className="font-bold text-amber-300 font-mono">Tier {info.miningPower}</span>
            </div>
          )}
        </div>
      )}

      {/* Durability Bar */}
      {info.durability && (
        <div className="flex flex-col gap-1 bg-neutral-900/60 p-2 rounded-md border border-neutral-800">
          <div className="flex justify-between text-[11px]">
            <span className="flex items-center gap-1 text-neutral-400">
              <Wrench size={11} /> Durability
            </span>
            <span className="font-mono text-neutral-300 text-[10px]">
              {info.durability.current} / {info.durability.max}
            </span>
          </div>
          <div className="w-full h-1.5 bg-neutral-950 rounded-full overflow-hidden border border-white/5">
            <div
              className={`h-full transition-all duration-300 ${
                (info.durability.current / info.durability.max) > 0.5
                  ? 'bg-emerald-500'
                  : (info.durability.current / info.durability.max) > 0.25
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${Math.max(4, Math.min(100, (info.durability.current / info.durability.max) * 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* Description */}
      <p className="text-[11px] leading-relaxed text-neutral-400 italic">
        "{info.description}"
      </p>

      {/* Footer / Value */}
      <div className="flex items-center justify-between border-t border-white/10 pt-1.5 text-[10px] text-neutral-400">
        <span className="flex items-center gap-1">
          <Coins size={12} className="text-amber-400" />
          <span className="text-amber-200 font-mono font-bold">{info.coinValue * count}</span> gold value
        </span>
        <span className="text-neutral-500">
          Right-click to interact
        </span>
      </div>
    </div>
  );
};
