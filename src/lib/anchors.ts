/* Anclas: carga en frío con hash (QR de la memoria), clics en la navegación y ← → entre secciones. */
import { getLenis, reduced, ScrollTrigger } from './motion';

export const SECTION_IDS = ['inicio', 'reto', 'territorio', 'viaje', 'proceso', 'planta', 'balances',
  'calendario', 'simulador', 'impacto', 'video', 'equipo', 'fuentes'] as const;

export function headerHeight(): number {
  const h = document.querySelector<HTMLElement>('.site-head');
  return h ? h.getBoundingClientRect().height : 56;
}

/** Desplaza hasta la sección dejando su titular justo bajo la cabecera fija. */
export function scrollToId(id: string, immediate = false): void {
  const el = document.getElementById(id);
  if (!el) return;
  const off = id === 'inicio' ? 0 : headerHeight();
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(el, { offset: -off, immediate: immediate || reduced, force: true, duration: 1.1 });
  } else {
    const y = Math.max(0, el.getBoundingClientRect().top + window.scrollY - off);
    window.scrollTo({ top: y, behavior: immediate || reduced ? 'instant' : 'smooth' });
  }
}

let userMoved = false;

/** Carga con hash: espera a las fuentes y a que ScrollTrigger monte los fijados, y luego salta sin animación. */
export async function settleInitialHash(): Promise<void> {
  const id = decodeURIComponent(location.hash.slice(1));
  const target = id ? document.getElementById(id) : null;
  if (!target) { document.documentElement.dataset.anchored = 'none'; return; }
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const mark = () => { userMoved = true; };
  ['wheel', 'touchstart', 'keydown'].forEach(ev => window.addEventListener(ev, mark, { once: true, passive: true }));

  try { await document.fonts.ready; } catch { /* sin Font Loading API */ }
  ScrollTrigger.refresh();
  scrollToId(id, true);
  // Un segundo ajuste por si algo de arriba cambió de alto mientras cargaban imágenes.
  requestAnimationFrame(() => { if (!userMoved) scrollToId(id, true); });
  document.documentElement.dataset.anchored = id;
  const again = () => { if (!userMoved) { ScrollTrigger.refresh(); scrollToId(id, true); } };
  if (document.readyState === 'complete') setTimeout(again, 60);
  else window.addEventListener('load', () => setTimeout(again, 60), { once: true });
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
