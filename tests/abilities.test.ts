import { describe, expect, it } from 'vitest';
import {
  BAR_FILL_ORDER,
  CLASS_STAT,
  GLOBAL_COOLDOWN_MS,
  MMO_ABILITIES,
  RESERVED_KEYS,
  abilitiesForClass,
  bindAbilityKey,
  canCastAbility,
  castRejectionText,
  findAbilityOnBars,
  getAbility,
  isAbilityId,
  isAbilityUnlocked,
  isBindableKey,
  keyForAbility,
  makeAbilitySlot,
  placeAbilityOnBars,
  unbindAbility,
  type Bars,
} from '../src/lib/abilities';
import { ABILITY_SLOT_TYPE, sanitizeSlot } from '../src/lib/characterSchema';
import { ABILITY_COOLDOWNS_MS, isKnownAbility } from '../src/server/combatValidation';

const emptyBars = (): Bars => ({
  hotbar: Array(10).fill(null),
  leftActionBar: Array(10).fill(null),
  rightActionBar: Array(10).fill(null),
});

describe('ability registry', () => {
  it('is well-formed: unique ids, a real class and sane numbers for every ability', () => {
    const ids = MMO_ABILITIES.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of MMO_ABILITIES) {
      expect(a.id).toMatch(/^[a-z][a-z0-9_]*$/);
      expect(Object.keys(CLASS_STAT)).toContain(a.class);
      expect(a.name.length).toBeGreaterThan(0);
      expect(a.req).toBeGreaterThanOrEqual(0);
      expect(a.cost).toBeGreaterThanOrEqual(0);
      expect(a.cd).toBeGreaterThan(0);
      expect(a.icon).toBeTruthy();
    }
    // Every class has a free starter ability so a fresh character can act.
    for (const cls of ['warrior', 'mage', 'archer'] as const) {
      expect(abilitiesForClass(cls).some(a => a.req === 0)).toBe(true);
    }
    expect(abilitiesForClass('unknown')).toEqual([]);
  });

  it('agrees with the server: every client ability is server-known and vice versa', () => {
    for (const a of MMO_ABILITIES) {
      expect(isKnownAbility(a.id), a.id).toBe(true);
      // The client never lets a player cast faster than the server would accept.
      expect(a.cd * 1000, a.id).toBeGreaterThanOrEqual(ABILITY_COOLDOWNS_MS[a.id]);
    }
    expect(Object.keys(ABILITY_COOLDOWNS_MS).sort()).toEqual(MMO_ABILITIES.map(a => a.id).sort());
  });

  it('looks abilities up safely and reports unlock state from the class stat', () => {
    expect(getAbility('fireball')?.name).toBe('Fireball');
    for (const bad of ['nope', '', 42, null, undefined, {}]) {
      expect(getAbility(bad)).toBeUndefined();
      expect(isAbilityId(bad)).toBe(false);
    }
    const whirlwind = getAbility('whirlwind')!; // warrior, req 3
    expect(isAbilityUnlocked(whirlwind, { strength: 3 })).toBe(true);
    expect(isAbilityUnlocked(whirlwind, { strength: 2, intelligence: 99 })).toBe(false);
    expect(isAbilityUnlocked(whirlwind, undefined)).toBe(false);
    expect(isAbilityUnlocked(getAbility('slash')!, undefined)).toBe(true); // req 0
  });
});

describe('action-bar placement', () => {
  it('builds canonical ability slots that the character schema accepts unchanged', () => {
    const slot = makeAbilitySlot('heal');
    expect(slot).toEqual({ type: ABILITY_SLOT_TYPE, count: 1, isAbility: true, abilityId: 'heal' });
    expect(sanitizeSlot(slot)).toEqual(slot);
    expect(makeAbilitySlot('not_a_spell')).toBeNull();
    expect(makeAbilitySlot(undefined)).toBeNull();
  });

  it('fills the first free slot in bar order and never duplicates or overwrites', () => {
    const bars = emptyBars();
    bars.hotbar[0] = { type: 105, count: 1 };

    const first = placeAbilityOnBars(bars, 'slash');
    expect(first).toMatchObject({ ok: true, bar: 'hotbar', index: 1 });
    if (!first.ok) throw new Error('unreachable');
    expect(first.bars.hotbar[0]).toEqual({ type: 105, count: 1 }); // untouched
    expect(bars.hotbar[1]).toBeNull(); // input not mutated
    expect(findAbilityOnBars(first.bars, 'slash')).toEqual({ bar: 'hotbar', index: 1 });

    expect(placeAbilityOnBars(first.bars, 'slash')).toEqual({ ok: false, reason: 'already_placed', bar: 'hotbar', index: 1 });
    expect(placeAbilityOnBars(first.bars, 'made_up')).toEqual({ ok: false, reason: 'unknown_ability' });

    // Overflow spills into the side bars in BAR_FILL_ORDER, then reports no room.
    const full = emptyBars();
    full.hotbar.fill({ type: 1, count: 1 });
    full.leftActionBar.fill({ type: 1, count: 1 });
    full.rightActionBar.fill({ type: 1, count: 1 });
    full.rightActionBar[4] = null;
    expect(BAR_FILL_ORDER).toEqual(['hotbar', 'leftActionBar', 'rightActionBar']);
    expect(placeAbilityOnBars(full, 'trap')).toMatchObject({ ok: true, bar: 'rightActionBar', index: 4 });
    full.rightActionBar[4] = { type: 1, count: 1 };
    expect(placeAbilityOnBars(full, 'trap')).toEqual({ ok: false, reason: 'no_free_slot' });
  });
});

