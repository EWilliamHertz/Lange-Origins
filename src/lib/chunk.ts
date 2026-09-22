import { deflate, inflate } from 'pako';
import { BlockType, WORLD_WIDTH, WORLD_HEIGHT } from './constants';
import type { World } from './world';

export const CHUNK_SIZE = 32; // 32x32 tiles per chunk
export const CHUNK_COLS = Math.ceil(WORLD_WIDTH / CHUNK_SIZE); // 48 columns
export const CHUNK_ROWS = Math.ceil(WORLD_HEIGHT / CHUNK_SIZE); // 13 rows

export interface ChunkCoord {
  cx: number;
  cy: number;
}

export interface CompressedChunk {
  cx: number;
  cy: number;
  data: Uint8Array;
}

/**
 * Returns the chunk coordinates (cx, cy) containing the given tile coordinate (x, y).
 */
export function getChunkCoord(x: number, y: number): ChunkCoord {
  return {
    cx: Math.floor(x / CHUNK_SIZE),
    cy: Math.floor(y / CHUNK_SIZE)
  };
}

/**
 * Unique string key for chunk caching and lookup (e.g. "3_7").
 */
export function getChunkKey(cx: number, cy: number): string {
  return `${cx}_${cy}`;
}

/**
 * Parses a chunk key into numeric coordinates.
 */
export function parseChunkKey(key: string): ChunkCoord {
  const parts = key.split('_');
  return {
    cx: parseInt(parts[0], 10) || 0,
    cy: parseInt(parts[1], 10) || 0
  };
}

/**
 * Extracts a 32x32 chunk from a 2D World array into a compact Uint16Array (1024 elements).
 */
export function extractChunkFromWorld(world: World, cx: number, cy: number): Uint16Array {
  const chunk = new Uint16Array(CHUNK_SIZE * CHUNK_SIZE);
  const startX = cx * CHUNK_SIZE;
  const startY = cy * CHUNK_SIZE;

  for (let lx = 0; lx < CHUNK_SIZE; lx++) {
    const gx = startX + lx;
    const col = world[gx];
    for (let ly = 0; ly < CHUNK_SIZE; ly++) {
      const gy = startY + ly;
      const idx = lx + ly * CHUNK_SIZE;
      if (col && gy < WORLD_HEIGHT && col[gy] !== undefined) {
        chunk[idx] = col[gy];
      } else {
        chunk[idx] = BlockType.Air;
      }
    }
  }

  return chunk;
}

/**
 * Compresses chunk block data using ZIP/Deflate (pako).
 */
export function compressChunk(chunk: Uint16Array): Uint8Array {
  const rawBytes = new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);
  return deflate(rawBytes);
}

/**
 * Decompresses a ZIP/Deflated chunk back into a typed Uint16Array of block IDs.
 */
export function decompressChunk(compressed: Uint8Array | ArrayBuffer): Uint16Array {
  const raw = compressed instanceof Uint8Array ? compressed : new Uint8Array(compressed);
  const inflated = inflate(raw);
  const bufferCopy = inflated.buffer.slice(inflated.byteOffset, inflated.byteOffset + inflated.byteLength);
  return new Uint16Array(bufferCopy);
}

/**
 * Applies a decompressed chunk's block data into a local 2D World array.
 */
export function applyChunkToWorld(world: World, cx: number, cy: number, chunkData: Uint16Array): void {
  const startX = cx * CHUNK_SIZE;
  const startY = cy * CHUNK_SIZE;

  for (let lx = 0; lx < CHUNK_SIZE; lx++) {
    const gx = startX + lx;
    if (gx >= WORLD_WIDTH) continue;

    if (!world[gx]) {
      world[gx] = new Array(WORLD_HEIGHT).fill(BlockType.Air);
    }

    for (let ly = 0; ly < CHUNK_SIZE; ly++) {
      const gy = startY + ly;
      if (gy < WORLD_HEIGHT) {
        world[gx][gy] = chunkData[lx + ly * CHUNK_SIZE];
      }
    }
  }
}

/**
 * Creates an empty World 2D array structure ready for chunk population.
 */
export function createEmptyChunkWorld(): World {
  const world: World = new Array(WORLD_WIDTH);
  for (let x = 0; x < WORLD_WIDTH; x++) {
    world[x] = new Array(WORLD_HEIGHT).fill(BlockType.Air);
  }
  return world;
}

/**
 * Reference to one packed chunk inside a batch blob.
 * `size` is the byte length of this chunk's deflate stream within the blob.
 */
export interface PackedChunkRef {
  cx: number;
  cy: number;
  size: number;
}

/**
 * A batch of compressed chunks serialized as ONE binary blob plus a JSON
 * manifest. socket.io (parser >= 4.2.7) rejects packets carrying more than
 * 10 binary attachments, so batches of chunks must never be sent as a
 * separate attachment per chunk — they are concatenated into a single
 * Uint8Array instead, and the manifest records where each chunk starts.
 */
export interface PackedChunkBatch {
  manifest: PackedChunkRef[];
  blob: Uint8Array;
}

/**
 * Concatenates many compressed chunks into a single Uint8Array so the whole
 * batch fits in one socket.io binary attachment.
 */
export function packChunkBatch(chunks: Array<{ cx: number; cy: number; data: Uint8Array }>): PackedChunkBatch {
  const manifest: PackedChunkRef[] = [];
  let total = 0;
  for (const c of chunks) {
    const size = c?.data?.byteLength ?? 0;
    manifest.push({ cx: c?.cx ?? 0, cy: c?.cy ?? 0, size });
    total += size;
  }
  const blob = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    if (!c?.data?.byteLength) continue;
    blob.set(c.data, offset);
    offset += c.data.byteLength;
  }
  return { manifest, blob };
}

/**
 * Splits a packed batch back into individual compressed chunks
 * ({ cx, cy, data }) ready for decompressChunk()/applyChunkToWorld().
 */
export function unpackChunkBatch(
  manifest: PackedChunkRef[] | undefined | null,
  blob: Uint8Array | ArrayBuffer | undefined | null
): Array<{ cx: number; cy: number; data: Uint8Array }> {
  const out: Array<{ cx: number; cy: number; data: Uint8Array }> = [];
  if (!Array.isArray(manifest) || manifest.length === 0 || !blob) return out;
  const bytes = blob instanceof Uint8Array ? blob : new Uint8Array(blob);
  let offset = 0;
  for (const ref of manifest) {
    if (!ref || !Number.isFinite(ref.size) || ref.size < 0) continue;
    const data = bytes.subarray(offset, offset + ref.size);
    offset += ref.size;
    out.push({ cx: ref.cx, cy: ref.cy, data });
  }
  return out;
}
