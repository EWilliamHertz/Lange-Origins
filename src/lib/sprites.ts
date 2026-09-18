// Sprite Manager & Atlas Loader for Lange: Origins
// Supports both individual sprite files and Atlas / Sprite Sheet grids

class SpriteManager {
  private cache = new Map<string, HTMLImageElement>();
  private failed = new Set<string>();

  /**
   * Load an image asset from URL with caching
   */
  getImage(src: string): HTMLImageElement | null {
    if (this.failed.has(src)) return null;
    const existing = this.cache.get(src);
    if (existing) {
      return existing.complete && existing.naturalWidth > 0 ? existing : null;
    }

    const img = new Image();
    img.src = src;
    img.onload = () => {
      this.cache.set(src, img);
    };
    img.onerror = () => {
      this.failed.add(src);
    };
    this.cache.set(src, img);
    return null;
  }

  /**
   * Check if a custom sprite exists in /public/sprites/
   */
  getBlockSprite(blockType: number): HTMLImageElement | null {
    return this.getImage(`/sprites/blocks/${blockType}.png`);
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
