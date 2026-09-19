export interface TalentTier {
  id: string;
  name: string;
  description: string;
  icon: string;
  maxRank: number;
  bonusPerRank: string;
}

export interface CapstonePassive {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface TalentSpecialization {
  id: string;
  name: string;
  role: string;
  description: string;
  icon: string;
  accentColor: string;
  tiers: TalentTier[];
  capstone: CapstonePassive;
}

export interface ClassTalentTree {
  playerClass: 'warrior' | 'mage' | 'archer';
  specs: [TalentSpecialization, TalentSpecialization];
}

export const CLASS_TALENT_TREES: Record<string, ClassTalentTree> = {
  warrior: {
    playerClass: 'warrior',
    specs: [
      {
        id: 'berserker',
        name: 'Berserker',
        role: 'Furious DPS',
        description: 'Channels raw combat fury to strike faster and execute wounded foes.',
        icon: '⚔️',
        accentColor: '#EF4444',
        tiers: [
          {
            id: 'blood_rage',
            name: 'Blood Rage',
            description: 'Increases melee attack speed and physical weapon damage.',
            icon: '🩸',
            maxRank: 3,
            bonusPerRank: '+6% Melee Weapon Damage per rank',
          },
          {
            id: 'execute',
            name: 'Execute',
            description: 'Deals catastrophic damage to low health targets.',
            icon: '⚡',
            maxRank: 3,
            bonusPerRank: '+15% Damage against targets below 35% HP',
          },
        ],
        capstone: {
          id: 'rampage',
          name: 'Rampage',
          description: 'Slaying any enemy immediately restores 10 HP and grants +25% sprint speed for 4 seconds.',
          icon: '🔥',
        },
      },
      {
        id: 'guardian',
        name: 'Guardian',
        role: 'Impenetrable Tank',
        description: 'Masters the arts of defensive stances, damage mitigation, and sustained resilience.',
        icon: '🛡️',
        accentColor: '#3B82F6',
        tiers: [
          {
            id: 'iron_bulwark',
            name: 'Iron Bulwark',
            description: 'Hardens skin and armor against blunt impacts.',
            icon: '🪨',
            maxRank: 3,
            bonusPerRank: '+4 Flat Armor and +10% Knockback Resistance',
          },
          {
            id: 'second_wind',
            name: 'Second Wind',
            description: 'Continuously mends wounds when battle turns dire.',
            icon: '💖',
            maxRank: 3,
            bonusPerRank: 'Regenerates +1 HP every 2 seconds when under 50% HP',
          },
        ],
        capstone: {
          id: 'shield_wall',
          name: 'Shield Wall',
          description: 'Incoming critical or lethal strikes are dampened by 35% and you cannot be stunned.',
          icon: '🏰',
        },
      },
    ],
  },
  mage: {
    playerClass: 'mage',
    specs: [
      {
        id: 'pyromancer',
        name: 'Pyromancer',
        role: 'Burst Destruction',
        description: 'Commands searing flames to incinerate clusters of enemies.',
        icon: '🔥',
        accentColor: '#F97316',
        tiers: [
          {
            id: 'ignite',
            name: 'Ignite',
            description: 'Fire spells scorch targets with persistent burning embers.',
            icon: '🌋',
            maxRank: 3,
            bonusPerRank: 'Burn deals +4 damage over 3s per rank',
          },
          {
            id: 'combustion',
            name: 'Combustion',
            description: 'Expands blast wave radii and spell critical hit chance.',
            icon: '💥',
            maxRank: 3,
            bonusPerRank: '+15% Fireball splash radius and +8% spell crit',
          },
        ],
        capstone: {
          id: 'phoenix_rebirth',
          name: 'Phoenix Flame',
          description: 'Upon suffering a lethal blow, detonates a fiery nova knocking all foes away and heals for 30 HP (90s cooldown).',
          icon: '🦅',
        },
      },
      {
        id: 'frost_weaver',
        name: 'Frost Weaver',
        role: 'Control & Ward',
        description: 'Chills foes to the bone while shielding allies in impenetrable ice.',
        icon: '❄️',
        accentColor: '#06B6D4',
        tiers: [
          {
            id: 'chilling_touch',
            name: 'Chilling Touch',
            description: 'Frost spells slow enemy movement and attack velocity.',
            icon: '🧊',
            maxRank: 3,
            bonusPerRank: 'Slows enemy movement by 15% per rank',
          },
          {
            id: 'glacial_barrier',
            name: 'Glacial Barrier',
            description: 'Surrounds the caster in crystalline frost armor.',
            icon: '💠',
            maxRank: 3,
            bonusPerRank: 'Gain a frost shield absorbing up to 20 damage',
          },
        ],
        capstone: {
          id: 'deep_freeze',
          name: 'Deep Freeze',
          description: 'Frost spells have a 25% chance to shatter brittle enemies, freezing standard monsters for 2.5s.',
          icon: '❄️',
        },
      },
    ],
  },
  archer: {
    playerClass: 'archer',
    specs: [
      {
        id: 'sniper',
        name: 'Sniper',
        role: 'Long-Range Precision',
        description: 'Hits with surgical accuracy from beyond the reach of retaliation.',
        icon: '🎯',
        accentColor: '#10B981',
        tiers: [
          {
            id: 'eagle_eye',
            name: 'Eagle Eye',
            description: 'Increases arrow flight velocity and effective engagement distance.',
            icon: '👁️',
            maxRank: 3,
            bonusPerRank: '+15% Projectile Velocity and +10% Maximum Range',
          },
          {
            id: 'headshot',
            name: 'Headshot',
            description: 'Long-distance shots strike critical pressure points.',
            icon: '🏹',
            maxRank: 3,
            bonusPerRank: '+20% Arrow Damage when firing past 120px',
          },
        ],
        capstone: {
          id: 'true_aim',
          name: 'True Aim',
          description: 'Arrows pierce cleanly through the first target struck and ignore 50% of enemy armor rating.',
          icon: '✨',
        },
      },
      {
        id: 'trapper',
        name: 'Trapper',
        role: 'Tactical Ambush',
        description: 'Lays deadly concealed mechanisms and controls the battlefield.',
        icon: '🪤',
        accentColor: '#EAB308',
        tiers: [
          {
            id: 'barbed_wire',
            name: 'Barbed Wire',
            description: 'Traps lacerate foes, inflicting poison and bleed over time.',
            icon: '☣️',
            maxRank: 3,
            bonusPerRank: '+10 Poison damage over 4 seconds per rank',
          },
          {
            id: 'fleet_footwork',
            name: 'Fleet Footwork',
            description: 'Agile maneuvers grant rapid sprint acceleration.',
            icon: '👟',
            maxRank: 3,
            bonusPerRank: '+12% Sprint speed and +15% stamina regeneration',
          },
        ],
        capstone: {
          id: 'ambush_master',
          name: 'Ambush Master',
          description: 'Placing a trap now deploys 2 traps simultaneously, and dashing leaves behind a blinding smoke puff.',
          icon: '💨',
        },
      },
    ],
  },
};

export function getTalentTreeForClass(playerClass?: string): ClassTalentTree {
  const norm = (playerClass || 'warrior').toLowerCase();
  return CLASS_TALENT_TREES[norm] || CLASS_TALENT_TREES.warrior;
}

export function getTalentRank(abilitiesState: Record<string, number> | undefined, talentId: string): number {
  if (!abilitiesState) return 0;
  return abilitiesState[`talent_${talentId}`] || 0;
}

export function hasCapstone(abilitiesState: Record<string, number> | undefined, capstoneId: string): boolean {
  if (!abilitiesState) return false;
  return (abilitiesState[`capstone_${capstoneId}`] || 0) > 0;
}

export function getSelectedSpec(abilitiesState: Record<string, number> | undefined, playerClass?: string): string {
  const tree = getTalentTreeForClass(playerClass);
  if (!abilitiesState) return tree.specs[0].id;
  const saved = abilitiesState[`spec_${tree.playerClass}`];
  if (saved === 1) return tree.specs[1].id;
  return tree.specs[0].id;
}
