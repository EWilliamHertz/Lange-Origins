/**
 * Server-side combat and mutation validation (roadmap Phase 1, item 1).
 *
 * Pure, unit-tested rules used by server.ts. The server never trusts
 * client-claimed damage, cooldowns, ranges or admin flags: everything is
 * re-derived or clamped here. Modified clients can therefore no longer grant
 * themselves damage, reach, fire-rate or items.
 */

import { BlockType } from '../lib/constants';

// ---------------------------------------------------------------------------
// Melee hits (hit_mob / hit_player)
// ---------------------------------------------------------------------------

/** Attack range (64px) plus latency/movement leniency. */
export const MELEE_REACH_PX = 96;
/** Minimum interval between two melee hits from the same player. */
export const HIT_COOLDOWN_MS = 250;
/**
 * Hard cap on one melee swing. Legitimate swings are base 1–8 plus up to a
 * few dozen stat bonus; anything above this is a forged payload.
 */
export const MAX_MELEE_DAMAGE = 60;

export interface MeleeHitInput {
  attackerX: number;
  attackerY: number;
  targetX: number;
  targetY: number;
  claimedDamage: unknown;
  now: number;
  lastHitAt?: number;
}

export interface MeleeHitVerdict {
  ok: boolean;
  reason?: 'cooldown' | 'out_of_range' | 'invalid_damage';
  /** Server-approved damage (0 when rejected). */
  damage: number;
}

export function validateMeleeHit(input: MeleeHitInput): MeleeHitVerdict {
  const { attackerX, attackerY, targetX, targetY, claimedDamage, now, lastHitAt } = input;
  if (lastHitAt !== undefined && now - lastHitAt < HIT_COOLDOWN_MS) {
    return { ok: false, reason: 'cooldown', damage: 0 };
  }
  const dist = Math.hypot(targetX - attackerX, targetY - attackerY);
  if (!Number.isFinite(dist) || dist > MELEE_REACH_PX) {
    return { ok: false, reason: 'out_of_range', damage: 0 };
  }
  const dmg = typeof claimedDamage === 'number' ? claimedDamage : NaN;
  if (!Number.isFinite(dmg) || dmg < 1 || dmg > MAX_MELEE_DAMAGE) {
    return { ok: false, reason: 'invalid_damage', damage: 0 };
  }
  return { ok: true, damage: Math.floor(dmg) };
}

// ---------------------------------------------------------------------------
// Abilities (use_ability)
// ---------------------------------------------------------------------------

/** Server-enforced cooldowns per ability (ms). Unknown abilities are rejected. */
export const ABILITY_COOLDOWNS_MS: Readonly<Record<string, number>> = {
  slash: 600,
  whirlwind: 4000,
  ground_slam: 6000,
  battle_shout: 8000,
  heal: 5000,
  teleport: 4000,
  trap: 8000,
  fireball: 2500,
  frostbolt: 2500,
  arcane_blast: 3000,
  dash: 2000,
  shoot: 400,
  snipe: 2000,
  multishot: 4000,
  poison_arrow: 3000,
};

export function isKnownAbility(ability: unknown): ability is string {
  return typeof ability === 'string' && ability in ABILITY_COOLDOWNS_MS;
}

export function canUseAbility(
  ability: string,
  lastUsedAt: number | undefined,
  now: number,
): boolean {
  const cooldown = ABILITY_COOLDOWNS_MS[ability];
  if (cooldown === undefined) return false;
  if (lastUsedAt === undefined) return true;
  return now - lastUsedAt >= cooldown;
}

// ---------------------------------------------------------------------------
// Projectiles (fire_projectile)
// ---------------------------------------------------------------------------

export interface ProjectileSpec {
  /** Authoritative base damage; client values never apply directly. */
  damage: number;
  life: number;
  maxSpeed: number;
}

/**
 * Extra damage a client may claim on top of the base, to cover stat bonuses
 * (str/dex/int). Bounded until the server tracks stats itself (Phase 2).
 */
export const MAX_PROJECTILE_STAT_BONUS = 50;
/** Projectiles must originate this close to the shooter's server position. */
export const PROJECTILE_ORIGIN_TOLERANCE_PX = 64;

