export class Simple1DNoise {
  private vertices: number[];
  private MAX_VERTICES = 256;

  constructor(seed: number = 0) {
    this.vertices = [];
    
    // Mulberry32 PRNG
    let a = seed;
    const random = () => {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };

    for (let i = 0; i < this.MAX_VERTICES; i++) {
      this.vertices.push(random());
    }
  }

  private lerp(a: number, b: number, t: number): number {
    return a * (1 - t) + b * t;
  }

  public get(x: number): number {
    const scaledX = x;
    const xFloor = Math.floor(scaledX);
    const t = scaledX - xFloor;
    const tRemapSmoothstep = t * t * (3 - 2 * t);

    const xMin = xFloor % this.MAX_VERTICES;
    const xMax = (xMin + 1) % this.MAX_VERTICES;

    const y = this.lerp(
      this.vertices[xMin >= 0 ? xMin : xMin + this.MAX_VERTICES],
      this.vertices[xMax >= 0 ? xMax : xMax + this.MAX_VERTICES],
      tRemapSmoothstep
    );

    return y;
  }
}
