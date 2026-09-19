import { BlockType } from './constants';

export interface ArmorSetBonus {
  id: string;
  name: string;
  description: string;
  requiredPieces: number;
  perks: string[];
  bonusDefense?: number;
  bonusMaxHp?: number;
  knockbackResistancePct?: number;
  cooldownReductionPct?: number;
  goldMultiplierPct?: number;
}

export interface ArmorSetDefinition {
  id: string;
  name: string;
  items: number[];
  bonuses: ArmorSetBonus[];
}

export const ARMOR_SETS: ArmorSetDefinition[] = [
  {
    id: 'iron_bastion',
    name: 'Iron Bastion',
    items: [BlockType.IronHelmet, BlockType.IronChestplate],
    bonuses: [
      {
        id: 'iron_2pc',
        name: 'Bastion Fortitude',
        description: 'Hardened iron plates blunt concussive blows and protect vital organs.',
        requiredPieces: 2,
        perks: ['+4 Bonus Armor', '+15% Knockback Resistance'],
        bonusDefense: 4,
        knockbackResistancePct: 15,
      },
    ],
  },
  {
    id: 'midas_greed',
    name: 'Midas Greed',
    items: [BlockType.GoldHelmet, BlockType.GoldChestplate],
    bonuses: [
      {
        id: 'gold_2pc',
        name: 'Gilded Fortune',
        description: 'Ornate gold armor attracts treasure and accelerates movement.',
        requiredPieces: 2,
        perks: ['+25% Gold Coin Drops', '+10% Movement Speed'],
        goldMultiplierPct: 25,
      },
    ],
  },
  {
    id: 'diamond_aegis',
    name: 'Diamond Aegis',
    items: [BlockType.DiamondHelmet, BlockType.DiamondChestplate],
    bonuses: [
      {
        id: 'diamond_2pc',
        name: 'Crystalline Ward',
        description: 'Pure diamond lattice radiates arcane energy and bolsters vital constitution.',
        requiredPieces: 2,
        perks: ['+20 Max Health', '-20% Ability Cooldowns'],
        bonusMaxHp: 20,
        cooldownReductionPct: 20,
      },
    ],
  },
];

export interface ActiveSetInfo {
  set: ArmorSetDefinition;
  equippedCount: number;
  totalPieces: number;
  activeBonuses: ArmorSetBonus[];
  isComplete: boolean;
}

export function getArmorSetInfo(equipment: any[]): ActiveSetInfo[] {
  if (!Array.isArray(equipment)) return [];
  const equippedTypes = new Set(
    equipment
      .map((slot) => (slot && typeof slot.type === 'number' ? slot.type : null))
      .filter((t): t is number => t !== null)
  );

  const results: ActiveSetInfo[] = [];

  for (const setDef of ARMOR_SETS) {
    let count = 0;
    for (const itemType of setDef.items) {
      if (equippedTypes.has(itemType)) count++;
    }
    if (count > 0) {
      const activeBonuses = setDef.bonuses.filter((b) => count >= b.requiredPieces);
      results.push({
        set: setDef,
        equippedCount: count,
        totalPieces: setDef.items.length,
        activeBonuses,
        isComplete: count >= setDef.items.length,
      });
    }
  }

  return results;
}

export function getSetForPiece(type: number): ArmorSetDefinition | undefined {
  return ARMOR_SETS.find((s) => s.items.includes(type));
}
