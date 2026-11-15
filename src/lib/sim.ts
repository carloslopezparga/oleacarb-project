/* Capa fina sobre el modelo: aplica las correcciones de la memoria sobre BASE y la regla de ayudas.
 * No contiene ninguna fórmula económica: todo el cálculo está en model.ts. */
import { BASE, run, breakeven, YEARS, type Overrides, type RunResult } from './model';
import { base_overrides } from '../data/model.test.json';

// civil_pec = 8.712899838299998 y cost_staff = 47008.35 (memoria, modelo revisado).
Object.assign(BASE, base_overrides);

/** Regla de la memoria: si hay ayuda regional a la inversión, la Fase 1 recibe el 40 % para el equipo de ensayo. */
export function withAidRule(over: Overrides): Overrides {
  const o: Overrides = { ...over };
  if (o.aid_ier !== undefined) o.aid_test = o.aid_ier > 0 ? 0.4 : 0;
  return o;
}

export interface SimState { price_hc: number; yield_hc: number; ms: number; capex_f: number; p_bone: number; aid_ier: number }

export function overridesFromState(s: SimState): Overrides {
  return withAidRule({ price_hc: s.price_hc, yield_hc: s.yield_hc, ms: s.ms, capex_f: s.capex_f, p_bone: s.p_bone, aid_ier: s.aid_ier });
}

export function simulate(over: Overrides): RunResult { return run(withAidRule(over)); }
export function minPrice(over: Overrides): number { return breakeven(withAidRule(over)); }

export { BASE, YEARS, run, breakeven };
export type { Overrides, RunResult };
