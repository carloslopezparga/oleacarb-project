/* Geometría del Sankey de materia y energía, calculada en la compilación con d3-sankey.
 * La línea principal va abajo (escritorio) o a la izquierda (móvil) y las salidas se separan de ella,
 * como en la figura de la memoria. Las posiciones de los nodos se fijan aquí; d3-sankey calcula las bandas.
 * Cada banda se reduce a seis números (x0, y0a, y0b, x1, y1a, y1b) para poder interpolar entre modos. */
import { sankey } from 'd3-sankey';
import balances from '../data/balances.json';
import { num } from './format';

export type Mode = 'mass' | 'energy';
export type Orient = 'h' | 'v';
export interface Band { g: number[]; v: number; cls: string; label: string; value: string; pct: string; hc?: boolean }
export interface Label { x: number; y: number; lines: string[]; strong?: boolean; sub?: boolean }
export interface Node { x: number; y: number; w: number; h: number; cls: string; name: string; hc?: boolean; label: Label }
export interface Geo { w: number; h: number; bands: Band[]; nodes: Node[] }

const CLS: Record<string, string> = {
  'Hueso recibido': 'olive', 'Agua evaporada': 'ion', 'Rechazos → árido': 'gray', 'Hueso seco a pirólisis': 'olive',
  'Volátiles → oxidador': 'ochre', 'Carbonizado': 'olive', 'Minerales → sales': 'gray', 'Carbonizado lavado': 'olive',
  'Gases de carbonización → oxidador': 'ochre', 'Carbonizado a 1.300 °C': 'olive', 'HARD CARBON': 'hc', 'Finos': 'olive',
  'Carbón activo': 'olive', 'Gases de activación → oxidador': 'ochre',
  'Gases de proceso': 'ochre', 'Calor útil en aceite térmico': 'ochre', 'Pérdidas por humos': 'gray', 'Calor de proceso': 'ochre',
  'Entrada al ORC': 'ochre', 'Electricidad ORC': 'ion', 'Calor a 80 °C': 'ochre'
};
const pretty = (n: string) => (n === 'HARD CARBON' ? 'Hard carbon' : n);

/* Posición de cada nodo: [depth, breadth] = [x, y] en escritorio y [y, x] en móvil (ambas en px del viewBox).
 * side: dónde va el rótulo. short: nombre corto para el móvil. */
