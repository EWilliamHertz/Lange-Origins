/** Decode older saves without retaining state from the previous character. */
export function readSaved<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  try { return (typeof value === 'string' ? JSON.parse(value) : value) ?? fallback; }
  catch { return fallback; }
}

export function readSlots(value: unknown, size: number) {
  const slots = readSaved<any[]>(value, []);
  return Array.from({ length: size }, (_, i) => {
    const slot = Array.isArray(slots) ? slots[i] : null;
    // ID 103 is retained in the enum only for compatibility with legacy saves.
    return slot?.type === 103 ? null : slot ?? null;
  });
}

export function isUnarmed(type: number | null | undefined) {
  return type == null || type === 0 || type === 103;
}
