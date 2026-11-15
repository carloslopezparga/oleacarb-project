/* Formato numérico español para toda la web.
 * - Miles con punto también en números de cuatro cifras (3.010), que Intl no agrupa por defecto en es-ES.
 * - Decimales con coma.
 * - Signo menos tipográfico U+2212.
 * - Espacio fino de no separación (U+202F) entre cifra y unidad.
 */

export const THIN = ' ';   // espacio fino duro, entre cifra y unidad
export const NBSP = ' ';
export const MINUS = '−';

const cache = new Map<number, Intl.NumberFormat>();
function nf(d: number): Intl.NumberFormat {
  let f = cache.get(d);
  if (!f) {
    f = new Intl.NumberFormat('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: false });
    cache.set(d, f);
  }
  return f;
}

function group(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Número en formato español sin signo «+». Devuelve «—» si no es finito. */
export function num(x: number | null | undefined, d = 0): string {
  if (x === null || x === undefined || !Number.isFinite(x)) return '—';
  const s = nf(d).format(Math.abs(x));           // «3010» o «61,6»
  const [i, f] = s.split(',');
  const body = group(i) + (f !== undefined ? ',' + f : '');
  const isZero = /^[0,]+$/.test(s.replace(/\./g, ''));
  return (x < 0 && !isZero ? MINUS : '') + body;
}

/** Número con signo explícito: «+9,4», «−0,2», «0,0». */
export function signed(x: number, d = 0): string {
  const s = num(x, d);
  if (s === '—') return s;
  return x > 0 && !/^[0,]+$/.test(s.replace(/\./g, '')) ? '+' + s : s;
}

/** Cifra y unidad separadas por un espacio fino duro: «3.010 t/año». */
export function unit(x: number, d: number, u: string): string {
  return num(x, d) + THIN + u;
}

/** Porcentaje a partir de un tanto por uno: pct(0.079) → «7,9 %». */
export function pct(frac: number, d = 1): string {
  if (!Number.isFinite(frac)) return '—';
  return num(frac * 100, d) + THIN + '%';
}

/** Millones de euros: «61,6 M€». */
export function meur(x: number, d = 1, withSign = false): string {
  if (!Number.isFinite(x)) return '—';
  return (withSign ? signed(x, d) : num(x, d)) + THIN + 'M€';
}

/** Años con decimal: «9,3 años». */
export function years(x: number, d = 1): string {
  if (!Number.isFinite(x)) return 'no recupera';
  return num(x, d) + THIN + 'años';
}

/** Sustituye subíndices y superíndices químicos por etiquetas HTML, para que los pinte la fuente de la web. */
export function chem(s: string): string {
  return s
    .replace(/[₀-₉]+/g, m => '<sub>' + [...m].map(c => String(c.charCodeAt(0) - 0x2080)).join('') + '</sub>')
    .replace(/⁺/g, '<sup>+</sup>');
}
