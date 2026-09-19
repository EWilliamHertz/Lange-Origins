/**
 * Shared class-ability registry.
 *
 * Single source of truth for every castable class ability: what it is called,
 * which class owns it, what it needs (stat requirement, mana, a target) and
 * how it is drawn. Consumed by the skill tree (UnifiedMenu), the action bars
 * and slot renderer (App), and the unified cast pipeline (GameCanvas), so all
 * three agree on ids, costs and cooldowns.
 *
 * Everything except the icons is pure data with pure helpers, which keeps the
 * placement / keybind / cast-gating rules unit-testable without a DOM.
 */

import React from 'react';
import { Activity, Crosshair, FastForward, Flame, Heart, Snowflake, Sword, Tent, Wind } from 'lucide-react';
import { ABILITY_SLOT_TYPE, isAbilitySlot, type AbilitySlotData, type Slot } from './characterSchema';

export { isAbilitySlot, ABILITY_SLOT_TYPE };

export type PlayerClass = 'warrior' | 'mage' | 'archer';
export type AbilityStat = 'strength' | 'dexterity' | 'intelligence';

export interface AbilityDef {
  id: string;
  class: PlayerClass;
  name: string;
  desc: string;
  /** Minimum value of the class stat (see CLASS_STAT) needed to unlock. */
  req: number;
  /** Mana cost per cast. */
  cost: number;
  /** Client-side cooldown in seconds (the server enforces its own floor). */
  cd: number;
  /** Requires a selected mob/player target; the server ignores untargeted casts. */
  needsTarget?: boolean;
  icon: React.ReactElement;
}

/** Which stat gates each class's abilities. */
export const CLASS_STAT: Readonly<Record<PlayerClass, AbilityStat>> = {
  warrior: 'strength',
  archer: 'dexterity',
  mage: 'intelligence',
};

export const MMO_ABILITIES: readonly AbilityDef[] = [
  { id: 'ground_slam', class: 'warrior', name: 'Ground Slam', desc: 'Slam the ground to damage enemies.', req: 8, cost: 20, cd: 12, icon: <Activity size={24}/> },
  { id: 'battle_shout', class: 'warrior', name: 'Battle Shout', desc: 'Heal yourself slightly and buff.', req: 10, cost: 25, cd: 20, icon: <Heart size={24} className="text-red-500" /> },
  { id: 'arcane_blast', class: 'mage', name: 'Arcane Blast', desc: 'A huge blast of magic energy.', req: 8, cost: 30, cd: 15, needsTarget: true, icon: <Activity size={24} className="text-purple-500"/> },
  { id: 'teleport', class: 'mage', name: 'Teleport', desc: 'Instantly travel a short distance.', req: 10, cost: 25, cd: 12, icon: <FastForward size={24} className="text-cyan-500"/> },
  { id: 'multishot', class: 'archer', name: 'Multishot', desc: 'Fire multiple arrows at once.', req: 8, cost: 25, cd: 8, icon: <Crosshair size={24} className="text-yellow-500"/> },
  { id: 'poison_arrow', class: 'archer', name: 'Poison Arrow', desc: 'Fire a toxic arrow.', req: 10, cost: 20, cd: 10, needsTarget: true, icon: <Crosshair size={24} className="text-green-500"/> },

  { id: 'slash', class: 'warrior', name: 'Slash', desc: 'Melee attack dealing standard physical damage.', req: 0, cost: 0, cd: 3, icon: <Sword size={24}/> },
  { id: 'whirlwind', class: 'warrior', name: 'Whirlwind', desc: 'Spinning attack damaging all nearby enemies.', req: 3, cost: 15, cd: 8, icon: <Wind size={24}/> },
  { id: 'dash', class: 'warrior', name: 'Dash', desc: 'Lunge forward quickly.', req: 5, cost: 10, cd: 5, icon: <FastForward size={24}/> },
  { id: 'fireball', class: 'mage', name: 'Fireball', desc: 'Shoot a flaming projectile.', req: 0, cost: 10, cd: 5, needsTarget: true, icon: <Flame size={24}/> },
  { id: 'frostbolt', class: 'mage', name: 'Frostbolt', desc: 'Launch ice that slows enemies.', req: 3, cost: 15, cd: 6, needsTarget: true, icon: <Snowflake size={24}/> },
  { id: 'heal', class: 'mage', name: 'Heal', desc: 'Restore 20 HP.', req: 5, cost: 20, cd: 10, icon: <Heart size={24}/> },
  { id: 'shoot', class: 'archer', name: 'Shoot', desc: 'Fire a fast arrow.', req: 0, cost: 0, cd: 2, icon: <Crosshair size={24}/> },
  { id: 'snipe', class: 'archer', name: 'Snipe', desc: 'A devastating heavy shot.', req: 3, cost: 20, cd: 10, needsTarget: true, icon: <Crosshair size={24} className="text-red-500" /> },
  { id: 'trap', class: 'archer', name: 'Trap', desc: 'Place a trap that damages enemies.', req: 5, cost: 15, cd: 15, icon: <Tent size={24}/> },
];

