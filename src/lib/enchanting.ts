import { BlockType } from './constants';

export type EnchantmentPrefix = 'Flametouched' | 'Vampiric' | 'Fleetfoot' | 'Vorpal' | 'ArcaneSurge' | 'Fortified';
export type EnchantmentSuffix = 'of the Colossus' | 'of the Archmage' | 'of the Berserker' | 'of Greed';
export type GemType = 'ruby' | 'sapphire' | 'emerald' | 'topaz';

export interface EnchantmentData {
  prefix?: EnchantmentPrefix;
  suffix?: EnchantmentSuffix;
  level: number; // +1 to +10
  bonusDamage?: number;
  bonusDefense?: number;
  bonusSpeed?: number;
  lifesteal?: number;
  burnDot?: number;
  glowColor?: string;
}

export interface SocketedGems {
  slot1?: GemType | null;
  slot2?: GemType | null;
}

export interface PrefixMetadata {
  id: EnchantmentPrefix;
  name: string;
  description: string;
  color: string;
  applicableTo: 'weapon' | 'armor' | 'both';
  baseDamage?: number;
  baseDefense?: number;
  baseSpeed?: number;
  burnDot?: number;
  lifesteal?: number;
}

export const PREFIXES: Record<EnchantmentPrefix, PrefixMetadata> = {
  Flametouched: {
    id: 'Flametouched',
    name: 'Flametouched',
    description: 'Strikes ignite foes with blazing damage over time. Emits fiery flame embers.',
    color: '#f97316',
    applicableTo: 'weapon',
    burnDot: 4,
    baseDamage: 3
  },
  Vampiric: {
    id: 'Vampiric',
    name: 'Vampiric',
    description: 'Siphons 12% of damage dealt back as direct healing. Emits shadow soul aura.',
    color: '#c084fc',
    applicableTo: 'weapon',
    lifesteal: 0.12,
    baseDamage: 2
  },
  Fleetfoot: {
    id: 'Fleetfoot',
    name: 'Fleetfoot',
    description: 'Bestows +15% enhanced movement and sprint velocity. Emits light wind motes.',
    color: '#38bdf8',
    applicableTo: 'armor',
    baseSpeed: 1.15
  },
  Vorpal: {
    id: 'Vorpal',
    name: 'Vorpal',
    description: 'Sharpens strikes for +10% Critical Strike chance with burst damage.',
    color: '#eab308',
    applicableTo: 'weapon',
    baseDamage: 5
  },
  ArcaneSurge: {
    id: 'ArcaneSurge',
    name: 'Arcane Surge',
    description: 'Infuses mystical essence: +25 Max Mana and rapid mana regeneration.',
    color: '#818cf8',
    applicableTo: 'both',
    baseDamage: 3,
    baseDefense: 2
  },
  Fortified: {
    id: 'Fortified',
    name: 'Fortified',
    description: 'Reinforces plating with heavy warding: +6 bonus Armor and damage absorption.',
    color: '#34d399',
    applicableTo: 'armor',
    baseDefense: 6
  }
};

export interface GemMetadata {
  type: GemType;
  name: string;
  color: string;
  iconBg: string;
  blockType: BlockType;
  description: string;
  bonusCrit?: number;
  bonusMana?: number;
  bonusSpellPower?: number;
  bonusHealth?: number;
  bonusRegen?: number;
  bonusMiningSpeed?: number;
  bonusOreChance?: number;
}

export const GEMS: Record<GemType, GemMetadata> = {
  ruby: {
    type: 'ruby',
    name: 'Cut Ruby',
    color: '#ef4444',
    iconBg: 'bg-red-950/70 border-red-500/50 text-red-400',
    blockType: BlockType.Ruby,
    description: '+5% Critical Strike Chance',
    bonusCrit: 0.05
  },
  sapphire: {
    type: 'sapphire',
    name: 'Cut Sapphire',
    color: '#3b82f6',
    iconBg: 'bg-blue-950/70 border-blue-500/50 text-blue-400',
    blockType: BlockType.Sapphire,
    description: '+25 Max Mana & +4 Spell Power',
    bonusMana: 25,
    bonusSpellPower: 4
  },
  emerald: {
    type: 'emerald',
    name: 'Cut Emerald',
    color: '#10b981',
    iconBg: 'bg-emerald-950/70 border-emerald-500/50 text-emerald-400',
    blockType: BlockType.Emerald,
    description: '+30 Max Health & +1 HP/sec Regen',
    bonusHealth: 30,
    bonusRegen: 1
  },
  topaz: {
    type: 'topaz',
    name: 'Cut Topaz',
    color: '#f59e0b',
    iconBg: 'bg-amber-950/70 border-amber-500/50 text-amber-400',
    blockType: BlockType.Topaz,
    description: '+25% Mining Speed & +15% Rare Ore Drops',
    bonusMiningSpeed: 0.25,
    bonusOreChance: 0.15
  }
};

