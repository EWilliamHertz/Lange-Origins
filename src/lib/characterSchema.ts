/**
 * Versioned character schema (roadmap Phase 1, item 2).
 *
 * Single source of truth for what a character document looks like, both in
 * memory and in Firestore. Every read goes through `decodeCharacterDoc`
 * (validate + migrate), every write through `encodeCharacterFields`
 * (validate + stamp). Legacy v1 documents — with missing fields, corrupt
 * JSON strings and stray values — are migrated forward instead of crashing
 * the UI or being trusted blindly.
 *
 * Firestore keeps the JSON-string inventory fields so existing consumers
 * (client menus, server-side trades) keep working; the strings are now
 * guaranteed to contain only sanitized slots.
 */

import { BlockType } from './constants';

/** Bumped whenever the stored document shape changes in a breaking way. */
export const CHARACTER_SCHEMA_VERSION = 2;

export interface InventorySlotData {
  type: number;
  count: number;
  durability?: number;
  isAbility?: boolean;
  abilityId?: string;
}

/**
 * An action-bar slot holding a class ability instead of an item stack. The
 * canonical shape is `{ type: ABILITY_SLOT_TYPE, count: 1, isAbility: true,
 * abilityId }` — `type` is a marker only, never a real item id, so code that
 * derives the held item from `slot.type` sees empty hands.
 */
export interface AbilitySlotData extends InventorySlotData {
  type: typeof ABILITY_SLOT_TYPE;
  count: 1;
  isAbility: true;
  abilityId: string;
}

export type Slot = InventorySlotData | null;

/** Marker `type` for ability slots (Air: "no item here"). */
export const ABILITY_SLOT_TYPE = BlockType.Air;

/** Ability ids are short snake_case identifiers (`fireball`, `ground_slam`). */
export const ABILITY_ID_PATTERN = /^[a-z][a-z0-9_]{0,39}$/;

/** True for any slot value that references an ability (persisted or in-memory shape). */
export function isAbilitySlot(slot: unknown): slot is AbilitySlotData {
  return (
    typeof slot === 'object' && slot !== null && !Array.isArray(slot) &&
    (slot as Record<string, unknown>).isAbility === true &&
    typeof (slot as Record<string, unknown>).abilityId === 'string' &&
    ((slot as Record<string, unknown>).abilityId as string).length > 0
  );
}

export interface CharacterDoc {
  id: string;
  name: string;
  skin: string;
  race: string;
  playerClass: string;
  health: number;
  gold: number;
  xp: number;
  level: number;
  statPoints: number;
  skillPoints: number;
  kills: Record<string, number>;
  /** JSON-string slot arrays; see INVENTORY_SIZES. */
  equipment: string;
  hotbar: string;
  leftActionBar: string;
  rightActionBar: string;
  backpack: string;
  /** JSON-string quest list (absent when invalid so callers fall back). */
  quests?: string;
  /** JSON-string keybind map. */
  keybinds?: string;
  /** JSON-string stat map. */
  skills?: string;
  /** JSON-string ability rank map. */
  abilities?: string;
  lastRoom?: string;
  updatedAt: number;
  schemaVersion: number;
  /** Write-revision counter used to reject stale multi-tab saves. */
  revision: number;
  createdAt?: number;
}

export const INVENTORY_SIZES = {
  equipment: 2,
  hotbar: 10,
  leftActionBar: 10,
  rightActionBar: 10,
  backpack: 27,
} as const;

export type InventoryKey = keyof typeof INVENTORY_SIZES;

export const VALID_RACES = ['human', 'elf', 'dwarf', 'unknown'] as const;
export const VALID_CLASSES = ['warrior', 'mage', 'archer', 'unknown'] as const;
export const VALID_SKINS = ['orange', 'blue', 'green', 'red', 'purple', 'pink', 'gray'] as const;

/** Every item/block id the game knows about (numeric half of the enum). */
export const KNOWN_ITEM_TYPES: ReadonlySet<number> = new Set(
  Object.values(BlockType).filter((v): v is number => typeof v === 'number'),
);

