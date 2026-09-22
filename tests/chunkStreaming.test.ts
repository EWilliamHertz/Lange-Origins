import { describe, it, expect } from 'vitest';
import { generateWorld } from '../src/lib/world';
import { extractChunkFromWorld, compressChunk, decompressChunk, packChunkBatch, unpackChunkBatch, applyChunkToWorld, createEmptyChunkWorld, CHUNK_COLS, CHUNK_ROWS } from '../src/lib/chunk';

describe('chunk batch packing', () => {
  it('round-trips >10 chunks (socket.io attachment limit) byte-perfectly', () => {
    const world = generateWorld('public-lobby');
    const chunks: any[] = [];
    for (let cx = 0; cx < CHUNK_COLS; cx++) for (let cy = 0; cy < CHUNK_ROWS; cy++) {
      chunks.push({ cx, cy, data: compressChunk(extractChunkFromWorld(world, cx, cy)) });
    }
    const packed = packChunkBatch(chunks);
    expect(chunks.length).toBeGreaterThan(10); // would trip the old per-chunk attachment approach
    const unpacked = unpackChunkBatch(packed.manifest, packed.blob);
    expect(unpacked.length).toBe(chunks.length);

    const rebuilt = createEmptyChunkWorld();
    for (const c of unpacked) applyChunkToWorld(rebuilt, c.cx, c.cy, decompressChunk(c.data));
    expect(rebuilt.length).toBe(world.length);
    for (let x = 0; x < world.length; x++) {
      for (let y = 0; y < world[x].length; y++) {
        expect(rebuilt[x][y]).toBe(world[x][y]);
      }
    }
  });

  it('handles empty batches', () => {
    const packed = packChunkBatch([]);
    expect(packed.manifest).toEqual([]);
    expect(unpackChunkBatch(packed.manifest, packed.blob)).toEqual([]);
    expect(unpackChunkBatch(undefined, undefined)).toEqual([]);
  });

  it('keeps every batch to a single binary attachment', () => {
    // socket.io parsers reject packets with more than 10 binary attachments
    // ("too many attachments" -> transport "parse error"), which used to
    // disconnect clients the moment the server sent the world. One packed
    // batch = exactly one attachment, no matter how many chunks it holds.
    const chunks = Array.from({ length: 200 }, (_, i) => ({
      cx: i % 48,
      cy: Math.floor(i / 48) % 13,
      data: new Uint8Array(64).fill(i % 251 + 1),
    }));
    const packed = packChunkBatch(chunks);
    expect(packed.manifest.length).toBe(200);
    expect(packed.blob.length).toBe(200 * 64); // one flat buffer, not 200 attachments
    const unpacked = unpackChunkBatch(packed.manifest, packed.blob);
    expect(unpacked.length).toBe(200);
    for (let i = 0; i < 200; i++) {
      expect(Array.from(unpacked[i].data)).toEqual(Array.from(chunks[i].data));
      expect(unpacked[i].cx).toBe(chunks[i].cx);
      expect(unpacked[i].cy).toBe(chunks[i].cy);
    }
  });
});
