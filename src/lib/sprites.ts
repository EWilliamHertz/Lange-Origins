// Resolve only shipped character assets; missing variants fall back before requesting.
const playerAssets = new Set(Object.keys(import.meta.glob('/public/assets/sprites/*.png')).map(path => path.replace('/public', '')));

// Sprite Manager & Atlas Loader for Lange: Origins
// Supports both individual sprite files and Atlas / Sprite Sheet grids

class SpriteManager {
  private cache = new Map<string, HTMLImageElement>();
  private failed = new Map<string, number>();

  /**
   * Load an image asset from URL with caching
   */
  getImage(src: string): HTMLImageElement | null {
    if (Date.now() < (this.failed.get(src) || 0)) return null;
    this.failed.delete(src);
    const existing = this.cache.get(src);
    if (existing) {
      return existing.complete && existing.naturalWidth > 0 ? existing : null;
    }

    const img = new Image();
    img.onload = () => {
      this.cache.set(src, img);
    };
    img.onerror = () => {
      this.cache.delete(src);
      this.failed.set(src, Date.now() + 30000);
    };
    this.cache.set(src, img);
    img.src = src;
    return null;
  }

  /**
   * Check if a custom sprite exists in /sprites/blocks/
   */
  getBlockSprite(blockType: number): HTMLImageElement | null {
    return this.getImage(`/sprites/blocks/${blockType}.png`);
  }

  /**
   * Determine the sprite path for a character based on race, class, and armor tier
   */
  getPlayerSpritePath(race: string = 'human', pClass: string = 'warrior', chestTier: number | null = null): string {
    let equipStr = 'none';
    if (chestTier === 401 || chestTier === 408 || chestTier === 410) equipStr = 'iron_armor';
    else if (chestTier) equipStr = 'leather_tunic';
    const r = (race || 'human').toLowerCase();
    const c = (pClass || 'warrior').toLowerCase();
    return [
      `/assets/sprites/${r}_${c}_${equipStr}.png`,
      `/assets/sprites/${r}_${c}_none.png`,
      `/assets/sprites/human_${c}_none.png`,
      '/assets/sprites/human_warrior_none.png',
    ].find(path => playerAssets.has(path)) || '/assets/sprites/human_warrior_none.png';
  }

  /**
   * Get loaded player sprite with graceful fallback chain
   */
  getPlayerSprite(race: string = 'human', pClass: string = 'warrior', chestTier: number | null = null): HTMLImageElement | null {
    const primaryPath = this.getPlayerSpritePath(race, pClass, chestTier);
    const primaryImg = this.getImage(primaryPath);
    if (primaryImg) return primaryImg;

    // If specific armor variant is missing or loading, attempt unarmored sprite
    const r = (race || 'human').toLowerCase();
    const c = (pClass || 'warrior').toLowerCase();
    if (primaryPath.includes('iron_armor') || primaryPath.includes('leather_tunic')) {
      const unarmoredImg = this.getImage(`/assets/sprites/${r}_${c}_none.png`);
      if (unarmoredImg) return unarmoredImg;
    }

    // If race is missing (e.g. dwarf/elf variants deleted), fallback to human class sprite
    if (r !== 'human') {
      const humanImg = this.getImage(`/assets/sprites/human_${c}_none.png`);
      if (humanImg) return humanImg;
      const humanBase = this.getImage(`/assets/sprites/human_warrior_none.png`);
      if (humanBase) return humanBase;
    }

    return null;
  }

  /**
   * Draw a sprite or atlas frame onto canvas, returns true if drawn successfully
   */
  drawSprite(
    ctx: CanvasRenderingContext2D,
    src: string,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    sx?: number,
    sy?: number,
    sw?: number,
    sh?: number
  ): boolean {
    const img = this.getImage(src);
    if (!img) return false;

    if (sx !== undefined && sy !== undefined && sw !== undefined && sh !== undefined) {
      ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
    } else {
      ctx.drawImage(img, dx, dy, dw, dh);
    }
    return true;
  }
}

export const Sprites = new SpriteManager();