/** IDs that may never be stored in an inventory slot. */
const FORBIDDEN_SLOT_TYPES: ReadonlySet<number> = new Set([
  BlockType.Air,
  BlockType.Fists, // legacy "empty hands" item; hands are implicit now
  BlockType.XpOrb, // world pickup, not an item
]);

export const MAX_STACK = 99;

// ---------------------------------------------------------------------------
// Small validators
// ---------------------------------------------------------------------------

export function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Parse a value that may be a JSON string, an object, or garbage. */
export function parseJsonValue(value: unknown): unknown {
  if (value == null) return null;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return null; }
  }
  return value;
}

/** Sanitize one inventory slot; returns null for anything unrecognized. */
export function sanitizeSlot(raw: unknown): Slot {
  if (!isPlainObject(raw)) return null;
  if (raw.isAbility === true) {
    // Ability slots reference an ability id, not an item stack. They must be
    // recognised *before* the item-id check: the client places them without a
    // `type`, and running them through the item validation first wiped every
    // placed ability on save. Whatever `type` came in, the stored marker is
    // always ABILITY_SLOT_TYPE so an ability can never masquerade as an item.
    const abilityId = typeof raw.abilityId === 'string' ? raw.abilityId : '';
    if (!ABILITY_ID_PATTERN.test(abilityId)) return null;
    const slot: AbilitySlotData = { type: ABILITY_SLOT_TYPE, count: 1, isAbility: true, abilityId };
    return slot;
  }
  const type = clampInt(raw.type, NaN, 0, Number.MAX_SAFE_INTEGER);
  if (!Number.isFinite(type) || !KNOWN_ITEM_TYPES.has(type) || FORBIDDEN_SLOT_TYPES.has(type)) {
    return null;
  }
  const slot: InventorySlotData = { type, count: clampInt(raw.count, 1, 1, MAX_STACK) };
  if (typeof raw.durability === 'number' && Number.isFinite(raw.durability)) {
    slot.durability = Math.max(0, Math.min(1000, Math.floor(raw.durability)));
  }
  return slot;
}

/** Parse + sanitize a fixed-size slot array from a JSON string or array. */
export function sanitizeSlots(value: unknown, size: number): Slot[] {
  const parsed = parseJsonValue(value);
  const source = Array.isArray(parsed) ? parsed : [];
  return Array.from({ length: size }, (_, i) => sanitizeSlot(source[i]));
}

function sanitizeKills(value: unknown): Record<string, number> {
  const parsed = isPlainObject(value) ? value : (parseJsonValue(value) as Record<string, unknown> | null);
  const out: Record<string, number> = {};
  if (!isPlainObject(parsed)) return out; // legacy numeric `kills: 0` collapses to {}
  for (const key of Object.keys(parsed).slice(0, 64)) {
    const n = parsed[key];
    if (typeof n === 'number' && Number.isFinite(n)) {
      out[key.slice(0, 40)] = Math.max(0, Math.min(1_000_000_000, Math.floor(n)));
    }
  }
  return out;
}

function sanitizeStringMap(value: unknown, maxKeys: number, valueOk: (v: unknown) => boolean): Record<string, unknown> | null {
  const parsed = isPlainObject(value) ? value : (parseJsonValue(value) as Record<string, unknown> | null);
  if (!isPlainObject(parsed)) return null;
  const out: Record<string, unknown> = {};
  let count = 0;
  for (const key of Object.keys(parsed)) {
    if (count >= maxKeys) break;
    const v = parsed[key];
    if (valueOk(v)) { out[key.slice(0, 40)] = v; count++; }
  }
  return out;
}

function sanitizeQuests(value: unknown): unknown[] | null {
  const parsed = Array.isArray(value) ? value : (parseJsonValue(value) as unknown[] | null);
  if (!Array.isArray(parsed) || parsed.length > 100) return null;
  const out: unknown[] = [];
  for (const q of parsed) {
    if (!isPlainObject(q) || typeof q.id !== 'string' || typeof q.title !== 'string') return null;
    out.push({
      ...q,
      id: q.id.slice(0, 40),
      title: q.title.slice(0, 80),
      completed: q.completed === true,
      current: clampInt(q.current, 0, 0, 1_000_000),
      goal: clampInt(q.goal, 1, 1, 1_000_000),
    });
  }
  return out;
}

