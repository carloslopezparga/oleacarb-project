/* Monte Carlo del VAN con las distribuciones de economics.json → montecarlo.
 * Triangulares (mín, moda, máx) e independientes; ayuda y retraso discretos.
 * PRNG con semilla (mulberry32) para que el resultado sea reproducible. */
import { simulate } from './sim';

export type Tri = [number, number, number];
export interface Discrete { valores: number[]; prob: number[] }
export interface MCConfig {
  modo: { price_hc: Tri; yield_hc: Tri };
  comunes: { capex_f: Tri; p_bone: Tri; p_el: Tri; aid_ier: Discrete; delay: Discrete };
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Inversa de la función de distribución triangular. */
export function triangular(u: number, [a, m, b]: Tri): number {
  if (b === a) return a;
  const c = (m - a) / (b - a);
  return u < c ? a + Math.sqrt(u * (b - a) * (m - a)) : b - Math.sqrt((1 - u) * (b - a) * (b - m));
}

export function discrete(u: number, d: Discrete): number {
  let acc = 0;
  for (let i = 0; i < d.valores.length; i++) { acc += d.prob[i]; if (u < acc) return d.valores[i]; }
  return d.valores[d.valores.length - 1];
}

/** Una tirada del modelo. La regla de ayudas (aid_test = 0,4 si aid_ier > 0) la aplica simulate(). */
export function draw(rand: () => number, cfg: MCConfig): number {
  const over = {
    price_hc: triangular(rand(), cfg.modo.price_hc),
    yield_hc: triangular(rand(), cfg.modo.yield_hc),
    capex_f: triangular(rand(), cfg.comunes.capex_f),
    p_bone: triangular(rand(), cfg.comunes.p_bone),
    p_el: triangular(rand(), cfg.comunes.p_el),
    aid_ier: discrete(rand(), cfg.comunes.aid_ier),
    delay: discrete(rand(), cfg.comunes.delay)
  };
  return simulate(over).npv;
}

export function runBatch(n: number, seed: number, cfg: MCConfig): number[] {
  const rand = mulberry32(seed);
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(draw(rand, cfg));
  return out;
}