const ABILITY_BY_ID: ReadonlyMap<string, AbilityDef> = new Map(MMO_ABILITIES.map(a => [a.id, a]));

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

export function getAbility(id: unknown): AbilityDef | undefined {
  return typeof id === 'string' ? ABILITY_BY_ID.get(id) : undefined;
}

export function isAbilityId(id: unknown): id is string {
  return typeof id === 'string' && ABILITY_BY_ID.has(id);
}

export function abilitiesForClass(playerClass: string | undefined): AbilityDef[] {
  return MMO_ABILITIES.filter(a => a.class === playerClass);
}

/** An ability is unlocked once its class stat meets the requirement. */
export function isAbilityUnlocked(
  def: AbilityDef,
  skills: Partial<Record<AbilityStat, number>> | undefined,
): boolean {
  return (skills?.[CLASS_STAT[def.class]] || 0) >= def.req;
}

// ---------------------------------------------------------------------------
// Action-bar placement
// ---------------------------------------------------------------------------

export type BarKey = 'hotbar' | 'leftActionBar' | 'rightActionBar';
export type Bars = Record<BarKey, Slot[]>;
export interface BarPosition { bar: BarKey; index: number }

/** Bars are filled in this order when the player clicks "Add to Bar". */
export const BAR_FILL_ORDER: readonly BarKey[] = ['hotbar', 'leftActionBar', 'rightActionBar'];

/** Build the canonical ability slot, or null for an id the registry does not know. */
export function makeAbilitySlot(abilityId: unknown): AbilitySlotData | null {
  if (!isAbilityId(abilityId)) return null;
  return { type: ABILITY_SLOT_TYPE, count: 1, isAbility: true, abilityId };
}

/** Where (if anywhere) an ability currently sits on the bars. */
export function findAbilityOnBars(bars: Bars, abilityId: string, order: readonly BarKey[] = BAR_FILL_ORDER): BarPosition | null {
  for (const bar of order) {
    const index = (bars[bar] || []).findIndex(s => isAbilitySlot(s) && s.abilityId === abilityId);
    if (index !== -1) return { bar, index };
  }
  return null;
}

export type PlaceResult =
  | { ok: true; bar: BarKey; index: number; bars: Bars }
  | { ok: false; reason: 'unknown_ability' | 'already_placed' | 'no_free_slot'; bar?: BarKey; index?: number };

/**
 * Put an ability into the first empty slot across the bars (in `order`).
 * Never duplicates an ability that is already placed and never overwrites an
 * occupied slot; the input arrays are not mutated.
 */
