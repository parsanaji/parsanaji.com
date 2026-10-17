/** Small, fast, seedable PRNG (Tommy Ettinger's mulberry32). Returns uniform numbers in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** `?seed=123` pins the dot layout for screenshots; otherwise a fresh seed per page load. */
export function seedFromLocation(search: string, fallback: () => number = () => Date.now()): number {
  const raw = new URLSearchParams(search).get('seed');
  const n = raw === null ? Number.NaN : Number(raw);
  return Number.isFinite(n) ? n >>> 0 : fallback() >>> 0;
}