export const PROJECTILE_SPECS: Readonly<Record<string, ProjectileSpec>> = {
  arrow: { damage: 8, life: 40, maxSpeed: 30 },
  poison_arrow: { damage: 12, life: 45, maxSpeed: 30 },
  bullet: { damage: 15, life: 40, maxSpeed: 30 },
  fireball: { damage: 30, life: 80, maxSpeed: 30 },
  frostbolt: { damage: 20, life: 80, maxSpeed: 30 },
  arcane_blast: { damage: 25, life: 80, maxSpeed: 30 },
  grenade: { damage: 20, life: 60, maxSpeed: 30 },
  rocket: { damage: 30, life: 60, maxSpeed: 30 },
  trap: { damage: 30, life: 1000, maxSpeed: 0 },
};

export interface ProjectileInput {
  type?: unknown;
  x?: unknown;
  y?: unknown;
  vx?: unknown;
  vy?: unknown;
  damage?: unknown;
}

export interface SanitizedProjectile {
  type: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  life: number;
}

/**
 * Validate a client projectile request. Returns null when forged/invalid;
 * otherwise returns a projectile with server-authoritative damage and
 * lifetime, a speed-capped velocity, and an origin snapped to the shooter.
 */
export function sanitizeProjectile(
  input: ProjectileInput,
  owner: { x: number; y: number },
): SanitizedProjectile | null {
  if (typeof input.type !== 'string' || !(input.type in PROJECTILE_SPECS)) return null;
  const spec = PROJECTILE_SPECS[input.type];

  const x = Number(input.x);
  const y = Number(input.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const originDist = Math.hypot(x - owner.x, y - owner.y);
  if (originDist > PROJECTILE_ORIGIN_TOLERANCE_PX) return null;

  let vx = Number(input.vx);
  let vy = Number(input.vy);
  if (!Number.isFinite(vx) || !Number.isFinite(vy)) return null;
  const speed = Math.hypot(vx, vy);
  if (spec.maxSpeed === 0) {
    vx = 0;
    vy = 0;
  } else if (speed > spec.maxSpeed) {
    if (speed === 0) return null;
    const scale = spec.maxSpeed / speed;
    vx *= scale;
    vy *= scale;
  }

  let damage = spec.damage;
  if (typeof input.damage === 'number' && Number.isFinite(input.damage)) {
    damage = Math.min(Math.max(input.damage, spec.damage), spec.damage + MAX_PROJECTILE_STAT_BONUS);
  }

  return { type: input.type, x, y, vx, vy, damage: Math.floor(damage), life: spec.life };
}

// ---------------------------------------------------------------------------
// Block edits (block_update)
// ---------------------------------------------------------------------------

/** Client mining/placement reach is 6 tiles; allow generous reach for tree planting, canopies, and latency. */
export const BLOCK_REACH_PX = 10 * 32 + 64; // 384px

export interface BlockEditVerdict {
  ok: boolean;
  reason?: 'out_of_range' | 'invalid' | 'forbidden_block';
}

/**
 * Validate a block placement/removal. Blocks are world-mutating, so edits far
 * from the player or AdminBrick edits from non-admins are rejected.
 */
export function validateBlockEdit(args: {
  playerX: number;
  playerY: number;
  tx: unknown;
  ty: unknown;
  blockType: unknown;
  isAdmin: boolean;
  worldWidth: number;
  worldHeight: number;
}): BlockEditVerdict {
  const tx = Number(args.tx);
  const ty = Number(args.ty);
  const blockType = Number(args.blockType);
  if (!Number.isInteger(tx) || !Number.isInteger(ty) || !Number.isInteger(blockType)) {
    return { ok: false, reason: 'invalid' };
  }
  if (tx < 0 || tx >= args.worldWidth || ty < 0 || ty >= args.worldHeight) {
    return { ok: false, reason: 'invalid' };
  }
  if (blockType === BlockType.AdminBrick && !args.isAdmin) {
    return { ok: false, reason: 'forbidden_block' };
  }
  const tileCenterX = tx * 32 + 16;
  const tileCenterY = ty * 32 + 16;
  const dist = Math.hypot(tileCenterX - args.playerX, tileCenterY - args.playerY);
  if (!Number.isFinite(dist) || dist > BLOCK_REACH_PX) {
    return { ok: false, reason: 'out_of_range' };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Chests / trades (shared trust boundary helpers)
// ---------------------------------------------------------------------------

export const CHEST_SIZE = 27;
export const TRADE_SIZE = 9;

/**
 * Derive which side of a trade a socket belongs to. Third-party sockets get
 * null and must never be able to mutate or confirm the trade.
 */
export function tradeRoleOf(
  trade: { p1: string; p2: string },
  socketId: string,
): 'p1' | 'p2' | null {
  if (trade.p1 === socketId) return 'p1';
  if (trade.p2 === socketId) return 'p2';
  return null;
}