export function placeAbilityOnBars(bars: Bars, abilityId: unknown, order: readonly BarKey[] = BAR_FILL_ORDER): PlaceResult {
  const slot = makeAbilitySlot(abilityId);
  if (!slot) return { ok: false, reason: 'unknown_ability' };
  const existing = findAbilityOnBars(bars, slot.abilityId, order);
  if (existing) return { ok: false, reason: 'already_placed', ...existing };
  for (const bar of order) {
    const index = (bars[bar] || []).findIndex(s => s == null);
    if (index !== -1) {
      const next = [...bars[bar]];
      next[index] = slot;
      return { ok: true, bar, index, bars: { ...bars, [bar]: next } };
    }
  }
  return { ok: false, reason: 'no_free_slot' };
}

// ---------------------------------------------------------------------------
// Keybinds
// ---------------------------------------------------------------------------

/**
 * Keys the game already uses for movement, menus, chat or hotbar selection.
 * Binding an ability to one of these would fire two actions per press.
 */
export const RESERVED_KEYS: ReadonlySet<string> = new Set([
  'escape', 'tab', 'enter', ' ', 'shift', 'control', 'alt', 'meta',
  'w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
  'e', 'i', 'q', 'm', 'j', 'l',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
]);

/** Single printable characters (not reserved) and F1–F12 may be bound. */
export function isBindableKey(key: unknown): key is string {
  if (typeof key !== 'string') return false;
  const k = key.toLowerCase();
  if (RESERVED_KEYS.has(k)) return false;
  if (/^f([1-9]|1[0-2])$/.test(k)) return true;
  return k.length === 1 && k.trim().length === 1;
}

/** The key currently bound to an ability, if any. */
export function keyForAbility(keybinds: Record<string, string>, abilityId: string): string | undefined {
  return Object.keys(keybinds).find(k => keybinds[k] === abilityId);
}

/**
 * Bind `key` to `abilityId`. An ability has at most one key and a key at
 * most one ability, so both previous mappings are dropped. Returns the input
 * untouched for reserved keys or unknown abilities.
 */
export function bindAbilityKey(keybinds: Record<string, string>, key: string, abilityId: unknown): Record<string, string> {
  if (!isBindableKey(key) || !isAbilityId(abilityId)) return keybinds;
  const k = key.toLowerCase();
  const next: Record<string, string> = {};
  for (const existingKey of Object.keys(keybinds)) {
    if (existingKey !== k && keybinds[existingKey] !== abilityId) next[existingKey] = keybinds[existingKey];
  }
  next[k] = abilityId;
  return next;
}

export function unbindAbility(keybinds: Record<string, string>, abilityId: string): Record<string, string> {
  const next: Record<string, string> = {};
  for (const k of Object.keys(keybinds)) if (keybinds[k] !== abilityId) next[k] = keybinds[k];
  return next;
}

// ---------------------------------------------------------------------------
// Cast gating (client side; the server re-validates cooldowns)
// ---------------------------------------------------------------------------

/** Shared cooldown between any two casts, in ms. */
export const GLOBAL_COOLDOWN_MS = 1500;

export interface CastContext {
  /** Remaining global cooldown in ms. */
  globalCooldownMs: number;
  /** Remaining cooldown for this ability in ms. */
  abilityCooldownMs: number;
  hasTarget: boolean;
  mana: number;
}

export type CastVerdict =
  | { ok: true }
  | { ok: false; reason: 'gcd' | 'cooldown' | 'no_target' | 'no_mana' };

export function canCastAbility(def: AbilityDef, ctx: CastContext): CastVerdict {
  if (ctx.globalCooldownMs > 0) return { ok: false, reason: 'gcd' };
  if (ctx.abilityCooldownMs > 0) return { ok: false, reason: 'cooldown' };
  if (def.needsTarget && !ctx.hasTarget) return { ok: false, reason: 'no_target' };
  if (def.cost > 0 && ctx.mana < def.cost) return { ok: false, reason: 'no_mana' };
  return { ok: true };
}

/** Short on-screen hint for a rejected cast (null for silent rejections). */
export function castRejectionText(reason: Exclude<CastVerdict, { ok: true }>['reason']): string | null {
  switch (reason) {
    case 'no_target': return 'No Target!';
    case 'no_mana': return 'No Mana!';
    default: return null; // cooldowns are visible on the bar; don't spam text
  }
}
