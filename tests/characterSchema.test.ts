import { describe, expect, it } from 'vitest';
import {
  ABILITY_SLOT_TYPE,
  CHARACTER_SCHEMA_VERSION,
  INVENTORY_SIZES,
  createDefaultCharacterDoc,
  decodeCharacterDoc,
  encodeCharacterFields,
  isAbilitySlot,
  sanitizeInventoryPayload,
  sanitizeSlot,
  sanitizeSlots,
} from '../src/lib/characterSchema';

describe('decodeCharacterDoc — legacy migration', () => {
  it('migrates a legacy v1 document with JSON-string inventories', () => {
    const legacy = {
      id: 'prof_123',
      name: 'Aria',
      skin: 'blue',
      health: 80,
      gold: 250,
      xp: 1200,
      level: 7,
      kills: { slime: 12 },
      equipment: JSON.stringify([null, { type: 401, count: 1 }]),
      hotbar: JSON.stringify([{ type: 105, count: 1 }, null, { type: 202, count: 3 }]),
      backpack: JSON.stringify(Array(27).fill(null)),
      quests: JSON.stringify([{ id: 'q1', title: 'Getting Started', goal: 5, current: 2, completed: false }]),
      skills: JSON.stringify({ strength: 3, dexterity: 0, intelligence: 1 }),
      updatedAt: 1700000000000,
    };
    const { data, migrated } = decodeCharacterDoc(legacy);
    expect(migrated).toBe(true);
    expect(data.schemaVersion).toBe(CHARACTER_SCHEMA_VERSION);
    expect(data.id).toBe('prof_123');
    expect(data.name).toBe('Aria');
    expect(data.race).toBe('human'); // missing -> default
    expect(data.playerClass).toBe('warrior');
    expect(JSON.parse(data.hotbar)[0]).toEqual({ type: 105, count: 1 });
    expect(JSON.parse(data.hotbar)).toHaveLength(INVENTORY_SIZES.hotbar);
    expect(JSON.parse(data.backpack)).toHaveLength(INVENTORY_SIZES.backpack);
    expect(data.quests).toBeDefined();
    expect(JSON.parse(data.skills!)).toEqual({ strength: 3, dexterity: 0, intelligence: 1 });
    expect(data.revision).toBe(0); // legacy docs start at revision 0
  });

  it('survives garbage input by returning defaults', () => {
    for (const garbage of [undefined, null, 42, 'broken', []]) {
      const { data } = decodeCharacterDoc(garbage);
      expect(data.name).toBe('Player');
      expect(data.health).toBe(20);
      expect(data.level).toBe(1);
      expect(JSON.parse(data.hotbar)).toEqual(Array(INVENTORY_SIZES.hotbar).fill(null));
    }
  });

  it('clamps forged numbers into legal ranges', () => {
    const { data } = decodeCharacterDoc({
      health: 99999, gold: -50, xp: 'NaN', level: 9999, statPoints: -3, skillPoints: 1e12,
    });
    expect(data.health).toBe(100);
    expect(data.gold).toBe(0);
    expect(data.xp).toBe(0);
    expect(data.level).toBe(500);
    expect(data.statPoints).toBe(0);
    expect(data.skillPoints).toBe(10000);
  });

  it('rejects unknown races, classes and skins', () => {
    const { data } = decodeCharacterDoc({ race: 'dragon', playerClass: 'necromancer', skin: 'void' });
    expect(data.race).toBe('human');
    expect(data.playerClass).toBe('warrior');
    expect(data.skin).toBe('orange');
  });

  it('normalizes the legacy numeric kills bug to an empty map', () => {
    expect(decodeCharacterDoc({ kills: 0 }).data.kills).toEqual({});
    expect(decodeCharacterDoc({ kills: { slime: 5, boss: -2 } }).data.kills).toEqual({ slime: 5, boss: 0 });
  });

  it('drops invalid quests/keybinds so callers fall back to defaults', () => {
    const { data } = decodeCharacterDoc({
      quests: JSON.stringify({ not: 'an array' }),
      keybinds: 'corrupted',
      skills: '[1,2,3]',
    });
    expect(data.quests).toBeUndefined();
    expect(data.keybinds).toBeUndefined();
    expect(data.skills).toBeUndefined();
  });

  it('is idempotent once migrated', () => {
    const first = decodeCharacterDoc({ name: 'Aria', hotbar: '[{"type":105,"count":1}]' }).data;
    const second = decodeCharacterDoc(first);
    expect(second.migrated).toBe(false);
    expect(second.data).toEqual(first);
  });
});

