/* Geometría de los dos PFD (escritorio y móvil vertical), en unidades de viewBox.
 * Los números de corriente y los caudales salen de process.json → streams. */
import process from '../data/process.json';

export type Kind = 'olive' | 'gray' | 'ion' | 'ochre' | 'terra';
// Código de color fijo (BRIEF §3.2): materia y producto oliva; calor y gases ocre; agua ion; minerales y rechazos gris; ácido terracota.
export const STREAM_KIND: Record<string, Kind> = {
  '1': 'olive', '2': 'gray', '3': 'olive', '4': 'ion', '5': 'olive', '6': 'ochre', '7': 'olive', '8': 'terra',
  '9': 'gray', '10': 'olive', '11': 'ochre', '12': 'olive', '13': 'olive', '14': 'olive', '15': 'olive', '16': 'ochre'
};

export interface Box { x: number; y: number; w: number; h: number }
export interface Stage extends Box { i: number; sub: string }
export interface Path { id: string; pts: [number, number][]; badge: number /* índice del tramo */; t?: number }
export interface Term { x: number; y: number; text: string; anchor: 'start' | 'middle' | 'end' }
export interface Layout {
  w: number; h: number;
  stages: Stage[]; hc: Box; ca: Box; act: Box; energy: Box;
  paths: Path[]; plain: [number, number][][]; loop: [number, number][][]; terms: Term[]; loopLabel: { x: number; y: number; anchor: 'start' | 'middle' | 'end' };
}

const SUB = ['3,0 t/h · NIR · criba', '11 → 2 % · 90–110 °C', '550 °C · N₂ · 45 min', 'HCl 2 M · 6 h', '1.300 °C · N₂', 'D50 5–10 µm', 'lotes de 10 t'];

// ---------- escritorio (1200 × 660) ----------
function deskStage(i: number, cx: number, cy: number): Stage { return { i, x: cx - 80, y: cy - 33, w: 160, h: 66, sub: SUB[i] }; }
export const desktop: Layout = {
  w: 1200, h: 660,
  stages: [deskStage(0, 210, 170), deskStage(1, 420, 170), deskStage(2, 630, 170), deskStage(3, 840, 170),
    deskStage(4, 840, 420), deskStage(5, 630, 420), deskStage(6, 420, 420)],
  hc: { x: 115, y: 391, w: 150, h: 58 },
  ca: { x: 115, y: 553, w: 150, h: 54 },
  act: { x: 550, y: 552, w: 160, h: 56 },
  energy: { x: 990, y: 252, w: 190, h: 100 },
  paths: [
    { id: '1', pts: [[24, 170], [130, 170]], badge: 0, t: 0.55 },
    { id: '2', pts: [[210, 203], [210, 292]], badge: 0 },
    { id: '3', pts: [[290, 170], [340, 170]], badge: 0 },
    { id: '4', pts: [[420, 137], [420, 64]], badge: 0 },
    { id: '5', pts: [[500, 170], [550, 170]], badge: 0 },
    { id: '6', pts: [[600, 203], [600, 300], [990, 300]], badge: 1, t: 0.33 },
    { id: '7', pts: [[710, 170], [760, 170]], badge: 0 },
    { id: '8', pts: [[840, 64], [840, 137]], badge: 0 },
    { id: '9', pts: [[920, 170], [1000, 170]], badge: 0 },
    { id: '10', pts: [[840, 203], [840, 387]], badge: 0, t: 0.75 },
    { id: '11', pts: [[920, 420], [1080, 420], [1080, 352]], badge: 0 },
    { id: '12', pts: [[760, 420], [710, 420]], badge: 0 },
    { id: '13', pts: [[340, 420], [265, 420]], badge: 0 },
    { id: '14', pts: [[630, 453], [630, 552]], badge: 0 },
    { id: '15', pts: [[550, 580], [265, 580]], badge: 0 },
    { id: '16', pts: [[710, 580], [1130, 580], [1130, 352]], badge: 0, t: 0.6 }
  ],
  plain: [[[550, 420], [500, 420]], [[115, 420], [40, 420]], [[115, 580], [40, 580]]],
  loop: [
    [[1040, 252], [1040, 236], [420, 236], [420, 203]],
    [[660, 236], [660, 203]],
    [[1010, 352], [1010, 512], [690, 512], [690, 552]]
  ],
  loopLabel: { x: 852, y: 229, anchor: 'start' },
  terms: [
    { x: 24, y: 152, text: 'hueso recibido', anchor: 'start' },
    { x: 210, y: 312, text: 'árido', anchor: 'middle' },
    { x: 420, y: 52, text: 'atmósfera', anchor: 'middle' },
    { x: 840, y: 52, text: 'depósitos APQ', anchor: 'middle' },
    { x: 1006, y: 175, text: 'sales', anchor: 'start' },
    { x: 40, y: 410, text: 'clientes', anchor: 'start' },
    { x: 40, y: 570, text: 'clientes', anchor: 'start' }
  ]
};

