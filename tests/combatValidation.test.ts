import { describe, expect, it } from 'vitest';
import {
  ABILITY_COOLDOWNS_MS,
  BLOCK_REACH_PX,
  HIT_COOLDOWN_MS,
  MAX_MELEE_DAMAGE,
  MELEE_REACH_PX,
  PROJECTILE_ORIGIN_TOLERANCE_PX,
  canUseAbility,
  isKnownAbility,
  sanitizeProjectile,
  tradeRoleOf,
  validateBlockEdit,
  validateMeleeHit,
} from '../src/server/combatValidation';

describe('melee hit validation', () => {
  const base = { attackerX: 100, attackerY: 100, targetX: 150, targetY: 100, claimedDamage: 8, now: 10_000 };

  it('accepts in-range hits with sane damage', () => {
    expect(validateMeleeHit(base)).toEqual({ ok: true, damage: 8 });
  });

  it('enforces the swing cooldown', () => {
    const verdict = validateMeleeHit({ ...base, lastHitAt: base.now - (HIT_COOLDOWN_MS - 1) });
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toBe('cooldown');
    expect(validateMeleeHit({ ...base, lastHitAt: base.now - HIT_COOLDOWN_MS }).ok).toBe(true);
  });

  it('rejects hits beyond melee reach', () => {
    const verdict = validateMeleeHit({ ...base, targetX: base.attackerX + MELEE_REACH_PX + 40 });
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toBe('out_of_range');
  });

  it('caps forged damage values', () => {
    expect(validateMeleeHit({ ...base, claimedDamage: 999999 }).ok).toBe(false);
    expect(validateMeleeHit({ ...base, claimedDamage: MAX_MELEE_DAMAGE }).damage).toBe(MAX_MELEE_DAMAGE);
    expect(validateMeleeHit({ ...base, claimedDamage: 0 }).ok).toBe(false);
    expect(validateMeleeHit({ ...base, claimedDamage: 'ten' }).ok).toBe(false);
    expect(validateMeleeHit({ ...base, claimedDamage: NaN }).ok).toBe(false);
  });
});

describe('ability cooldowns', () => {
  it('knows the shipped ability set and rejects unknown ones', () => {
    expect(isKnownAbility('slash')).toBe(true);
    expect(isKnownAbility('grant_admin')).toBe(false);
    expect(isKnownAbility(42)).toBe(false);
  });

  it('blocks reuse before the cooldown elapses', () => {
    const now = 50_000;
    expect(canUseAbility('slash', undefined, now)).toBe(true);
    expect(canUseAbility('slash', now - 100, now)).toBe(false);
    expect(canUseAbility('slash', now - ABILITY_COOLDOWNS_MS.slash, now)).toBe(true);
    expect(canUseAbility('unknown_ability', undefined, now)).toBe(false);
  });
});

describe('projectile sanitization', () => {
  const owner = { x: 320, y: 160 };
  const shot = { type: 'arrow', x: 330, y: 150, vx: 15, vy: 0, damage: 8 };

  it('accepts legitimate shots with server-authoritative damage', () => {
    const p = sanitizeProjectile(shot, owner)!;
    expect(p).toMatchObject({ type: 'arrow', damage: 8, life: 40 });
  });

  it('rejects unknown or forged projectile types', () => {
    expect(sanitizeProjectile({ ...shot, type: 'nuke' }, owner)).toBeNull();
    expect(sanitizeProjectile({ ...shot, type: 7 }, owner)).toBeNull();
  });

  it('caps claimed damage at base plus a bounded stat bonus', () => {
    const p = sanitizeProjectile({ ...shot, damage: 999999 }, owner)!;
    expect(p.damage).toBeLessThanOrEqual(58); // 8 base + 50 bonus cap
    expect(sanitizeProjectile({ ...shot, damage: 1 }, owner)!.damage).toBe(8); // never below base
  });

  it('caps projectile speed', () => {
    const p = sanitizeProjectile({ ...shot, vx: 300, vy: 400 }, owner)!;
    expect(Math.hypot(p.vx, p.vy)).toBeLessThanOrEqual(30 + 1e-9);
  });

  it('rejects shots originating far from the shooter', () => {
    const p = sanitizeProjectile({ ...shot, x: owner.x + PROJECTILE_ORIGIN_TOLERANCE_PX + 50 }, owner);
    expect(p).toBeNull();
  });

  it('rejects non-numeric payloads', () => {
    expect(sanitizeProjectile({ ...shot, x: 'left' }, owner)).toBeNull();
    expect(sanitizeProjectile({ ...shot, vx: undefined }, owner)).toBeNull();
  });
});

describe('trade membership', () => {
  const trade = { p1: 'socket-a', p2: 'socket-b' };

  it('maps participants to their side and rejects outsiders', () => {
    expect(tradeRoleOf(trade, 'socket-a')).toBe('p1');
    expect(tradeRoleOf(trade, 'socket-b')).toBe('p2');
    expect(tradeRoleOf(trade, 'socket-c')).toBeNull();
    expect(tradeRoleOf(trade, '')).toBeNull();
  });
});

describe('block edit validation', () => {
  const args = {
    playerX: 5 * 32, playerY: 10 * 32,
    worldWidth: 1000, worldHeight: 250, isAdmin: false,
  };

  it('accepts edits within reach', () => {
    expect(validateBlockEdit({ ...args, tx: 7, ty: 10, blockType: 1 }).ok).toBe(true);
  });

  it('rejects edits far from the player', () => {
    const farTx = Math.ceil((args.playerX + BLOCK_REACH_PX + 100) / 32);
    const verdict = validateBlockEdit({ ...args, tx: farTx, ty: 10, blockType: 1 });
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toBe('out_of_range');
  });

  it('rejects AdminBrick placement by non-admins', () => {
    const verdict = validateBlockEdit({ ...args, tx: 5, ty: 10, blockType: 21 });
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toBe('forbidden_block');
    expect(validateBlockEdit({ ...args, tx: 5, ty: 10, blockType: 21, isAdmin: true }).ok).toBe(true);
  });

  it('rejects out-of-bounds and non-integer edits', () => {
    expect(validateBlockEdit({ ...args, tx: -1, ty: 0, blockType: 1 }).ok).toBe(false);
    expect(validateBlockEdit({ ...args, tx: 1000, ty: 0, blockType: 1 }).ok).toBe(false);
    expect(validateBlockEdit({ ...args, tx: 1.5, ty: 1, blockType: 1 }).ok).toBe(false);
    expect(validateBlockEdit({ ...args, tx: 'x', ty: 1, blockType: 1 }).ok).toBe(false);
  });
});