describe('slot sanitization', () => {
  it('drops unknown item types, air, legacy fists and xp orbs', () => {
    expect(sanitizeSlot({ type: 99999, count: 1 })).toBeNull();
    expect(sanitizeSlot({ type: 0, count: 1 })).toBeNull();
    expect(sanitizeSlot({ type: 103, count: 1 })).toBeNull();
    expect(sanitizeSlot({ type: 999, count: 1 })).toBeNull();
    expect(sanitizeSlot({ type: 105, count: 1 })).toEqual({ type: 105, count: 1 });
  });

  it('clamps stack counts and keeps valid durability', () => {
    expect(sanitizeSlot({ type: 18, count: 500 })!.count).toBe(99);
    expect(sanitizeSlot({ type: 18, count: 0 })!.count).toBe(1);
    expect(sanitizeSlot({ type: 104, count: 1, durability: 42 })).toEqual({ type: 104, count: 1, durability: 42 });
  });

  it('keeps ability slots only with a real ability id', () => {
    // The in-memory shape the client places has no `type` at all.
    expect(sanitizeSlot({ isAbility: true, abilityId: 'slash' }))
      .toEqual({ type: ABILITY_SLOT_TYPE, count: 1, isAbility: true, abilityId: 'slash' });
    expect(sanitizeSlot({ isAbility: true })).toBeNull();
    expect(sanitizeSlot({ isAbility: true, abilityId: '' })).toBeNull();
    expect(sanitizeSlot({ isAbility: true, abilityId: 42 })).toBeNull();
    expect(sanitizeSlot({ isAbility: true, abilityId: 'Fire Ball!' })).toBeNull();
    expect(sanitizeSlot({ isAbility: true, abilityId: 'a'.repeat(41) })).toBeNull();
    // `isAbility` must be literally true; anything else is an ordinary item slot.
    expect(sanitizeSlot({ type: 105, count: 2, isAbility: 'yes', abilityId: 'slash' })).toEqual({ type: 105, count: 2 });
  });

  it('never lets an ability slot masquerade as an item', () => {
    // A stored `type` (real item id or garbage) is normalised to the marker, so
    // weapon/selection logic that reads `slot.type` sees empty hands.
    for (const type of [102, 999999, -1, 'sword', undefined]) {
      const slot = sanitizeSlot({ type, isAbility: true, abilityId: 'ground_slam' });
      expect(slot).toEqual({ type: ABILITY_SLOT_TYPE, count: 1, isAbility: true, abilityId: 'ground_slam' });
      expect(isAbilitySlot(slot)).toBe(true);
    }
    expect(isAbilitySlot({ type: 105, count: 1 })).toBe(false);
    expect(isAbilitySlot(null)).toBe(false);
    expect(isAbilitySlot({ isAbility: true, abilityId: '' })).toBe(false);
  });

  it('pads short arrays and truncates long ones to the declared size', () => {
    const slots = sanitizeSlots([{ type: 1, count: 1 }], 10);
    expect(slots).toHaveLength(10);
    expect(slots[0]).toEqual({ type: 1, count: 1 });
    expect(slots.slice(1)).toEqual(Array(9).fill(null));
    expect(sanitizeSlots(Array(50).fill({ type: 1, count: 1 }), 10)).toHaveLength(10);
  });

  it('sanitizes chest payloads the same way', () => {
    const inv = sanitizeInventoryPayload([{ type: 202, count: 2 }, 'junk', { type: 99999, count: 1 }], 27);
    expect(inv).toHaveLength(27);
    expect(inv[0]).toEqual({ type: 202, count: 2 });
    expect(inv[1]).toBeNull();
    expect(inv[2]).toBeNull();
  });
});

