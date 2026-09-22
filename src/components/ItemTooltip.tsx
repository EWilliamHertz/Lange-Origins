import React from 'react';
import { BlockType, BlockNames } from '../lib/constants';
import { Shield, Swords, Pickaxe, Sparkles, Coins, Zap, Heart, Wrench, Layers, Gem, Skull, AlertTriangle, Flame } from 'lucide-react';
import { getSetForPiece } from '../lib/armorSets';
import { PREFIXES, GEMS, CURSED_AFFIXES, getGemResonance, type EnchantmentData, type SocketedGems, type CursedAffix } from '../lib/enchanting';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface ItemInfo {
  name: string;
  category: 'Weapon' | 'Armor' | 'Tool' | 'Consumable' | 'Resource' | 'Magical' | 'Mechanism' | 'Special' | 'Station' | 'Transportation' | 'Mount' | 'Ingredient' | 'Buff Meal';
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
    type === BlockType.Arrow ||
    type === BlockType.CookedMeat ||
    type === BlockType.WildSpice
  ) return 'uncommon';
  if (
    type === BlockType.HeartyStew ||
    type === BlockType.ArcaneBroth ||
    type === BlockType.HuntersRoast ||
    type === BlockType.IronhideGoulash ||
    type === BlockType.Minecart ||
    type === BlockType.WolfSaddle ||
    type === BlockType.Campfire
  ) return 'rare';
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
    case BlockType.Campfire:
      category = 'Station';
      description = 'A crackling stone hearth. Place down and right-click to cook nourishing meals, stews, and broths.';
      coinValue = 8;
      break;
    case BlockType.MinecartTrack:
      category = 'Transportation';
      description = 'Steel railway line. Lay tracks underground or across plains to ride minecarts at tremendous speed.';
      coinValue = 2;
      break;
    case BlockType.Minecart:
      category = 'Transportation';
      description = 'Sturdy iron transit cart. Place on Minecart Tracks and right-click to ride smoothly across tunnels.';
      coinValue = 25;
      break;
    case BlockType.WolfSaddle:
      category = 'Mount';
      description = 'Reinforced beast saddle. Feed wild wolves to tame them, then press [F] or right-click to mount and gallop.';
      coinValue = 20;
      break;
    case BlockType.WildSpice:
      category = 'Ingredient';
      description = 'Crushed aromatic mountain herbs and dried chili. Key seasoning for campfire recipes.';
      coinValue = 4;
      break;
    case BlockType.RawMeat:
      category = 'Ingredient';
      description = 'Raw meat from hunted fauna. Combine with crops and spice at a campfire to cook nourishing dishes.';
      coinValue = 3;
      break;
    case BlockType.CookedMeat:
      category = 'Consumable';
      description = 'Seared steak grilled over embers. Restores 12 health and 40 stamina.';
      coinValue = 6;
      break;
    case BlockType.HeartyStew:
      category = 'Buff Meal';
      description = 'Simmered carrot, savory meat, and wild spice. Restores full HP and grants +40 Max HP for 5 minutes!';
      coinValue = 20;
      break;
    case BlockType.ArcaneBroth:
      category = 'Buff Meal';
      description = 'Shimmering mystic broth. Restores mana and grants Doubled Mana Regeneration (2x) for 5 minutes!';
      coinValue = 25;
      break;
    case BlockType.HuntersRoast:
      category = 'Buff Meal';
      description = 'Seasoned hunter roast. Grants +35% Movement Speed and reduced sprint stamina drain for 5 minutes!';
      coinValue = 22;
      break;
    case BlockType.IronhideGoulash:
      category = 'Buff Meal';
      description = 'Iron-infused thick goulash. Hardens skin to grant +30% Damage Resistance for 5 minutes!';
      coinValue = 24;
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
  slot: {
    type: BlockType;
    count: number;
    durability?: number;
    enchantment?: EnchantmentData;
    sockets?: SocketedGems;
  } | BlockType | null;
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
  const enchantment = typeof slot === 'object' ? slot.enchantment : undefined;
  const sockets = typeof slot === 'object' ? slot.sockets : undefined;
  const curse: CursedAffix | undefined = enchantment?.curse || (typeof slot === 'object' ? (slot as any).curse : undefined);
  const effectiveSockets: SocketedGems = {
    slot1: sockets?.slot1 || (typeof slot === 'object' ? (slot as any).gem1 : null),
    slot2: sockets?.slot2 || (typeof slot === 'object' ? (slot as any).gem2 : null),
  };
  const resonance = getGemResonance(effectiveSockets);
  const cursedInfo = curse ? CURSED_AFFIXES[curse] : null;
  const info = getItemMetadata(blockType, currentDur);
  const rarityConfig = RARITY_STYLES[info.rarity];

  // Comparisons
  let attackComparison: number | null = null;
  let equippedWeaponName: string | null = null;
  if (info.attack !== undefined && activeWeapon && activeWeapon !== blockType) {
    const equippedInfo = getItemMetadata(activeWeapon);
    equippedWeaponName = equippedInfo.name;
    if (equippedInfo.attack !== undefined) {
      attackComparison = info.attack - equippedInfo.attack;
    }
  }

  let defenseComparison: number | null = null;
  let equippedArmorName: string | null = null;
  if (info.defense !== undefined) {
    const isHelmet = blockType === BlockType.IronHelmet || blockType === BlockType.GoldHelmet || blockType === BlockType.DiamondHelmet;
    const isChestplate = blockType === BlockType.IronChestplate || blockType === BlockType.GoldChestplate || blockType === BlockType.DiamondChestplate;
    
    if (isHelmet && equippedHelmet && equippedHelmet !== blockType) {
      const eq = getItemMetadata(equippedHelmet);
      equippedArmorName = eq.name;
      if (eq.defense !== undefined) defenseComparison = info.defense - eq.defense;
    } else if (isChestplate && equippedChestplate && equippedChestplate !== blockType) {
      const eq = getItemMetadata(equippedChestplate);
      equippedArmorName = eq.name;
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
            {enchantment && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                +{enchantment.level}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Cursed Affix Banner */}
      {cursedInfo && (
        <div className="rounded-lg p-2 bg-gradient-to-r from-red-950/80 via-rose-950/50 to-neutral-950 border border-red-500/70 shadow-[0_0_12px_rgba(225,29,72,0.35)] text-[11px] flex flex-col gap-1.5">
          <div className="flex items-center justify-between border-b border-red-500/30 pb-1">
            <span className="font-bold flex items-center gap-1.5 text-rose-300">
              <Skull size={13} className="text-rose-500 animate-pulse" />
              {cursedInfo.title}
            </span>
            <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 bg-red-500/20 text-red-300 rounded border border-red-500/40">
              Cursed
            </span>
          </div>
          <p className="text-[10px] text-neutral-300 leading-tight">
            {cursedInfo.description}
          </p>
          <div className="flex flex-col gap-1 font-mono text-[10px] pt-0.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-500/30">
              <span>✦</span>
              <span>{cursedInfo.positiveEffect}</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-400 font-bold bg-red-950/50 px-1.5 py-0.5 rounded border border-red-500/30">
              <AlertTriangle size={11} className="text-rose-400 shrink-0" />
              <span>{cursedInfo.negativeEffect}</span>
            </div>
          </div>
        </div>
      )}

      {/* Enchantment Details Banner */}
      {enchantment && (
        <div className="rounded-lg p-2 bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-neutral-900 border border-amber-500/40 text-[11px] flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1 text-amber-300">
              <Sparkles size={12} className="text-amber-400" />
              {enchantment.prefix || 'Enchanted'} {enchantment.suffix || ''} (+{enchantment.level})
            </span>
            <span className="text-[10px] uppercase font-mono px-1 bg-amber-500/20 text-amber-200 rounded">
              Tier {enchantment.level}
            </span>
          </div>
          {enchantment.prefix && PREFIXES[enchantment.prefix] && (
            <p className="text-[10px] text-neutral-300 italic">
              {PREFIXES[enchantment.prefix].description}
            </p>
          )}
          <div className="flex flex-wrap gap-2 text-[10px] font-mono text-amber-200 mt-0.5">
            {enchantment.bonusDamage && <span>+{enchantment.bonusDamage} Atk</span>}
            {enchantment.bonusDefense && <span>+{enchantment.bonusDefense} Def</span>}
            {enchantment.burnDot && <span className="text-orange-300">🔥 Burn DoT</span>}
            {enchantment.lifesteal && <span className="text-purple-300">🩸 Lifesteal</span>}
            {enchantment.bonusSpeed && <span className="text-sky-300">⚡ +15% Speed</span>}
          </div>
        </div>
      )}

      {/* Socketed Gems Section */}
      {(sockets?.slot1 || sockets?.slot2 || blockType === BlockType.DiamondSword || blockType === BlockType.DiamondChestplate || blockType === BlockType.GoldChestplate) && (
        <div className="bg-neutral-900/70 p-2 rounded-lg border border-white/10 text-[11px] flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-neutral-400 text-[10px] font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1"><Gem size={11} className="text-purple-400" /> Gem Sockets</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[1, 2].map((slotIdx) => {
              const gemKey = slotIdx === 1 ? effectiveSockets.slot1 : effectiveSockets.slot2;
              const gem = gemKey ? GEMS[gemKey] : null;
              return (
                <div
                  key={slotIdx}
                  className={`p-1.5 rounded border text-[10px] flex items-center gap-1.5 ${
                    gem ? gem.iconBg : 'bg-neutral-950/60 border-dashed border-neutral-700 text-neutral-500'
                  }`}
                >
                  <Gem size={11} className={gem ? 'animate-pulse' : 'text-neutral-600'} />
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-bold truncate">{gem ? gem.name : `Empty Slot ${slotIdx}`}</span>
                    {gem && <span className="text-[9px] opacity-80 truncate">{gem.description}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gem Resonance Set Bonus */}
          {resonance && (
            <div className="mt-1 rounded-lg p-2 bg-gradient-to-r from-purple-950/60 via-indigo-950/50 to-neutral-900 border border-indigo-400/50 shadow-[0_0_15px_rgba(99,102,241,0.25)] flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] flex items-center gap-1.5 text-indigo-300">
                  <Sparkles size={12} className="text-amber-400 animate-spin" />
                  ✦ {resonance.name}
                </span>
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
                  Resonance
                </span>
              </div>
              <div className="text-[9px] text-amber-300/90 italic">
                "{resonance.tagline}"
              </div>
              <p className="text-[10px] text-neutral-200 font-medium leading-tight">
                {resonance.description}
              </p>
              <div className="text-[9px] text-sky-300/80 bg-neutral-950/50 p-1 rounded border border-white/5">
                <span className="font-semibold text-white/90">Aura: </span>
                {resonance.auraBonusText}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-[9px] font-mono text-neutral-400">
                <span>Slash FX:</span>
                <span className="w-2.5 h-2.5 rounded-full inline-block border border-white/30" style={{ backgroundColor: resonance.slashColor }} />
                <span className="w-2.5 h-2.5 rounded-full inline-block border border-white/30" style={{ backgroundColor: resonance.slashSecondaryColor }} />
              </div>
            </div>
          )}
        </div>
      )}

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

      {/* Quick-Equip Comparison Badge */}
      {(attackComparison !== null || defenseComparison !== null) && (
        <div className="bg-neutral-900/80 p-2.5 rounded-lg border border-amber-500/40 flex flex-col gap-1.5 text-[11px] shadow-lg">
          <div className="flex items-center justify-between text-amber-400 font-bold">
            <span className="flex items-center gap-1"><Zap size={13} className="text-amber-400" /> Comparison vs. Equipped</span>
            <span className="text-[10px] text-neutral-400 font-normal truncate max-w-[110px]">
              {equippedArmorName || equippedWeaponName || 'Equipped'}
            </span>
          </div>
          <div className="flex items-center justify-between bg-black/40 p-1.5 rounded border border-white/5 font-mono">
            {attackComparison !== null && (
              <span className={`font-bold text-xs ${attackComparison >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ATK: {attackComparison >= 0 ? `+${attackComparison}` : attackComparison} Power
              </span>
            )}
            {defenseComparison !== null && (
              <span className={`font-bold text-xs ${defenseComparison >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                DEF: {defenseComparison >= 0 ? `+${defenseComparison}` : defenseComparison} Armor
              </span>
            )}
          </div>
        </div>
      )}

      {/* Armor Set Bonus Preview */}
      {(() => {
        const armorSet = getSetForPiece(blockType);
        if (!armorSet) return null;
        const matchingPiecesEquipped = [equippedHelmet, equippedChestplate].filter(
          (piece) => piece && armorSet.items.includes(piece)
        ).length;
        return (
          <div className="bg-neutral-900/70 p-2 rounded-lg border border-cyan-500/30 flex flex-col gap-1 text-[11px]">
            <div className="flex items-center justify-between text-cyan-300 font-bold">
              <span className="flex items-center gap-1"><Layers size={12} /> Set: {armorSet.name}</span>
              <span className="font-mono text-[10px] text-cyan-200">({matchingPiecesEquipped}/{armorSet.items.length})</span>
            </div>
            {armorSet.bonuses.map((b) => (
              <div key={b.id} className="text-[10px] text-neutral-300">
                <span className={matchingPiecesEquipped >= b.requiredPieces ? 'text-emerald-400 font-bold' : 'text-neutral-500'}>
                  ({b.requiredPieces} Pc) {b.perks.join(', ')}
                </span>
              </div>
            ))}
          </div>
        );
      })()}

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