function asTimestampMillis(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value);
  if (isPlainObject(value) && typeof (value as any).toMillis === 'function') {
    try { return (value as any).toMillis(); } catch { /* fall through */ }
  }
  return Date.now();
}

function sanitizeName(value: unknown): string {
  if (typeof value !== 'string') return 'Player';
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 32);
  return cleaned || 'Player';
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

// ---------------------------------------------------------------------------
// Decode (validate + migrate) / encode (validate + stamp)
// ---------------------------------------------------------------------------

/**
 * Validate and migrate a raw Firestore document (or anything) into a
 * `CharacterDoc`. `migrated` is true when the input was not already at the
 * current schema version. Never throws.
 */
export function decodeCharacterDoc(raw: unknown): { data: CharacterDoc; migrated: boolean } {
  const src = isPlainObject(raw) ? raw : {};
  const incomingVersion = clampInt(src.schemaVersion, 1, 1, CHARACTER_SCHEMA_VERSION);

  const data: CharacterDoc = {
    id: typeof src.id === 'string' && src.id ? src.id.slice(0, 128) : `char_${Date.now()}`,
    name: sanitizeName(src.name),
    skin: oneOf(src.skin, VALID_SKINS, 'orange'),
    race: oneOf(src.race, VALID_RACES, 'human'),
    playerClass: oneOf(src.playerClass, VALID_CLASSES, 'warrior'),
    health: clampInt(src.health, 20, 0, 100),
    gold: clampInt(src.gold, 0, 0, 1_000_000_000),
    xp: clampInt(src.xp, 0, 0, 1_000_000_000),
    level: clampInt(src.level, 1, 1, 500),
    statPoints: clampInt(src.statPoints, 0, 0, 10_000),
    skillPoints: clampInt(src.skillPoints, 0, 0, 10_000),
    kills: sanitizeKills(src.kills),
    equipment: JSON.stringify(sanitizeSlots(src.equipment, INVENTORY_SIZES.equipment)),
    hotbar: JSON.stringify(sanitizeSlots(src.hotbar, INVENTORY_SIZES.hotbar)),
    leftActionBar: JSON.stringify(sanitizeSlots(src.leftActionBar, INVENTORY_SIZES.leftActionBar)),
    rightActionBar: JSON.stringify(sanitizeSlots(src.rightActionBar, INVENTORY_SIZES.rightActionBar)),
    backpack: JSON.stringify(sanitizeSlots(src.backpack, INVENTORY_SIZES.backpack)),
    updatedAt: asTimestampMillis(src.updatedAt),
    schemaVersion: CHARACTER_SCHEMA_VERSION,
    revision: clampInt(src.revision, 0, 0, 1_000_000_000),
  };

  const quests = sanitizeQuests(src.quests);
  if (quests && quests.length > 0) data.quests = JSON.stringify(quests);

  const keybinds = sanitizeStringMap(src.keybinds, 32, (v) => typeof v === 'string' && v.length <= 40);
  if (keybinds) data.keybinds = JSON.stringify(keybinds);

  const skills = sanitizeStringMap(src.skills, 16, (v) => typeof v === 'number' && Number.isFinite(v));
  if (skills) data.skills = JSON.stringify(skills);

  const abilities = sanitizeStringMap(src.abilities, 64, (v) => typeof v === 'number' && Number.isFinite(v));
  if (abilities) data.abilities = JSON.stringify(abilities);

  if (typeof src.lastRoom === 'string' && src.lastRoom.length > 0 && src.lastRoom.length <= 100) {
    data.lastRoom = src.lastRoom;
  }
  if (typeof src.createdAt === 'number' && Number.isFinite(src.createdAt)) {
    data.createdAt = Math.floor(src.createdAt);
  }

  return { data, migrated: incomingVersion !== CHARACTER_SCHEMA_VERSION };
}

