export interface KeybindMap {
  moveLeft: string;
  moveRight: string;
  jump: string;
  dropPlatform: string;
  sprint: string;
  toggleMenu: string;
  questLog: string;
  ability1: string;
  ability2: string;
  ability3: string;
  ability4: string;
  dropItem: string;
}

export const DEFAULT_KEYBINDS: KeybindMap = {
  moveLeft: 'a',
  moveRight: 'd',
  jump: 'w',
  dropPlatform: 's',
  sprint: 'shift',
  toggleMenu: 'e',
  questLog: 'q',
  ability1: '1',
  ability2: '2',
  ability3: '3',
  ability4: '4',
  dropItem: 'x',
};

export const KEYBIND_LABELS: Record<keyof KeybindMap, string> = {
  moveLeft: 'Move Left',
  moveRight: 'Move Right',
  jump: 'Jump',
  dropPlatform: 'Drop Through Platform',
  sprint: 'Sprint',
  toggleMenu: 'Character & Bag Menu',
  questLog: 'World Chronicle (Quests)',
  ability1: 'Action Slot 1',
  ability2: 'Action Slot 2',
  ability3: 'Action Slot 3',
  ability4: 'Action Slot 4',
  dropItem: 'Toss Held Item',
};

const STORAGE_KEY = 'lange_keybinds_v1';

export function loadKeybinds(): KeybindMap {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_KEYBINDS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_KEYBINDS, ...parsed };
    }
  } catch (e) {}
  return { ...DEFAULT_KEYBINDS };
}

export function saveKeybinds(binds: KeybindMap): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(binds));
    window.dispatchEvent(new CustomEvent('keybinds_updated', { detail: binds }));
  } catch (e) {}
}

export function resetKeybinds(): KeybindMap {
  saveKeybinds(DEFAULT_KEYBINDS);
  return { ...DEFAULT_KEYBINDS };
}
