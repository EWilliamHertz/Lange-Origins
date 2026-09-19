export interface ElementLayout {
  x?: number;
  y?: number;
  rotation?: 0 | 90;
  visible?: boolean;
  isCustom?: boolean;
}

export interface HUDLayoutState {
  questTracker: ElementLayout;
  hotbar: ElementLayout;
  leftActionBar: ElementLayout;
  rightActionBar: ElementLayout;
  partyOverlay: ElementLayout;
  radar: ElementLayout;
  buffTray: ElementLayout;
}

export const DEFAULT_HUD_LAYOUT: HUDLayoutState = {
  questTracker: { x: undefined, y: undefined, visible: true, isCustom: false },
  hotbar: { x: undefined, y: undefined, rotation: 0, visible: true, isCustom: false },
  leftActionBar: { x: undefined, y: undefined, rotation: 0, visible: true, isCustom: false },
  rightActionBar: { x: undefined, y: undefined, rotation: 0, visible: true, isCustom: false },
  partyOverlay: { x: undefined, y: undefined, visible: true, isCustom: false },
  radar: { x: undefined, y: undefined, visible: true, isCustom: false },
  buffTray: { x: undefined, y: undefined, visible: true, isCustom: false },
};

const STORAGE_KEY = 'rpg_hud_layout_v2';

export function loadHUDLayout(): HUDLayoutState {
  if (typeof window === 'undefined') return DEFAULT_HUD_LAYOUT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_HUD_LAYOUT;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_HUD_LAYOUT,
      ...parsed,
    };
  } catch {
    return DEFAULT_HUD_LAYOUT;
  }
}

export function saveHUDLayout(layout: HUDLayoutState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // ignore
  }
}