export function isWeapon(type: BlockType): boolean {
  return (
    type === BlockType.WoodSword ||
    type === BlockType.StoneSword ||
    type === BlockType.IronSword ||
    type === BlockType.GoldSword ||
    type === BlockType.DiamondSword ||
    type === BlockType.Bow ||
    type === BlockType.Gun ||
    type === BlockType.MagicStaff ||
    type === BlockType.WizardStaff
  );
}

export function isArmor(type: BlockType): boolean {
  return (
    type === BlockType.IronHelmet ||
    type === BlockType.IronChestplate ||
    type === BlockType.GoldHelmet ||
    type === BlockType.GoldChestplate ||
    type === BlockType.DiamondHelmet ||
    type === BlockType.DiamondChestplate
  );
}

export function isTool(type: BlockType): boolean {
  return (
    type === BlockType.WoodPickaxe ||
    type === BlockType.StonePickaxe ||
    type === BlockType.IronPickaxe ||
    type === BlockType.WoodAxe ||
    type === BlockType.StoneAxe ||
    type === BlockType.IronAxe ||
    type === BlockType.WoodHoe ||
    type === BlockType.StoneHoe ||
    type === BlockType.IronHoe
  );
}

export function canEnchant(type: BlockType): boolean {
  return isWeapon(type) || isArmor(type) || isTool(type);
}

export function getEnchantCost(
  currentLevel: number,
  prefix?: EnchantmentPrefix
): {
  gold: number;
  dust: number;
  materialType?: BlockType;
  materialCount?: number;
  materials: { type: BlockType; count: number }[];
} {
  const nextLevel = Math.max(1, currentLevel);
  const gold = nextLevel * 2;
  const dust = Math.max(1, Math.floor(nextLevel * 1.5));

  const materials: { type: BlockType; count: number }[] = [
    { type: BlockType.ArcaneDust, count: dust }
  ];

  let materialType: BlockType | undefined;
  let materialCount: number | undefined;

  if (nextLevel >= 5) {
    materialType = BlockType.GolemShard;
    materialCount = 1;
    materials.push({ type: BlockType.GolemShard, count: 1 });
  } else if (nextLevel >= 3) {
    materialType = BlockType.SlimeCore;
    materialCount = 2;
    materials.push({ type: BlockType.SlimeCore, count: 2 });
  }

  return { gold, dust, materialType, materialCount, materials };
}

export function getDismantleYield(type: BlockType, durability?: number): { type: BlockType; count: number }[] {
  switch (type) {
    case BlockType.WoodSword:
    case BlockType.WoodPickaxe:
    case BlockType.WoodAxe:
      return [
        { type: BlockType.Planks, count: 2 },
        { type: BlockType.ArcaneDust, count: 1 }
      ];
    case BlockType.StoneSword:
    case BlockType.StonePickaxe:
    case BlockType.StoneAxe:
      return [
        { type: BlockType.Stone, count: 3 },
        { type: BlockType.ArcaneDust, count: 1 }
      ];
    case BlockType.IronSword:
    case BlockType.IronPickaxe:
    case BlockType.IronAxe:
      return [
        { type: BlockType.IronIngot, count: 2 },
        { type: BlockType.ArcaneDust, count: 2 }
      ];
    case BlockType.IronHelmet:
      return [
        { type: BlockType.IronIngot, count: 3 },
        { type: BlockType.ArcaneDust, count: 3 }
      ];
    case BlockType.IronChestplate:
      return [
        { type: BlockType.IronIngot, count: 5 },
        { type: BlockType.ArcaneDust, count: 4 }
      ];
    case BlockType.GoldSword:
      return [
        { type: BlockType.GoldIngot, count: 2 },
        { type: BlockType.ArcaneDust, count: 3 }
      ];
    case BlockType.GoldHelmet:
      return [
        { type: BlockType.GoldIngot, count: 3 },
        { type: BlockType.ArcaneDust, count: 4 }
      ];
    case BlockType.GoldChestplate:
      return [
        { type: BlockType.GoldIngot, count: 5 },
        { type: BlockType.ArcaneDust, count: 5 }
      ];
    case BlockType.DiamondSword:
      return [
        { type: BlockType.Diamond, count: 2 },
        { type: BlockType.ArcaneDust, count: 6 }
      ];
    case BlockType.DiamondHelmet:
      return [
        { type: BlockType.Diamond, count: 3 },
        { type: BlockType.ArcaneDust, count: 7 }
      ];
    case BlockType.DiamondChestplate:
      return [
        { type: BlockType.Diamond, count: 5 },
        { type: BlockType.ArcaneDust, count: 8 }
      ];
    case BlockType.Bow:
      return [
        { type: BlockType.Wood, count: 3 },
        { type: BlockType.ArcaneDust, count: 2 }
      ];
    case BlockType.Gun:
      return [
        { type: BlockType.IronIngot, count: 4 },
        { type: BlockType.ArcaneDust, count: 4 }
      ];
    case BlockType.MagicStaff:
    case BlockType.WizardStaff:
      return [
        { type: BlockType.Diamond, count: 1 },
        { type: BlockType.ArcaneDust, count: 6 }
      ];
    default:
      if (canEnchant(type)) {
        return [{ type: BlockType.ArcaneDust, count: 1 }];
      }
      return [];
  }
}