describe('keybinds', () => {
  it('refuses keys the game already uses and accepts free letters and function keys', () => {
    for (const k of ['w', 'a', 's', 'd', ' ', 'e', 'q', 'i', 'm', 'j', 'l', 'escape', 'tab', 'enter', 'shift', '1', '9', '0']) {
      expect(RESERVED_KEYS.has(k), k).toBe(true);
      expect(isBindableKey(k), k).toBe(false);
    }
    for (const k of ['z', 'x', 'c', 'r', 'f', 'g', 'v', 'Z', 'F1', 'f12', '-', '=']) {
      expect(isBindableKey(k), k).toBe(true);
    }
    for (const k of ['', 'f13', 'zz', 'arrowup', 42, null, undefined]) {
      expect(isBindableKey(k), String(k)).toBe(false);
    }
  });

  it('keeps one key per ability and one ability per key', () => {
    const start = { z: 'slash', x: 'fireball' };
    // Rebinding an ability moves it off its old key.
    const moved = bindAbilityKey(start, 'r', 'slash');
    expect(moved).toEqual({ x: 'fireball', r: 'slash' });
    expect(keyForAbility(moved, 'slash')).toBe('r');
    // Binding a taken key evicts the previous ability from it.
    expect(bindAbilityKey(moved, 'x', 'heal')).toEqual({ r: 'slash', x: 'heal' });
    // Keys are case-insensitive.
    expect(bindAbilityKey({}, 'F', 'heal')).toEqual({ f: 'heal' });
    // Reserved keys and unknown abilities return the *same* object so callers can detect a no-op.
    expect(bindAbilityKey(start, 'w', 'slash')).toBe(start);
    expect(bindAbilityKey(start, '3', 'slash')).toBe(start);
    expect(bindAbilityKey(start, 'r', 'made_up')).toBe(start);
    expect(unbindAbility(start, 'slash')).toEqual({ x: 'fireball' });
    expect(keyForAbility(start, 'heal')).toBeUndefined();
  });
});

describe('cast gating', () => {
  it('blocks casts during the global cooldown, the ability cooldown, without a target or mana', () => {
    const snipe = getAbility('snipe')!; // costs 20, needs a target
    const slash = getAbility('slash')!; // free, no target needed
    const ready = { globalCooldownMs: 0, abilityCooldownMs: 0, hasTarget: true, mana: 100 };

    expect(canCastAbility(snipe, ready)).toEqual({ ok: true });
    expect(canCastAbility(snipe, { ...ready, globalCooldownMs: 1 })).toEqual({ ok: false, reason: 'gcd' });
    expect(canCastAbility(snipe, { ...ready, abilityCooldownMs: 250 })).toEqual({ ok: false, reason: 'cooldown' });
    expect(canCastAbility(snipe, { ...ready, hasTarget: false })).toEqual({ ok: false, reason: 'no_target' });
    expect(canCastAbility(snipe, { ...ready, mana: 9 })).toEqual({ ok: false, reason: 'no_mana' });
    // Free, untargeted abilities only care about cooldowns.
    expect(canCastAbility(slash, { ...ready, hasTarget: false, mana: 0 })).toEqual({ ok: true });
    // Infinite mana is how the client disables costs before magic is unlocked.
    expect(canCastAbility(snipe, { ...ready, mana: Number.POSITIVE_INFINITY })).toEqual({ ok: true });
    expect(GLOBAL_COOLDOWN_MS).toBeGreaterThan(0);
  });

  it('only surfaces feedback text for rejections the player can act on', () => {
    expect(castRejectionText('no_target')).toBe('No Target!');
    expect(castRejectionText('no_mana')).toBe('No Mana!');
    expect(castRejectionText('gcd')).toBeNull();
    expect(castRejectionText('cooldown')).toBeNull();
  });
});