type Side = 'right' | 'above' | 'below' | 'over';
interface Spec { at: [number, number]; side: Side; short?: string; sub?: string }
const SPEC: Record<Mode, Record<Orient, { w: number; h: number; total: number; nw: number; nodes: Record<string, Spec> }>> = {
  mass: {
    h: { w: 1000, h: 520, total: 300, nw: 9, nodes: {
      'Hueso recibido': { at: [0, 150], side: 'below' },
      'Agua evaporada': { at: [205, 26], side: 'right' },
      'Rechazos → árido': { at: [205, 72], side: 'right' },
      'Hueso seco a pirólisis': { at: [205, 188], side: 'below', short: 'Hueso seco' },
      'Volátiles → oxidador': { at: [400, 116], side: 'right', sub: `al oxidador: todo el calor de la planta y ${num(balances.energy.electricidad.orc_MWh / 1000, 2)} GWh eléctricos` },
      'Carbonizado': { at: [400, 396], side: 'below' },
      'Carbonizado lavado': { at: [510, 397.5], side: 'below', short: 'Lavado' },
      'Carbonizado a 1.300 °C': { at: [610, 406], side: 'below', short: 'A 1.300 °C' },
      'Finos': { at: [700, 470], side: 'below' },
      'Minerales → sales': { at: [780, 318], side: 'right' },
      'Gases de carbonización → oxidador': { at: [780, 342], side: 'right' },
      'HARD CARBON': { at: [780, 375], side: 'right' },
      'Carbón activo': { at: [780, 448], side: 'right' },
      'Gases de activación → oxidador': { at: [780, 474], side: 'right' }
    } },
    v: { w: 360, h: 960, total: 150, nw: 8, nodes: {
      'Hueso recibido': { at: [40, 16], side: 'above' },
      'Hueso seco a pirólisis': { at: [190, 16], side: 'over', short: 'Hueso seco' },
      'Agua evaporada': { at: [190, 182], side: 'below', short: 'Agua' },
      'Rechazos → árido': { at: [190, 282], side: 'below', short: 'Rechazos' },
      'Carbonizado': { at: [350, 16], side: 'over' },
      'Volátiles → oxidador': { at: [350, 182], side: 'below', short: 'Volátiles' },
      'Carbonizado lavado': { at: [480, 16], side: 'over', short: 'Lavado' },
      'Minerales → sales': { at: [480, 182], side: 'below', short: 'Minerales' },
      'Carbonizado a 1.300 °C': { at: [600, 16], side: 'over', short: 'A 1.300 °C' },
      'Gases de carbonización → oxidador': { at: [600, 182], side: 'below', short: 'Gases' },
      'HARD CARBON': { at: [720, 16], side: 'below' },
      'Finos': { at: [720, 182], side: 'below' },
      'Carbón activo': { at: [840, 182], side: 'below' },
      'Gases de activación → oxidador': { at: [840, 282], side: 'below', short: 'Gases' }
    } }
  },
  energy: {
    h: { w: 1000, h: 520, total: 300, nw: 9, nodes: {
      'Gases de proceso': { at: [0, 150], side: 'below' },
      'Pérdidas por humos': { at: [260, 60], side: 'right' },
      'Calor útil en aceite térmico': { at: [260, 195], side: 'below', short: 'Calor útil en aceite' },
      'Calor de proceso': { at: [520, 112], side: 'right', sub: 'pirólisis, secaderos y activación' },
      'Entrada al ORC': { at: [520, 261], side: 'below' },
      'Electricidad ORC': { at: [760, 222], side: 'right' },
      'Calor a 80 °C': { at: [760, 291], side: 'right', sub: 'secado del hueso y aerorrefrigeración' }
    } },
    v: { w: 360, h: 960, total: 150, nw: 8, nodes: {
      'Gases de proceso': { at: [40, 16], side: 'above' },
      'Calor útil en aceite térmico': { at: [250, 16], side: 'over', short: 'Calor útil' },
      'Pérdidas por humos': { at: [250, 190], side: 'below', short: 'Pérdidas' },
      'Entrada al ORC': { at: [460, 16], side: 'over', short: 'Entrada ORC' },
      'Calor de proceso': { at: [460, 190], side: 'below', short: 'Calor de proceso' },
      'Calor a 80 °C': { at: [670, 16], side: 'below' },
      'Electricidad ORC': { at: [670, 190], side: 'below', short: 'Electricidad' }
    } }
  }
};

interface SNode { name: string; x0?: number; x1?: number; y0?: number; y1?: number; value?: number }
interface SLink { source: SNode | number; target: SNode | number; value: number; y0?: number; y1?: number; width?: number }

