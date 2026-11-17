/** Gerador pseudoaleatório determinístico (mulberry32): mesma semente = mesmos resultados. */
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

/** Gera um número aleatório estável para um mês e um "canal" de sorteio. */
export function rngFor(seed: number, month: number, salt: number): () => number {
  return mulberry32((seed ^ Math.imul(month + 1, 2654435761) ^ Math.imul(salt + 7, 40503)) >>> 0);
}

export function newSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}
