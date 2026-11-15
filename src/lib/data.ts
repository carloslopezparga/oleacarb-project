/* Acceso tipado a src/data/*.json y cifras derivadas.
 * Regla: ninguna cifra inventada. Lo que no está tal cual en los JSON se calcula aquí con su fórmula. */
import key from '../data/key-figures.json';
import process from '../data/process.json';
import balances from '../data/balances.json';
import plant from '../data/plant.json';
import territory from '../data/territory.json';
import economics from '../data/economics.json';
import timeline from '../data/timeline.json';
import impact from '../data/impact.json';

export { key, process, balances, plant, territory, economics, timeline, impact };

/* ---------- por tonelada (process.json → por_tonelada, caso de diseño 14 %) ---------- */
const pt = process.por_tonelada;
export const tonne = {
  rechazos: pt.rechazos,                                   // 20,0 kg
  tras_recepcion: 1000 - pt.rechazos,                      // 1.000 − 20,0 = 980,0 kg
  agua: pt.agua_evaporada,                                 // 107,8 kg
  a_pirolisis: pt.a_pirolisis,                             // 872,2 kg
  volatiles: pt.volatiles,                                 // 693,4 kg
  carbonizado: pt.carbonizado,                             // 178,8 kg
  minerales: pt.minerales,                                 // 5,4 kg
  lavado: pt.lavado,                                       // 173,4 kg
  gases_carb: pt.gases_carbonizacion,                      // 29,5 kg
  c1300: pt.carbonizado_1300,                              // 144,0 kg
  finos: pt.finos,                                         // 19,4 kg
  carbon_activo: pt.carbon_activo,                         // 7,9 kg
  hc: pt.hard_carbon,                                      // 124,6 kg
  T: pt.temperaturas_C
};

/* kWh de celda que da el hard carbon de una tonelada, con 1,2–1,5 kg de hard carbon por kWh (SMM, SPIR). */
export const KG_PER_KWH = { lo: 1.2, hi: 1.5 };
export const tonneKWh = { lo: tonne.hc / KG_PER_KWH.hi, hi: tonne.hc / KG_PER_KWH.lo }; // 124,6/1,5 = 83,1 · 124,6/1,2 = 103,8

/* GWh de celdas al año que abastece la planta: t/año ÷ (kg/kWh) → MWh → GWh. */
export const plantGWh = {
  d14: { lo: key.hc_t_diseno_14 / KG_PER_KWH.hi / 1000, hi: key.hc_t_diseno_14 / KG_PER_KWH.lo / 1000 },   // 3.010/1,5 = 2,0 · 3.010/1,2 = 2,5
  o15: { lo: key.hc_t_objetivo_15 / KG_PER_KWH.hi / 1000, hi: key.hc_t_objetivo_15 / KG_PER_KWH.lo / 1000 } // 3.225/1,5 = 2,2 · 3.225/1,2 = 2,7
};

/* ---------- valor del hueso ---------- */
// Coste del hueso seco puesto en planta (modelo): (25 % de El Tejar a 140 €/t + 75 % a 150 €/t + 12,6 €/t de porte) ÷ 0,89 de materia seca.
export const boneCostPerT = (0.25 * 140 + 0.75 * (150 + 12.6)) / 0.89;   // 176,35 €/t
// Ventas de un año tipo (2037, caso C) entre el hueso seco: 21,98 M€ ÷ 21.500 t.
export const valuePerKgDry = economics.scenarios.C.kpi.sales37 * 1e6 / key.hueso_seco_t / 1000; // 1,02 €/kg
export const FUEL_PRICE_EUR_KG = 0.204; // AVEBIOM 2T-2026: 204 €/t sin IVA, entregado

/* ---------- territorio ---------- */
export const supplyTowns = Object.entries(territory.towns)
  .filter(([, t]) => t.supply_t)
  .map(([name, t]) => ({ name, ...t, supply_t: t.supply_t as number }))
  .sort((a, b) => b.supply_t - a.supply_t);
export const supplyTotal = supplyTowns.reduce((s, t) => s + t.supply_t, 0); // 24.000 t/año

/* ---------- electricidad (balances.json → energy.electricidad) ---------- */
const el = balances.energy.electricidad;
export const elec = {
  totalGWh: el.total_MWh / 1000,                   // 12,71 GWh
  orc: el.orc_MWh / el.total_MWh,                  // 62,6 %
  fv: el.fv_MWh / el.total_MWh,                    // 10,4 %
  red: el.red_MWh / el.total_MWh                   // 27,0 %
};

/* ---------- impacto ---------- */
const fp = impact.footprint_kgCO2_per_kg;
export const footprintRatio = {
  coco: fp[1].v / fp[0].v,      // 2,6 / 0,205 = 12,7 → «unas 13 veces menos»
  grafito: fp[2].v / fp[0].v    // 25,1 / 0,205 = 122 → «unas 120 veces menos»
};

/* ---------- proceso: equipos por etapa ---------- */
type Equip = (typeof process.equipment)[number];
const byArea = (a: string) => process.equipment.filter(e => e.area === a);
export const stageEquipment: Equip[][] = [
  byArea('100'),
  byArea('200'),
  byArea('300'),
  byArea('400'),
  byArea('500'),
  [...byArea('600').filter(e => e.tag !== 'EV-601'), ...byArea('700')],   // molienda, clasificación y activación de finos
  [...process.equipment.filter(e => e.tag === 'EV-601'), ...byArea('900')] // envasado y laboratorio de lote
];

/* ---------- calendario ---------- */
export const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const monthLabel = (m: number) => `${MONTHS[m % 12]}-${2027 + Math.floor(m / 12)}`;