function build(mode: Mode, orient: Orient): Geo {
  const src = mode === 'mass' ? balances.mass : balances.energy;
  const unit = mode === 'mass' ? 't' : 'GWh';
  const dec = (v: number) => (mode === 'mass' ? 0 : v < 10 ? 2 : 1);
  const spec = SPEC[mode][orient];
  const names = src.nodes as string[];
  const raw = (src.links as [string, string, number][]);
  // Entrada total: el primer nodo (hueso recibido, 24.157 t; gases de proceso, 77,6 GWh)
  const input = raw.filter(l => l[0] === names[0]).reduce((s, l) => s + l[2], 0);
  const k = spec.total / input;   // px por unidad: la entrada mide spec.total px

  const gen = sankey<SNode, SLink>().nodeWidth(spec.nw).nodePadding(4).nodeSort(null as never).iterations(0)
    .extent([[0, 0], [1000, 1000]]);
  const g = gen({ nodes: names.map(name => ({ name })), links: raw.map(([a, b, v]) => ({ source: names.indexOf(a), target: names.indexOf(b), value: v })) });
  for (const n of g.nodes) {
    const s = spec.nodes[n.name];
    n.x0 = s.at[0]; n.x1 = s.at[0] + spec.nw;
    n.y0 = s.at[1]; n.y1 = s.at[1] + (n.value ?? 0) * k;
  }
  for (const l of g.links) l.width = l.value * k;
  // update() no reordena: cada nodo apila sus bandas según la posición del otro extremo, para que no se crucen.
  for (const n of g.nodes as (SNode & { sourceLinks: SLink[]; targetLinks: SLink[] })[]) {
    n.sourceLinks.sort((a, b) => (a.target as SNode).y0! - (b.target as SNode).y0!);
    n.targetLinks.sort((a, b) => (a.source as SNode).y0! - (b.source as SNode).y0!);
  }
  gen.update(g);

  const bands: Band[] = g.links.map(l => {
    const s = l.source as SNode, t = l.target as SNode, w = l.width ?? 0;
    return {
      g: [s.x1!, l.y0! - w / 2, l.y0! + w / 2, t.x0!, l.y1! - w / 2, l.y1! + w / 2],
      v: l.value, cls: CLS[t.name], hc: t.name === 'HARD CARBON',
      label: `${pretty(s.name)} → ${pretty(t.name)}`,
      value: `${num(l.value, mode === 'mass' ? 0 : 2)} ${unit}/año`,
      pct: `${num(l.value / input * 100, 1)} %`
    };
  });
  const nodes: Node[] = g.nodes.map(n => {
    const s = spec.nodes[n.name];
    const value = `${num(n.value ?? 0, dec(n.value ?? 0))} ${unit}`;
    const name = orient === 'v' ? (s.short ?? pretty(n.name)) : pretty(n.name);
    // en el dibujo vertical se cambian los ejes
    const [x, y, w, h] = orient === 'h' ? [n.x0!, n.y0!, n.x1! - n.x0!, n.y1! - n.y0!] : [n.y0!, n.x0!, n.y1! - n.y0!, n.x1! - n.x0!];
    let label: Label;
    const short = s.short ?? pretty(n.name);
    if (s.side === 'right') label = { x: x + w + 8, y: y + h / 2 + (s.sub ? -3 : 4.5), lines: [`${name} · ${value}`, ...(s.sub ? [s.sub] : [])], sub: !!s.sub };
    else if (s.side === 'above') label = { x, y: y - 10, lines: [`${name} · ${value}`] };
    else if (s.side === 'over') label = { x: x + 8, y: y + h + 20, lines: [`${short} · ${value}`] };
    else label = { x, y: y + h + 18, lines: [orient === 'h' ? short : name, value] };
    return { x, y, w, h, cls: n.name === 'HARD CARBON' ? 'hc' : CLS[n.name], hc: n.name === 'HARD CARBON', name, label: { ...label, strong: n.name === 'HARD CARBON' } };
  });
  return { w: spec.w, h: spec.h, bands, nodes };
}

export const sankeyGeo = {
  mass: { h: build('mass', 'h'), v: build('mass', 'v') },
  energy: { h: build('energy', 'h'), v: build('energy', 'v') }
};

/** Camino de una banda a partir de sus seis números, en horizontal o en vertical. */
export function bandPath(g: number[], orient: Orient): string {
  const [x0, a0, b0, x1, a1, b1] = g, xm = (x0 + x1) / 2;
  if (orient === 'h') return `M${x0},${a0}C${xm},${a0} ${xm},${a1} ${x1},${a1}L${x1},${b1}C${xm},${b1} ${xm},${b0} ${x0},${b0}Z`;
  return `M${a0},${x0}C${a0},${xm} ${a1},${xm} ${a1},${x1}L${b1},${x1}C${b1},${xm} ${b0},${xm} ${b0},${x0}Z`;
}
export function bandCenter(g: number[], orient: Orient): string {
  const [x0, a0, b0, x1, a1, b1] = g, xm = (x0 + x1) / 2, c0 = (a0 + b0) / 2, c1 = (a1 + b1) / 2;
  if (orient === 'h') return `M${x0},${c0}C${xm},${c0} ${xm},${c1} ${x1},${c1}`;
  return `M${c0},${x0}C${c0},${xm} ${c1},${xm} ${c1},${x1}`;
}
