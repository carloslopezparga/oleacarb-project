import { describe, it, expect } from 'vitest';
import econ from '../src/data/economics.json';
import { runBatch, type MCConfig, type Tri } from '../src/lib/montecarlo';

const mc = econ.montecarlo;
const comunes = mc.comunes as unknown as MCConfig['comunes'];
const hoy: MCConfig = { modo: { price_hc: mc.hoy.price_hc as Tri, yield_hc: mc.hoy.yield_hc as Tri }, comunes };
const cond: MCConfig = { modo: { price_hc: mc.condicionado_al_hito_2.price_hc as Tri, yield_hc: mc.condicionado_al_hito_2.yield_hc as Tri }, comunes };
const pPos = (xs: number[]) => xs.filter(v => v > 0).length / xs.length;

describe('Monte Carlo (4.000 tiradas, mulberry32)', () => {
  it('«Hoy» queda a ±2 puntos del 14,9 % de la memoria', () => {
    const p = pPos(runBatch(mc.n, 7, hoy));
    expect(Math.abs(p - mc.resultados.hoy.p_pos)).toBeLessThanOrEqual(0.02);
  });
  it('«Condicionado al Hito 2» queda a ±2 puntos del 87,6 % de la memoria', () => {
    const p = pPos(runBatch(mc.n, 8, cond));
    expect(Math.abs(p - mc.resultados.condicionado.p_pos)).toBeLessThanOrEqual(0.02);
  });
});