/** In-memory fields accepted by `encodeCharacterFields`. */
export interface CharacterSaveFields {
  name?: unknown;
  skin?: unknown;
  race?: unknown;
  playerClass?: unknown;
  health?: unknown;
  gold?: unknown;
  xp?: unknown;
  level?: unknown;
  statPoints?: unknown;
  skillPoints?: unknown;
  kills?: unknown;
  equipment?: unknown;
  hotbar?: unknown;
  leftActionBar?: unknown;
  rightActionBar?: unknown;
  backpack?: unknown;
  quests?: unknown;
  keybinds?: unknown;
  skills?: unknown;
  abilities?: unknown;
  lastRoom?: unknown;
  updatedAt?: unknown;
}

/**
 * Validate save fields and produce the Firestore payload (without id /
 * revision — the persistence layer owns the revision counter).
 */
export function encodeCharacterFields(fields: CharacterSaveFields): Record<string, unknown> {
  const { data } = decodeCharacterDoc({ ...fields, id: 'save', revision: 0, schemaVersion: CHARACTER_SCHEMA_VERSION });
  const payload: Record<string, unknown> = {
    name: data.name,
    skin: data.skin,
    race: data.race,
    playerClass: data.playerClass,
    health: data.health,
    gold: data.gold,
    xp: data.xp,
    level: data.level,
    statPoints: data.statPoints,
    skillPoints: data.skillPoints,
    kills: data.kills,
    equipment: data.equipment,
    hotbar: data.hotbar,
    leftActionBar: data.leftActionBar,
    rightActionBar: data.rightActionBar,
    backpack: data.backpack,
    schemaVersion: CHARACTER_SCHEMA_VERSION,
    updatedAt: fields.updatedAt ?? data.updatedAt,
  };
  if (data.quests) payload.quests = data.quests;
  if (data.keybinds) payload.keybinds = data.keybinds;
  if (data.skills) payload.skills = data.skills;
  if (data.abilities) payload.abilities = data.abilities;
  if (data.lastRoom) payload.lastRoom = data.lastRoom;
  return payload;
}

/** Build a fresh, fully-populated v2 document for character creation. */
export function createDefaultCharacterDoc(overrides: {
  id: string;
  name?: string;
  skin?: string;
  race?: string;
  playerClass?: string;
  health?: number;
  questsJson?: string;
}): CharacterDoc {
  const empty = (size: number) => JSON.stringify(Array(size).fill(null));
  const doc: CharacterDoc = {
    id: overrides.id,
    name: sanitizeName(overrides.name),
    skin: oneOf(overrides.skin, VALID_SKINS, 'orange'),
    race: oneOf(overrides.race, VALID_RACES, 'human'),
    playerClass: oneOf(overrides.playerClass, VALID_CLASSES, 'warrior'),
    health: clampInt(overrides.health, 100, 0, 100),
    gold: 0,
    xp: 0,
    level: 1,
    statPoints: 0,
    skillPoints: 0,
    kills: {},
    equipment: empty(INVENTORY_SIZES.equipment),
    hotbar: empty(INVENTORY_SIZES.hotbar),
    leftActionBar: empty(INVENTORY_SIZES.leftActionBar),
    rightActionBar: empty(INVENTORY_SIZES.rightActionBar),
    backpack: empty(INVENTORY_SIZES.backpack),
    updatedAt: Date.now(),
    schemaVersion: CHARACTER_SCHEMA_VERSION,
    revision: 0,
    createdAt: Date.now(),
  };
  const quests = overrides.questsJson ? sanitizeQuests(overrides.questsJson) : null;
  if (quests && quests.length > 0) doc.quests = JSON.stringify(quests);
  return doc;
}

/** Sanitize a chest/world inventory payload (server-side trust boundary). */
export function sanitizeInventoryPayload(raw: unknown, size: number): Slot[] {
  return sanitizeSlots(raw, size);
}