describe('createDefaultCharacterDoc / encodeCharacterFields', () => {
  it('creates complete v2 documents with every inventory sized correctly', () => {
    const doc = createDefaultCharacterDoc({ id: 'char_1', name: 'New Hero', race: 'elf', playerClass: 'mage', questsJson: '[{"id":"q1","title":"Getting Started","goal":5,"current":0,"completed":false}]' });
    expect(doc.schemaVersion).toBe(CHARACTER_SCHEMA_VERSION);
    expect(doc.race).toBe('elf');
    expect(doc.playerClass).toBe('mage');
    expect(JSON.parse(doc.hotbar)).toHaveLength(10);
    expect(JSON.parse(doc.equipment)).toHaveLength(2);
    expect(JSON.parse(doc.backpack)).toHaveLength(27);
    expect(JSON.parse(doc.quests!)).toHaveLength(1);
    expect(doc.revision).toBe(0);
    // Decoding a fresh doc is a no-op migration
    expect(decodeCharacterDoc(doc).migrated).toBe(false);
  });

  it('encodes save payloads with inventories stringified and sanitized', () => {
    const payload = encodeCharacterFields({
      name: 'Saver',
      health: 42,
      kills: { skeleton: 3 },
      hotbar: [{ type: 302, count: 1 }, { type: 999999, count: 1 }],
      backpack: Array(27).fill(null),
      equipment: [null, { type: 400, count: 1 }],
      quests: [{ id: 'q1', title: 'Getting Started', goal: 5, current: 5, completed: true }],
      updatedAt: 123456,
    });
    expect(payload.name).toBe('Saver');
    expect(payload.health).toBe(42);
    expect(payload.kills).toEqual({ skeleton: 3 });
    const hotbar = JSON.parse(payload.hotbar as string);
    expect(hotbar[0]).toEqual({ type: 302, count: 1 });
    expect(hotbar[1]).toBeNull(); // forged item type stripped
    expect(payload.updatedAt).toBe(123456);
    expect(payload.schemaVersion).toBe(CHARACTER_SCHEMA_VERSION);
    expect('revision' in payload).toBe(false);
  });

  it('keeps placed abilities on every action bar across save and reload', () => {
    // Regression: ability slots were dropped by the item-id check on save, so
    // every ability placed on a bar vanished on the next reload.
    const placed = { isAbility: true, abilityId: 'fireball' }; // exact client shape (no `type`)
    const hotbar = [placed, { type: 105, count: 1 }, ...Array(8).fill(null)];
    const leftActionBar = [null, { isAbility: true, abilityId: 'heal' }, ...Array(8).fill(null)];
    const rightActionBar = [...Array(9).fill(null), { isAbility: true, abilityId: 'teleport' }];
    const payload = encodeCharacterFields({ hotbar, leftActionBar, rightActionBar, backpack: [], equipment: [] });

    const expected = (id: string) => ({ type: ABILITY_SLOT_TYPE, count: 1, isAbility: true, abilityId: id });
    expect(JSON.parse(payload.hotbar as string)[0]).toEqual(expected('fireball'));
    expect(JSON.parse(payload.hotbar as string)[1]).toEqual({ type: 105, count: 1 });
    expect(JSON.parse(payload.leftActionBar as string)[1]).toEqual(expected('heal'));
    expect(JSON.parse(payload.rightActionBar as string)[9]).toEqual(expected('teleport'));

    // What Firestore hands back decodes to the same slots, and stays stable on a second pass.
    const { data } = decodeCharacterDoc({ ...payload, id: 'prof_1', revision: 3 });
    expect(JSON.parse(data.hotbar)[0]).toEqual(expected('fireball'));
    expect(JSON.parse(data.leftActionBar)[1]).toEqual(expected('heal'));
    expect(JSON.parse(data.rightActionBar)[9]).toEqual(expected('teleport'));
    const again = encodeCharacterFields({ ...data });
    expect(again.hotbar).toBe(payload.hotbar);
    expect(again.leftActionBar).toBe(payload.leftActionBar);
    expect(again.rightActionBar).toBe(payload.rightActionBar);
  });
});
