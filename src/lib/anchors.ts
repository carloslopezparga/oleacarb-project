/* Anclas: carga en frío con hash (QR de la memoria), clics en la navegación y ← → entre secciones. */
import { getLenis, reduced, ScrollTrigger } from './motion';

export const SECTION_IDS = ['inicio', 'reto', 'territorio', 'viaje', 'proceso', 'planta', 'balances',
  'calendario', 'simulador', 'impacto', 'video', 'fuentes'] as const;

export function headerHeight(): number {
  const h = document.querySelector<HTMLElement>('.site-head');
  return h ? h.getBoundingClientRect().height : 56;
}

/** Desfase de llegada: el scroll-margin-top de la sección (en las secciones con relleno, la cabecera menos ese
 *  relleno, para que se vean el título y los primeros controles) o, si no lo hay, el alto de la cabecera. */
function anchorOffset(el: HTMLElement): number {
  const sm = parseFloat(getComputedStyle(el).scrollMarginTop);
  return Number.isFinite(sm) && sm !== 0 ? sm : headerHeight();
}

/** Desplaza hasta la sección dejando su titular justo bajo la cabecera fija. */
export function scrollToId(id: string, immediate = false): void {
  const el = document.getElementById(id);
  if (!el) return;
  const off = id === 'inicio' ? 0 : anchorOffset(el);
  const lenis = getLenis();
  if (lenis) {
    // Lenis guarda el alto de la página: tras montar los fijados de GSAP hay que recalcularlo.
    lenis.resize();
    lenis.scrollTo(el, { offset: -off, immediate: immediate || reduced, force: true, duration: 1.1 });
  } else {
    const y = Math.max(0, el.getBoundingClientRect().top + window.scrollY - off);
    window.scrollTo({ top: y, behavior: immediate || reduced ? 'instant' : 'smooth' });
  }
  if (immediate) ScrollTrigger.update();
}

let userMoved = false;

declare global { interface Window { __fontsOn?: Promise<void> } }

/** Carga con hash (QR de la memoria).
 *  1. Salta en cuanto ScrollTrigger ha montado el fijado del viaje.
 *  2. Las fuentes web se activan tras el primer fotograma y llegan después: al cargar cambian el alto de lo que hay
 *     encima y empujarían la sección. Se vuelve a saltar cuando llegan y, durante unos segundos, cada vez que cambia
 *     el alto de la página, salvo que la persona ya haya movido la página. */
export async function settleInitialHash(): Promise<void> {
  const id = decodeURIComponent(location.hash.slice(1));
  const target = id ? document.getElementById(id) : null;
  if (!target) { document.documentElement.dataset.anchored = 'none'; return; }
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const mark = () => { userMoved = true; };
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(ev => window.addEventListener(ev, mark, { once: true, passive: true }));
  const settle = () => { if (!userMoved) { ScrollTrigger.refresh(); scrollToId(id, true); } };

  ScrollTrigger.refresh();
  scrollToId(id, true);

  // Mantener el anclaje mientras la maquetación se asienta (fuentes, imágenes, islas)
  const main = document.querySelector('main');
  if (main && 'ResizeObserver' in window) {
    let last = main.offsetHeight, raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { const h = main.offsetHeight; if (h !== last) { last = h; settle(); } });
    });
    ro.observe(main);
    setTimeout(() => ro.disconnect(), 10000);
  }
  try { await window.__fontsOn; } catch { /* */ }
  void document.body.offsetHeight;          // fuerza la maquetación para que se pidan las fuentes
  try { await document.fonts.ready; } catch { /* sin Font Loading API */ }
  settle();
  document.documentElement.dataset.anchored = id;
  if (document.readyState === 'complete') setTimeout(settle, 60);
  else window.addEventListener('load', () => setTimeout(settle, 60), { once: true });
}

export function bindAnchorLinks(): void {
  document.addEventListener('click', (e) => {
    const a = (e.target as Element | null)?.closest?.('a[href^="#"], a[href^="/#"]') as HTMLAnchorElement | null;
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const href = a.getAttribute('href') || '';
    const id = href.slice(href.indexOf('#') + 1);
    if (!id || !document.getElementById(id)) return;
    e.preventDefault();
    history.pushState(null, '', '#' + id);
    scrollToId(id);
    const t = document.getElementById(id);
    // Mueve el foco a la sección para que el teclado y los lectores sigan el salto.
    const h = t?.querySelector<HTMLElement>('h1, h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  });
  window.addEventListener('popstate', () => {
    const id = location.hash.slice(1);
    if (id) scrollToId(id, true);
  });
}

/** ← y → saltan de sección en sección (útil al proyectar en la defensa). */
export function bindSectionKeys(): void {
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const t = e.target as HTMLElement;
    if (t && t !== document.body && !t.matches('h1[tabindex], h2[tabindex], section')) return;
    if (document.documentElement.classList.contains('menu-open')) return;
    const y = window.scrollY + headerHeight() + 4;
    const tops = SECTION_IDS.map(id => {
      const el = document.getElementById(id);
      return el ? el.getBoundingClientRect().top + window.scrollY : Infinity;
    });
    let cur = 0;
    tops.forEach((top, i) => { if (top <= y + 2) cur = i; });
    const next = e.key === 'ArrowRight' ? Math.min(cur + 1, SECTION_IDS.length - 1) : Math.max(cur - 1, 0);
    if (next !== cur) { e.preventDefault(); history.replaceState(null, '', '#' + SECTION_IDS[next]); scrollToId(SECTION_IDS[next]); }
  });
}
