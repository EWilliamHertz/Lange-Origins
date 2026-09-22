import { BlockType } from './constants';

export type EnchantmentPrefix = 'Flametouched' | 'Vampiric' | 'Fleetfoot' | 'Vorpal' | 'ArcaneSurge' | 'Fortified';
export type EnchantmentSuffix = 'of the Colossus' | 'of the Archmage' | 'of the Berserker' | 'of Greed';
export type GemType = 'ruby' | 'sapphire' | 'emerald' | 'topaz';

export type CursedAffix = 'Bloodbound' | 'AbyssalPact' | 'GlassSoul' | 'RecklessFury' | 'Netherweight';

export interface EnchantmentData {
  prefix?: EnchantmentPrefix;
  suffix?: EnchantmentSuffix;
  curse?: CursedAffix;
  level: number; // +1 to +10
  bonusDamage?: number;
  bonusDefense?: number;
  bonusSpeed?: number;
  lifesteal?: number;
  burnDot?: number;
  glowColor?: string;
  isCursed?: boolean;
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

export interface CursedAffixMetadata {
  id: CursedAffix;
  name: string;
  title: string;
  description: string;
  positiveEffect: string;
  negativeEffect: string;
  applicableTo: 'weapon' | 'armor' | 'both';
  color: string;
  damageMultiplier?: number;
  staminaDrainPerSwing?: number;
  defenseBonus?: number;
  disableManaRegen?: boolean;
  critBonus?: number;
  maxHealthMultiplier?: number;
  recoilSelfDamage?: number;
  speedMultiplier?: number;
}

export const CURSED_AFFIXES: Record<CursedAffix, CursedAffixMetadata> = {
  Bloodbound: {
    id: 'Bloodbound',
    name: 'Bloodbound',
    title: 'Curse of the Bloodbound',
    description: 'Deals 2.0x DOUBLE damage on all strikes, but drains 15 Stamina with every weapon swing.',
    positiveEffect: '200% Weapon Damage (Double Damage)',
    negativeEffect: 'Drains 15 Stamina on Every Attack Swing',
    applicableTo: 'weapon',
    color: '#e11d48',
    damageMultiplier: 2.0,
    staminaDrainPerSwing: 15
  },
  AbyssalPact: {
    id: 'AbyssalPact',
    name: 'Abyssal Pact',
    title: 'Pact of the Abyssal Void',
    description: 'Provides immense protective warding (+25 Armor & +40% Damage Absorption), but completely freezes passive mana regeneration.',
    positiveEffect: '+25 Defense & Massive Damage Absorption',
    negativeEffect: 'Completely Disables Passive Mana Regeneration',
    applicableTo: 'armor',
    color: '#9333ea',
    defenseBonus: 25,
    disableManaRegen: true
  },
  GlassSoul: {
    id: 'GlassSoul',
    name: 'Glass Soul',
    title: 'Curse of the Fragile Mirror',
    description: 'Increases Critical Strike Chance by +40% and Spell Power by +25, but permanently reduces Maximum Health by 35%.',
    positiveEffect: '+40% Critical Strike Chance & +25 Spell Power',
    negativeEffect: '-35% Maximum Health Penalty',
    applicableTo: 'both',
    color: '#06b6d4',
    critBonus: 0.40,
    maxHealthMultiplier: 0.65
  },
  RecklessFury: {
    id: 'RecklessFury',
    name: 'Reckless Fury',
    title: 'Curse of Reckless Fury',
    description: 'Increases Attack Speed by +50% and adds +12 Flat Damage, but suffers 4 recoil self-damage on every strike.',
    positiveEffect: '+50% Attack Speed & +12 Bonus Damage',
    negativeEffect: 'Deals 4 Recoil Self-Damage on Every Strike',
    applicableTo: 'weapon',
    color: '#ea580c',
    recoilSelfDamage: 4
  },
  Netherweight: {
    id: 'Netherweight',
    name: 'Netherweight',
    title: 'Curse of Netherweight',
    description: 'Grants +30 Armor and complete Knockback Immunity, but reduces movement and sprint speed by 25%.',
    positiveEffect: '+30 Armor & Complete Knockback Immunity',
    negativeEffect: '-25% Movement & Sprint Velocity',
    applicableTo: 'armor',
    color: '#64748b',
    defenseBonus: 30,
    speedMultiplier: 0.75
  }
};

export type GemResonanceId = 
  | 'frostfire' 
  | 'phoenix' 
  | 'molten' 
  | 'tidal' 
  | 'storm' 
  | 'gaia' 
  | 'infernal' 
  | 'glacial' 
  | 'lifebloom' 
  | 'dynamo';

export interface GemResonance {
  id: GemResonanceId;
  name: string;
  tagline: string;
  description: string;
  slashColor: string;
  slashSecondaryColor: string;
  auraColor: string;
  auraType: 'frostfire' | 'phoenix' | 'molten' | 'tidal' | 'storm' | 'gaia' | 'infernal' | 'glacial' | 'lifebloom' | 'dynamo';
  gems: [GemType, GemType];
  damageBonusPercent?: number;
  elementalEffect?: 'frost_burn' | 'chain_lightning' | 'phoenix_mend' | 'molten_burst' | 'tidal_siphon' | 'gaia_barrier';
  auraBonusText: string;
  speedBonus?: number;
  miningSpeedBonus?: number;
  maxHpBonus?: number;
  maxManaBonus?: number;
}

export function getGemResonance(sockets?: SocketedGems | null): GemResonance | null {
  if (!sockets?.slot1 || !sockets?.slot2) return null;
  const pair = [sockets.slot1, sockets.slot2].sort().join('_');

  switch (pair) {
    case 'ruby_sapphire':
      return {
        id: 'frostfire',
        name: 'Frostfire Twilight',
        tagline: 'Elemental Convergence',
        description: '+18% Elemental Damage; attacks ignite foes while inflicting frost slow.',
        slashColor: '#ff3b30',
        slashSecondaryColor: '#38bdf8',
        auraColor: 'rgba(56, 189, 248, 0.4)',
        auraType: 'frostfire',
        gems: ['ruby', 'sapphire'],
        damageBonusPercent: 0.18,
        elementalEffect: 'frost_burn',
        auraBonusText: 'Radiates twin orbiting fire embers & ice crystals that empower spell attacks.'
      };
    case 'emerald_ruby':
      return {
        id: 'phoenix',
        name: 'Phoenix Vitality',
        tagline: 'Eternal Rebirth',
        description: '+25 Max Health; strikes have a chance to burst into radiant phoenix healing flames.',
        slashColor: '#fbbf24',
        slashSecondaryColor: '#ef4444',
        auraColor: 'rgba(251, 191, 36, 0.4)',
        auraType: 'phoenix',
        gems: ['ruby', 'emerald'],
        maxHpBonus: 25,
        elementalEffect: 'phoenix_mend',
        auraBonusText: 'Sunburst halo that pulses healing warmth when below 40% health.'
      };
    case 'ruby_topaz':
      return {
        id: 'molten',
        name: 'Molten Core',
        tagline: 'Volcanic Fury',
        description: '+35% Mining Speed & +12 Explosive Melee Impact damage on hit.',
        slashColor: '#f97316',
        slashSecondaryColor: '#eab308',
        auraColor: 'rgba(249, 115, 22, 0.4)',
        auraType: 'molten',
        gems: ['ruby', 'topaz'],
        miningSpeedBonus: 0.35,
        elementalEffect: 'molten_burst',
        auraBonusText: 'Fiery magma tremor aura creating explosive cracks on striking blocks or foes.'
      };
    case 'emerald_sapphire':
      return {
        id: 'tidal',
        name: 'Tidal Serenity',
        tagline: 'Abyssal Spring',
        description: '+35 Max Mana; melee and magical strikes siphon +4 Mana back to the caster.',
        slashColor: '#06b6d4',
        slashSecondaryColor: '#3b82f6',
        auraColor: 'rgba(6, 182, 212, 0.4)',
        auraType: 'tidal',
        gems: ['sapphire', 'emerald'],
        maxManaBonus: 35,
        elementalEffect: 'tidal_siphon',
        auraBonusText: 'Cascading aqua ripple rings that continuously refresh the caster\'s mind.'
      };
    case 'sapphire_topaz':
      return {
        id: 'storm',
        name: 'Storm Tempest',
        tagline: 'Thunderlord Conduit',
        description: '+18% Movement Speed; 30% chance on strike to discharge 8 Chain Lightning damage.',
        slashColor: '#a855f7',
        slashSecondaryColor: '#38bdf8',
        auraColor: 'rgba(168, 85, 247, 0.4)',
        auraType: 'storm',
        gems: ['sapphire', 'topaz'],
        speedBonus: 0.18,
        elementalEffect: 'chain_lightning',
        auraBonusText: 'Dancing electric lightning barrier that shocks enemies who step too close.'
      };
    case 'emerald_topaz':
      return {
        id: 'gaia',
        name: "Gaia's Bastion",
        tagline: 'Earth Warden',
        description: '+15% Physical Resistance & +30% Faster Stamina Recovery rate.',
        slashColor: '#10b981',
        slashSecondaryColor: '#f59e0b',
        auraColor: 'rgba(16, 185, 129, 0.4)',
        auraType: 'gaia',
        gems: ['emerald', 'topaz'],
        elementalEffect: 'gaia_barrier',
        auraBonusText: 'Rotating crystalline jade shields that deflect incoming blows.'
      };
    case 'ruby_ruby':
      return {
        id: 'infernal',
        name: 'Infernal Cataclysm',
        tagline: 'Dual Flame Surge',
        description: '+20% Critical Strike Chance & +15 Continuous Fire Damage.',
        slashColor: '#b91c1c',
        slashSecondaryColor: '#ff6b6b',
        auraColor: 'rgba(185, 28, 28, 0.45)',
        auraType: 'infernal',
        gems: ['ruby', 'ruby'],
        damageBonusPercent: 0.20,
        auraBonusText: 'Roaring crimson hellfire aura burning everything in its wake.'
      };
    case 'sapphire_sapphire':
      return {
        id: 'glacial',
        name: 'Glacial Absolute',
        tagline: 'Absolute Zero',
        description: '+50 Max Mana; creates a frost mist that chills and slows nearby opponents.',
        slashColor: '#0284c7',
        slashSecondaryColor: '#bae6fd',
        auraColor: 'rgba(2, 132, 199, 0.45)',
        auraType: 'glacial',
        gems: ['sapphire', 'sapphire'],
        maxManaBonus: 50,
        auraBonusText: 'Blizzard frost halo with hovering ice crystals.'
      };
    case 'emerald_emerald':
      return {
        id: 'lifebloom',
        name: 'Primal Lifebloom',
        tagline: 'Font of Vitality',
        description: '+50 Max Health & +2 HP/sec Continuous Passive Regeneration.',
        slashColor: '#059669',
        slashSecondaryColor: '#6ee7b7',
        auraColor: 'rgba(5, 150, 105, 0.45)',
        auraType: 'lifebloom',
        gems: ['emerald', 'emerald'],
        maxHpBonus: 50,
        auraBonusText: 'Swirling emerald leaves and blossom petals that constantly rejuvenate flesh.'
      };
    case 'topaz_topaz':
      return {
        id: 'dynamo',
        name: 'Hypercharged Dynamo',
        tagline: 'Kinetic Overload',
        description: '+45% Attack & Mining Speed with relentless kinetic surge.',
        slashColor: '#d97706',
        slashSecondaryColor: '#fde047',
        auraColor: 'rgba(217, 119, 6, 0.45)',
        auraType: 'dynamo',
        gems: ['topaz', 'topaz'],
        speedBonus: 0.20,
        miningSpeedBonus: 0.45,
        auraBonusText: 'High-voltage electric sparks crackling around all movement and strikes.'
      };
    default:
      return null;
  }
}

export function getCursedAffixCost(curse: CursedAffix): {
  gold: number;
  dust: number;
  materials: { type: BlockType; count: number }[];
} {
  return {
    gold: 3,
    dust: 5,
    materials: [
      { type: BlockType.ArcaneDust, count: 5 },
      { type: BlockType.GoldIngot, count: 3 },
      { type: BlockType.SlimeCore, count: 1 }
    ]
  };
}

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