// ---------- móvil vertical (360 × 1070) ----------
const MX = 150;
function mobStage(i: number, cy: number): Stage { return { i, x: MX - 88, y: cy - 29, w: 176, h: 58, sub: SUB[i] }; }
const Y = [110, 230, 350, 470, 590, 710, 830];
export const mobile: Layout = {
  w: 360, h: 1070,
  stages: Y.map((y, i) => mobStage(i, y)),
  hc: { x: MX - 88, y: 912, w: 176, h: 50 },
  ca: { x: 236, y: 880, w: 0, h: 0 },
  act: { x: 246, y: 764, w: 104, h: 38 },
  energy: { x: 40, y: 1000, w: 300, h: 56 },
  paths: [
    { id: '1', pts: [[MX, 30], [MX, 81]], badge: 0 },
    { id: '2', pts: [[238, 110], [296, 110]], badge: 0 },
    { id: '3', pts: [[MX, 139], [MX, 201]], badge: 0 },
    { id: '4', pts: [[238, 230], [296, 230]], badge: 0 },
    { id: '5', pts: [[MX, 259], [MX, 321]], badge: 0 },
    { id: '6', pts: [[238, 350], [296, 350]], badge: 0 },
    { id: '7', pts: [[MX, 379], [MX, 441]], badge: 0 },
    { id: '8', pts: [[296, 488], [238, 488]], badge: 0 },
    { id: '9', pts: [[238, 456], [296, 456]], badge: 0 },
    { id: '10', pts: [[MX, 499], [MX, 561]], badge: 0 },
    { id: '11', pts: [[238, 590], [296, 590]], badge: 0 },
    { id: '12', pts: [[MX, 619], [MX, 681]], badge: 0 },
    { id: '13', pts: [[MX, 859], [MX, 912]], badge: 0 },
    { id: '14', pts: [[238, 710], [298, 710], [298, 764]], badge: 0 },
    { id: '15', pts: [[272, 802], [272, 866]], badge: 0 },
    { id: '16', pts: [[330, 802], [330, 836]], badge: 0 }
  ],
  plain: [[[MX, 739], [MX, 801]]],
  loop: [
    [[40, 1028], [22, 1028], [22, 230], [62, 230]],
    [[22, 350], [62, 350]]
  ],
  loopLabel: { x: 190, y: 1086, anchor: 'middle' },
  terms: [
    { x: MX, y: 18, text: 'hueso de proveedores y El Tejar', anchor: 'middle' },
    { x: 302, y: 115, text: 'árido', anchor: 'start' },
    { x: 302, y: 235, text: 'vapor', anchor: 'start' },
    { x: 302, y: 355, text: 'oxidador', anchor: 'start' },
    { x: 302, y: 461, text: 'sales', anchor: 'start' },
    { x: 302, y: 493, text: 'HCl', anchor: 'start' },
    { x: 302, y: 595, text: 'oxidador', anchor: 'start' },
    { x: 272, y: 886, text: 'carbón activo', anchor: 'middle' },
    { x: 330, y: 852, text: 'oxidador', anchor: 'middle' }
  ]
};

export const streams = Object.fromEntries(process.streams.map(s => [s.id, s]));

/** Grosor y periodo de las partículas con el logaritmo del caudal (t/año). */
export function flowStyle(ta: number) {
  const L = Math.log10(Math.max(ta, 100)) - 2;          // 0 (100 t) … 2,4 (24.157 t)
  const width = 1.1 + 1.55 * L;                           // 1,1 … 4,8
  const speed = 20 + 24 * L;                               // px/s: 20 … 78
  const gap = 16;
  return { width, dot: width + 2.6, dur: gap / speed, gap };
}

export function toD(pts: [number, number][]): string {
  return pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ',' + p[1]).join(' ');
}

/** Punto para la etiqueta del número de corriente: en el tramo indicado, a la fracción t. */
export function badgeAt(p: Path): [number, number] {
  const a = p.pts[p.badge], b = p.pts[p.badge + 1], t = p.t ?? 0.5;
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
