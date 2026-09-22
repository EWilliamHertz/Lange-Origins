import { BlockType } from './lib/constants';
import type { EnchantmentData, SocketedGems, CursedAffix, EnchantmentPrefix, GemType } from './lib/enchanting';

export type InventorySlot = {
  type?: BlockType;
  count?: number;
  durability?: number;
  isAbility?: boolean;
  abilityId?: string;
  enchantment?: EnchantmentData;
  sockets?: SocketedGems;
  curse?: CursedAffix;
  prefix?: EnchantmentPrefix;
  enchantLevel?: number;
  gem1?: GemType | null;
  gem2?: GemType | null;
} | null;

export interface ActiveBuff {
  id: string;
  name: string;
  sourceItem?: BlockType;
  startTime: number;
  durationSeconds: number;
  icon: 'heart' | 'zap' | 'wind' | 'shield' | 'utensils';
  color: string;
  description: string;
  maxHpBonus?: number;
  manaRegenMultiplier?: number;
  speedMultiplier?: number;
  staminaDrainMultiplier?: number;
  damageReductionPercent?: number;
  defenseBonus?: number;
}
