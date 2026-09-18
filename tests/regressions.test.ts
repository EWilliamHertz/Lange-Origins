import { afterEach, describe, expect, it, vi } from 'vitest';
import { readSaved, readSlots, isUnarmed } from '../src/lib/profile';
import { notificationExpiresAt } from '../src/lib/notifications';
import { Sprites } from '../src/lib/sprites';
import { existsSync } from 'node:fs';

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('character save migration', () => {
  it('removes legacy fists without moving other slots', () => {
    expect(readSlots('[{"type":103,"count":1},{"type":101,"count":1}]', 3))
      .toEqual([null, { type: 101, count: 1 }, null]);
  });
  it('resets missing, corrupt and wrong-shaped inventory data', () => {
    for (const value of [undefined, 'broken', '{}', 'null']) {
      expect(readSlots(value, 10)).toEqual(Array(10).fill(null));
    }
    expect(readSaved(undefined, { strength: 0 })).toEqual({ strength: 0 });
    expect(readSaved('{"z":"heal"}', {})).toEqual({ z: 'heal' });
  });
  it('allows all representations of empty hands, but not held items', () => {
    for (const type of [null, undefined, 0, 103]) expect(isUnarmed(type)).toBe(true);
    for (const type of [1, 101, 111]) expect(isUnarmed(type)).toBe(false);
  });
});

it('expires quest and level toasts at five seconds, with more time for invitations', () => {
  expect(notificationExpiresAt({ type: 'system', timestamp: 100 })).toBe(5100);
  expect(notificationExpiresAt({ type: 'level_up', timestamp: 100 })).toBe(5100);
  expect(notificationExpiresAt({ type: 'trade', timestamp: 100 })).toBe(30100);
});

describe('character sprites', () => {
  it('resolves every race/class/armor combination to a shipped file', () => {
    for (const race of ['human', 'elf', 'dwarf', 'unknown']) {
      for (const cls of ['warrior', 'archer', 'mage', 'unknown']) {
        for (const armor of [null, 400, 401]) {
          const path = Sprites.getPlayerSpritePath(race, cls, armor);
          expect(existsSync(`public${path}`), path).toBe(true);
        }
      }
    }
    expect(Sprites.getPlayerSpritePath('elf', 'warrior', 401)).toBe('/assets/sprites/elf_warrior_none.png');
    expect(Sprites.getPlayerSpritePath('human', 'mage', 401)).toBe('/assets/sprites/human_mage_iron_armor.png');
  });
  it('retries failed loads after a cooldown instead of caching failure forever', () => {
    const images: any[] = [];
    vi.stubGlobal('Image', class { constructor() { images.push(this); } });
    const now = vi.spyOn(Date, 'now').mockReturnValue(1000);
    expect(Sprites.getImage('/retry-test.png')).toBeNull();
    images[0].onerror();
    Sprites.getImage('/retry-test.png');
    expect(images).toHaveLength(1);
    now.mockReturnValue(31001);
    Sprites.getImage('/retry-test.png');
    expect(images).toHaveLength(2);
  });
});
